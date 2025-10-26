/*
  # Datos iniciales para demostración (opcional)

  1. Configuración
    - Función para insertar datos de ejemplo por usuario

  2. Notas
    - Este seed es opcional y solo se ejecuta si el usuario no tiene datos
    - Incluye cuentas, categorías de ejemplo
    - NO se ejecuta automáticamente, requiere llamada manual
*/

-- Función para insertar datos de ejemplo para un usuario
CREATE OR REPLACE FUNCTION seed_user_data(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar si el usuario ya tiene datos
  IF EXISTS (SELECT 1 FROM public.accounts WHERE owner_id = user_id) THEN
    RAISE NOTICE 'El usuario ya tiene datos, no se insertará nada';
    RETURN;
  END IF;

  -- Insertar configuración por defecto
  INSERT INTO public.settings (owner_id, timezone, date_format, week_starts_on)
  VALUES (user_id, 'Europe/Madrid', 'DD/MM/YYYY', 'monday')
  ON CONFLICT (owner_id) DO NOTHING;

  -- Insertar cuentas de ejemplo
  INSERT INTO public.accounts (owner_id, name, type, opening_balance) VALUES
    (user_id, 'Banco Santander', 'bank', 1000.00),
    (user_id, 'MyInvestor', 'bank', 5000.00),
    (user_id, 'InbestMe', 'roboadvisor', 10000.00),
    (user_id, 'Interactive Brokers', 'broker', 15000.00),
    (user_id, 'Efectivo', 'cash', 500.00);

  -- Insertar categorías de ingresos
  INSERT INTO public.categories (owner_id, name, kind, is_fixed) VALUES
    (user_id, 'Nómina', 'income', true),
    (user_id, 'Bonus', 'income', false),
    (user_id, 'Freelance', 'income', false),
    (user_id, 'Inversiones', 'income', false);

  -- Insertar categorías de gastos
  INSERT INTO public.categories (owner_id, name, kind, is_fixed) VALUES
    (user_id, 'Alquiler', 'expense', true),
    (user_id, 'Hipoteca', 'expense', true),
    (user_id, 'Suscripciones', 'expense', true),
    (user_id, 'Seguros', 'expense', true),
    (user_id, 'Supermercado', 'expense', false),
    (user_id, 'Restaurantes', 'expense', false),
    (user_id, 'Transporte', 'expense', false),
    (user_id, 'Gasolina', 'expense', false),
    (user_id, 'Ocio', 'expense', false),
    (user_id, 'Ropa', 'expense', false),
    (user_id, 'Salud', 'expense', false),
    (user_id, 'Educación', 'expense', false),
    (user_id, 'Hogar', 'expense', false),
    (user_id, 'Otros', 'expense', false);

  RAISE NOTICE 'Datos de ejemplo insertados correctamente';
END;
$$;

-- Comentario: Para usar esta función, ejecuta desde tu aplicación:
-- SELECT seed_user_data('user-uuid-here');
