/*
  # Creación de base de datos para app de finanzas personales

  1. Enums
    - `movement_type`: income, expense, transfer
    - `category_kind`: income, expense
    - `fixed_flag`: fixed, variable
    - `account_type`: bank, cash, broker, roboadvisor, ewallet, credit_card

  2. Tablas
    - `accounts`: Cuentas de patrimonio con saldo de apertura
    - `categories`: Categorías de ingresos/gastos con indicador fijo/variable
    - `movements`: Movimientos (ingresos, gastos, transferencias)
    - `snapshots`: Capturas manuales de saldo por cuenta
    - `settings`: Preferencias del usuario
    - `day_notes`: Notas diarias para el diario
    - `recurring_templates`: Plantillas de movimientos recurrentes

  3. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas restrictivas por propietario (auth.uid())
    - Constraints para integridad de datos
    
  4. Índices
    - Optimización para consultas por owner_id, date, type
*/

-- Crear enums
CREATE TYPE movement_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE category_kind AS ENUM ('income', 'expense');
CREATE TYPE fixed_flag AS ENUM ('fixed', 'variable');
CREATE TYPE account_type AS ENUM ('bank', 'cash', 'broker', 'roboadvisor', 'ewallet', 'credit_card');

-- Tabla ACCOUNTS
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type account_type NOT NULL,
  opening_balance numeric(14,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_owner ON public.accounts(owner_id);

-- Tabla CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  kind category_kind NOT NULL,
  is_fixed boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, name, kind)
);

CREATE INDEX IF NOT EXISTS idx_categories_owner ON public.categories(owner_id);

-- Tabla MOVEMENTS
CREATE TABLE IF NOT EXISTS public.movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  type movement_type NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  account_id uuid REFERENCES public.accounts(id) ON DELETE RESTRICT,
  account_from_id uuid REFERENCES public.accounts(id) ON DELETE RESTRICT,
  account_to_id uuid REFERENCES public.accounts(id) ON DELETE RESTRICT,
  category_id uuid REFERENCES public.categories(id) ON DELETE RESTRICT,
  fixed_var fixed_flag,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (type = 'transfer' AND account_from_id IS NOT NULL AND account_to_id IS NOT NULL AND category_id IS NULL AND account_id IS NULL)
    OR (type IN ('income','expense') AND account_id IS NOT NULL AND category_id IS NOT NULL AND account_from_id IS NULL AND account_to_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_movements_owner_date ON public.movements(owner_id, date);
CREATE INDEX IF NOT EXISTS idx_movements_owner_type ON public.movements(owner_id, type);

-- Tabla SNAPSHOTS
CREATE TABLE IF NOT EXISTS public.snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  date date NOT NULL,
  balance numeric(14,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, account_id, date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_owner_date ON public.snapshots(owner_id, date);

-- Tabla SETTINGS
CREATE TABLE IF NOT EXISTS public.settings (
  owner_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'Europe/Madrid',
  date_format text NOT NULL DEFAULT 'DD/MM/YYYY',
  week_starts_on text NOT NULL DEFAULT 'monday'
);

-- Tabla DAY_NOTES
CREATE TABLE IF NOT EXISTS public.day_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id, date)
);

-- Tabla RECURRING_TEMPLATES
CREATE TABLE IF NOT EXISTS public.recurring_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type movement_type NOT NULL CHECK (type IN ('income','expense')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  day_of_month int NOT NULL CHECK (day_of_month BETWEEN 1 AND 28),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  fixed_var fixed_flag,
  note text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_owner_active ON public.recurring_templates(owner_id, active);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ACCOUNTS
CREATE POLICY "accounts_select_owner" ON public.accounts 
  FOR SELECT 
  TO authenticated 
  USING (owner_id = auth.uid());

CREATE POLICY "accounts_insert_owner" ON public.accounts 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "accounts_update_owner" ON public.accounts 
  FOR UPDATE 
  TO authenticated 
  USING (owner_id = auth.uid()) 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "accounts_delete_owner" ON public.accounts 
  FOR DELETE 
  TO authenticated 
  USING (owner_id = auth.uid());

-- Políticas RLS para CATEGORIES
CREATE POLICY "categories_select_owner" ON public.categories 
  FOR SELECT 
  TO authenticated 
  USING (owner_id = auth.uid());

CREATE POLICY "categories_insert_owner" ON public.categories 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "categories_update_owner" ON public.categories 
  FOR UPDATE 
  TO authenticated 
  USING (owner_id = auth.uid()) 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "categories_delete_owner" ON public.categories 
  FOR DELETE 
  TO authenticated 
  USING (owner_id = auth.uid());

-- Políticas RLS para MOVEMENTS
CREATE POLICY "movements_select_owner" ON public.movements 
  FOR SELECT 
  TO authenticated 
  USING (owner_id = auth.uid());

CREATE POLICY "movements_insert_owner" ON public.movements 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "movements_update_owner" ON public.movements 
  FOR UPDATE 
  TO authenticated 
  USING (owner_id = auth.uid()) 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "movements_delete_owner" ON public.movements 
  FOR DELETE 
  TO authenticated 
  USING (owner_id = auth.uid());

-- Políticas RLS para SNAPSHOTS
CREATE POLICY "snapshots_select_owner" ON public.snapshots 
  FOR SELECT 
  TO authenticated 
  USING (owner_id = auth.uid());

CREATE POLICY "snapshots_insert_owner" ON public.snapshots 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "snapshots_update_owner" ON public.snapshots 
  FOR UPDATE 
  TO authenticated 
  USING (owner_id = auth.uid()) 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "snapshots_delete_owner" ON public.snapshots 
  FOR DELETE 
  TO authenticated 
  USING (owner_id = auth.uid());

-- Políticas RLS para SETTINGS
CREATE POLICY "settings_select_owner" ON public.settings 
  FOR SELECT 
  TO authenticated 
  USING (owner_id = auth.uid());

CREATE POLICY "settings_insert_owner" ON public.settings 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "settings_update_owner" ON public.settings 
  FOR UPDATE 
  TO authenticated 
  USING (owner_id = auth.uid()) 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "settings_delete_owner" ON public.settings 
  FOR DELETE 
  TO authenticated 
  USING (owner_id = auth.uid());

-- Políticas RLS para DAY_NOTES
CREATE POLICY "day_notes_select_owner" ON public.day_notes 
  FOR SELECT 
  TO authenticated 
  USING (owner_id = auth.uid());

CREATE POLICY "day_notes_insert_owner" ON public.day_notes 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "day_notes_update_owner" ON public.day_notes 
  FOR UPDATE 
  TO authenticated 
  USING (owner_id = auth.uid()) 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "day_notes_delete_owner" ON public.day_notes 
  FOR DELETE 
  TO authenticated 
  USING (owner_id = auth.uid());

-- Políticas RLS para RECURRING_TEMPLATES
CREATE POLICY "recurring_templates_select_owner" ON public.recurring_templates 
  FOR SELECT 
  TO authenticated 
  USING (owner_id = auth.uid());

CREATE POLICY "recurring_templates_insert_owner" ON public.recurring_templates 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "recurring_templates_update_owner" ON public.recurring_templates 
  FOR UPDATE 
  TO authenticated 
  USING (owner_id = auth.uid()) 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "recurring_templates_delete_owner" ON public.recurring_templates 
  FOR DELETE 
  TO authenticated 
  USING (owner_id = auth.uid());