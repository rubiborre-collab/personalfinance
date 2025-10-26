import { supabase } from '../lib/supabase';
import { getMovements, createMovement, type MovementWithDetails } from './movements';
import { getAccounts } from './accounts';
import { getCategories } from './categories';
import { formatDate } from '../lib/utils';
import type { MovementType, FixedFlag } from '../lib/database.types';

export async function exportMovementsToCSV(): Promise<string> {
  const movements = await getMovements({});

  const headers = ['Fecha', 'Tipo', 'Importe', 'Cuenta', 'Categoría', 'Fijo/Variable', 'Nota'];
  const rows = [headers.join(',')];

  movements.forEach((m) => {
    const row = [
      formatDate(m.date),
      m.type === 'income' ? 'Ingreso' : m.type === 'expense' ? 'Gasto' : 'Transferencia',
      m.amount.toString(),
      m.type === 'transfer'
        ? `${m.account_from?.name} → ${m.account_to?.name}`
        : m.account?.name || '',
      m.category?.name || '',
      m.fixed_var === 'fixed' ? 'Fijo' : m.fixed_var === 'variable' ? 'Variable' : '',
      m.note ? `"${m.note.replace(/"/g, '""')}"` : '',
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface ParsedMovement {
  date: string;
  type: 'income' | 'expense';
  amount: number;
  account: string;
  category: string;
  fixedVar: 'fixed' | 'variable' | null;
  note: string | null;
}

export async function parseCSV(content: string): Promise<ParsedMovement[]> {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('El archivo CSV está vacío o no tiene datos');
  }

  const movements: ParsedMovement[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    if (values.length < 6) {
      throw new Error(`Línea ${i + 1}: formato inválido (faltan columnas)`);
    }

    const dateStr = values[0];
    const typeStr = values[1].toLowerCase();
    const amountStr = values[2];
    const account = values[3];
    const category = values[4];
    const fixedVarStr = values[5].toLowerCase();
    const note = values[6] || null;

    if (typeStr.includes('transfer')) {
      continue;
    }

    const type = typeStr.includes('ingreso') ? 'income' : 'expense';

    const dateParts = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!dateParts) {
      throw new Error(`Línea ${i + 1}: formato de fecha inválido. Usa DD/MM/AAAA`);
    }

    const [, day, month, year] = dateParts;
    const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

    const amount = parseFloat(amountStr.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      throw new Error(`Línea ${i + 1}: importe inválido`);
    }

    const fixedVar = fixedVarStr.includes('fijo') ? 'fixed' :
                     fixedVarStr.includes('variable') ? 'variable' : null;

    movements.push({
      date,
      type,
      amount,
      account,
      category,
      fixedVar,
      note,
    });
  }

  return movements;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

export async function validateAndImportMovements(movements: ParsedMovement[]): Promise<{
  success: number;
  errors: string[];
}> {
  const accounts = await getAccounts();
  const categories = await getCategories();

  const accountMap = new Map(accounts.map(a => [a.name.toLowerCase(), a.id]));
  const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

  let success = 0;
  const errors: string[] = [];

  for (let i = 0; i < movements.length; i++) {
    const m = movements[i];
    const lineNum = i + 2;

    try {
      const accountId = accountMap.get(m.account.toLowerCase());
      if (!accountId) {
        errors.push(`Línea ${lineNum}: cuenta "${m.account}" no encontrada`);
        continue;
      }

      const categoryId = categoryMap.get(m.category.toLowerCase());
      if (!categoryId) {
        errors.push(`Línea ${lineNum}: categoría "${m.category}" no encontrada`);
        continue;
      }

      await createMovement({
        date: m.date,
        type: m.type,
        amount: m.amount,
        account_id: accountId,
        category_id: categoryId,
        fixed_var: m.fixedVar,
        note: m.note,
      });

      success++;
    } catch (error: any) {
      errors.push(`Línea ${lineNum}: ${error.message}`);
    }
  }

  return { success, errors };
}
