# Guía de pruebas de RLS

No hay forma honesta de "probar sola" la seguridad por rol — hay que
intentar romperla a propósito. Esta guía te da los pasos exactos para
hacerlo desde el SQL Editor de Supabase (rápido, sin necesitar la app) y
desde la app misma (para confirmar que la experiencia real también bloquea).

## Cómo se prueba en el SQL Editor (rápido, recomendado primero)

Supabase te deja "impersonar" un usuario en el SQL Editor con esto:

```sql
-- Reemplaza el UUID por el id real de un usuario de prueba (tabla profiles)
select set_config('request.jwt.claims', json_build_object(
  'sub', 'UUID-DEL-USUARIO-MESERO',
  'role', 'authenticated'
)::text, true);

set role authenticated;

-- A partir de aquí, las queries siguientes corren CON las políticas RLS
-- aplicadas, como si fueras ese usuario.
select * from ingredients; -- ¿debería poder ver esto un mesero? sí, solo lectura
```

Para volver a tener permisos de administrador en el SQL Editor:

```sql
reset role;
```

## Checklist de pruebas por rol

Crea un usuario de prueba de cada rol (nombres sugeridos: `test-mesero`,
`test-cocina`, `test-supervisor`, `test-propietario`) y corre esto:

### Como MESERO

- [ ] `select * from ingredients` → debe funcionar (lectura permitida a todos)
- [ ] `select * from orders` → solo debe ver **sus propias** órdenes, no las de otros meseros
- [ ] `insert into orders (mesero_id, status, total) values (auth.uid(), 'pendiente', 100)` → debe funcionar
- [ ] `insert into orders (mesero_id, status, total) values ('OTRO-UUID', 'pendiente', 100)` → debe **fallar** (no puede crear órdenes a nombre de otro mesero)
- [ ] `update orders set status = 'lista' where id = '...'` → debe **fallar** (un mesero no cambia el estado de una orden)
- [ ] `update ingredients set stock_grams = 999999` → debe **fallar** (solo el propietario administra ingredientes)
- [ ] `insert into products (...)` → debe **fallar**

### Como COCINA

- [ ] `select * from orders` → debe ver **todas** las órdenes (no solo las propias, cocina no tiene "propias")
- [ ] `update orders set status = 'lista' where id = '...'` → debe funcionar
- [ ] `insert into orders (...)` → debe **fallar** (cocina no crea órdenes)
- [ ] `update ingredients set stock_grams = 999999` → debe **fallar**
- [ ] `delete from profiles where id = '...'` → debe **fallar**

### Como SUPERVISOR

- [ ] `select * from orders` → debe ver todas
- [ ] `update orders set status = 'lista'` → debe funcionar
- [ ] `select cancelar_orden('UUID-DE-UNA-ORDEN')` → debe funcionar y devolver el inventario
- [ ] `insert into flavors (...)` → debe funcionar (supervisor sí administra sabores)
- [ ] `insert into ingredients (...)` → debe **fallar** (eso es solo del propietario)
- [ ] `update profiles set role = 'propietario' where id = auth.uid()` → debe **fallar** (que nadie se autoascienda)

### Como PROPIETARIO

- [ ] Todo lo anterior debe funcionar sin excepción
- [ ] `select * from profiles` → debe ver todos los perfiles, no solo el suyo

## Pruebas desde la app misma (confirma la experiencia real)

1. Inicia sesión como mesero → intenta navegar directo a `/propietario` o
   `/cocina` escribiendo la URL — el middleware debe redirigirte a tu
   propio dashboard, no dejarte entrar.
2. Inicia sesión como mesero → abre las herramientas de desarrollador del
   navegador (F12) → en la consola, intenta:
   ```js
   const { createClient } = await import('/_next/static/...'); // no aplica directo,
   // pero la idea es: aunque alguien manipule el fetch a mano, RLS debe
   // bloquear del lado de la base de datos, no solo del lado de la UI.
   ```
   Más simple: usa la pestaña "Network" del navegador, copia la petición a
   Supabase que hace la app, y repítela cambiando el `mesero_id` por otro —
   debe regresar error 403/RLS violation, no datos.
3. Crea una orden como mesero → cierra sesión → entra como otro mesero →
   confirma que NO ves la orden del primero en tu propio historial (si en
   el futuro agregas un "mis ventas" por mesero).
4. Desactiva un empleado desde `/propietario/usuarios` → confirma que ese
   empleado ya no puede iniciar sesión (debe ver el mensaje "cuenta
   desactivada").

## Qué hacer si algo falla

Si alguna prueba de "debe fallar" en realidad funciona, el problema está en
la política RLS de esa tabla — revisa `supabase/migrations/0002_rls.sql` y
compara la condición `using`/`with check` contra lo que acabas de probar.
Si algo que "debe funcionar" está fallando, primero revisa que el usuario
de prueba tenga un `role` correcto en la tabla `profiles`.
