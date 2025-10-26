/*
  # Arreglar eliminación en cascada para cuentas

  1. Cambios
    - Modificar foreign keys en tabla `movements` para permitir CASCADE en accounts
    - Esto permite eliminar cuentas incluso si tienen movimientos asociados
    - Los movimientos se eliminarán automáticamente cuando se elimine la cuenta

  2. Seguridad
    - Se mantienen todas las políticas RLS existentes
    - Solo afecta al comportamiento de eliminación
*/

-- Primero eliminamos las constraints existentes
ALTER TABLE public.movements 
  DROP CONSTRAINT IF EXISTS movements_account_id_fkey,
  DROP CONSTRAINT IF EXISTS movements_account_from_id_fkey,
  DROP CONSTRAINT IF EXISTS movements_account_to_id_fkey;

-- Recreamos las constraints con CASCADE
ALTER TABLE public.movements
  ADD CONSTRAINT movements_account_id_fkey 
    FOREIGN KEY (account_id) 
    REFERENCES public.accounts(id) 
    ON DELETE CASCADE;

ALTER TABLE public.movements
  ADD CONSTRAINT movements_account_from_id_fkey 
    FOREIGN KEY (account_from_id) 
    REFERENCES public.accounts(id) 
    ON DELETE CASCADE;

ALTER TABLE public.movements
  ADD CONSTRAINT movements_account_to_id_fkey 
    FOREIGN KEY (account_to_id) 
    REFERENCES public.accounts(id) 
    ON DELETE CASCADE;