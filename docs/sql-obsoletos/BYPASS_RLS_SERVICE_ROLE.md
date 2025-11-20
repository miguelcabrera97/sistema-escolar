# SOLUCIÓN: Usar Service Role Key

El problema es que las políticas RLS están bloqueando TODAS las operaciones, incluso con RLS deshabilitado. Esto sugiere que hay políticas a nivel de proyecto o que el caché de Supabase no se ha actualizado.

## Opción 1: Usar Service Role en el código (Solo para desarrollo)

Necesitas crear un cliente de Supabase que use el `SUPABASE_SERVICE_ROLE_KEY` en lugar del `ANON_KEY` para operaciones administrativas.

### Paso 1: Verificar que tienes la Service Role Key

Ve a tu proyecto de Supabase:
1. Project Settings → API
2. Copia el valor de `service_role` key (empieza con `eyJ...`)
3. Agrégala a tu `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### Paso 2: Crear un cliente con Service Role

Crea un nuevo archivo: `lib/supabase-admin.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

### Paso 3: Usar el cliente admin en pagos-actions.ts

En la función `crearPago`, cambia:
```typescript
const supabase = await createServerSupabaseClient()
```

Por:
```typescript
import { supabaseAdmin } from '@/lib/supabase-admin'
const supabase = supabaseAdmin
```

**ADVERTENCIA:** Solo usa service_role para operaciones administrativas. Nunca expongas esta key en el cliente.

## Opción 2: Reiniciar el proyecto de Supabase

A veces el caché de políticas se queda atascado. Intenta:

1. En Supabase Dashboard → Project Settings → General
2. Scroll hasta "Pause project"
3. Pausa el proyecto por 30 segundos
4. Reanuda el proyecto

Esto limpia el caché y las políticas se recargan.

## Opción 3: Eliminar TODAS las políticas manualmente

```sql
-- Eliminar políticas de pagos
DROP POLICY IF EXISTS "Directivos pueden insertar pagos" ON pagos;
DROP POLICY IF EXISTS "Directivos pueden ver pagos" ON pagos;
DROP POLICY IF EXISTS "Directivos pueden actualizar pagos" ON pagos;
DROP POLICY IF EXISTS "Directivos pueden eliminar pagos" ON pagos;
DROP POLICY IF EXISTS "Padres pueden ver sus pagos" ON pagos;
DROP POLICY IF EXISTS "Padres pueden actualizar sus pagos" ON pagos;

-- Verificar que no hay políticas
SELECT * FROM pg_policies WHERE tablename = 'pagos';

-- Si hay políticas, elimínalas todas
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE tablename = 'pagos'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;
```

## ¿Cuál opción recomiendas?

Para seguir trabajando AHORA: **Opción 1** (Service Role)
Para producción: **Opción 2** o **Opción 3** + configurar políticas correctamente
