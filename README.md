# Pizzería — Sistema administrativo

Next.js 14 (App Router) + TypeScript + Tailwind + Supabase, pensado para correr
cómodamente en el free tier de Supabase.

## 1. Instalar dependencias

```bash
npm install
```

## 2. Crear el proyecto en Supabase

1. Ve a https://supabase.com y crea un proyecto (plan Free).
2. En **Project Settings > API** copia:
   - `Project URL`
   - `anon public key`
   - `service_role key` (solo se usa en servidor, nunca la expongas al cliente)
3. Copia `.env.local.example` a `.env.local` y llena los tres valores.

## 3. Aplicar las migraciones

Con el [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

Esto crea, en orden:

- `0001_schema.sql` — tablas (profiles, ingredients, products, flavors, recipes, orders, order_items)
- `0002_rls.sql` — Row Level Security por rol (propietario/supervisor/cocina/mesero)
- `0003_functions.sql` — funciones RPC:
  - `crear_orden(items)` — crea orden + items y descuenta inventario en una sola transacción
  - `get_ventas_hoy()` — ventas agregadas del día (evita traer todas las órdenes al cliente)
  - `get_productos_top(limite)` — productos más vendidos
- `0004_grafica_functions.sql` — `get_ventas_por_dia(dias)`, agregado diario con
  días sin venta rellenados en 0 (para que la gráfica no tenga huecos)
- `0005_historial_functions.sql` — `get_ventas_rango(desde, hasta)` para el
  historial con filtros de fecha
- `0006_alertas_escasez.sql` — `crear_orden` ahora también devuelve qué
  ingredientes quedaron escasos tras la venta
- `0007_producibles_function.sql` — `get_producibles()`, cuántas piezas de
  cada producto/sabor se pueden hacer con el stock actual
- `0008_supervisor_asignacion.sql` — columna `supervisor_id` en `profiles`
  para vincular meseros/cocineros a un supervisor específico
- `0009_cancelar_orden.sql` — `cancelar_orden(orden_id)`, cancela y devuelve
  el inventario descontado

## 4. Crear usuarios y perfiles

Los usuarios se crean en **Authentication > Users** de Supabase (o vía API).
Después, inserta su fila correspondiente en `profiles` con el `role` correcto:

```sql
insert into profiles (id, name, role) values
  ('uuid-del-usuario', 'Juan Pérez', 'propietario');
```

## 5. Correr en desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 — te redirige a `/login` y de ahí a `/propietario`,
`/supervisor`, `/cocina` o `/mesero` según el rol del perfil.

## 6. Desplegar en Vercel

1. Sube este repo a GitHub/GitLab.
2. En Vercel, "Import Project" y selecciona el repo.
3. Agrega las mismas 3 variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) en
   **Project Settings > Environment Variables**.
4. Deploy.

## Estructura del proyecto

```
src/
  app/
    login/                    # página de login
    (dashboard)/
      propietario/            # métricas, control de producción, catálogo
      supervisor/             # seguimiento de pedidos + alerta 30 min
      cocina/                 # tablero de órdenes (realtime)
      mesero/                 # punto de venta (POS)
  components/
    pos/                      # componentes del punto de venta y supervisor
    cocina/                   # tablero de cocina
    ui/                       # nav-bar y componentes compartidos
  lib/
    supabase/                 # clientes (browser/server/middleware)
    auth.ts                   # helpers de sesión y roles
  types/
    database.ts               # tipos que reflejan el esquema de Supabase
supabase/
  migrations/                 # SQL versionado (schema, RLS, funciones)
```

## Principios de optimización aplicados

- **Nunca `select *`** — cada consulta pide solo las columnas que se muestran.
- **Cálculos derivados, no guardados**: "en proceso" a los 15 min, alerta de
  retraso a los 30 min, y pizzas disponibles por stock, se calculan al leer,
  no generan escrituras ni jobs en background.
- **RPC para operaciones compuestas**: crear una orden completa (orden + items
  + descuento de inventario) es **una sola llamada** a Postgres, transaccional
  y con bloqueo de filas (evita condiciones de carrera entre meseros).
- **Agregados en el servidor**: las métricas del propietario (ventas del día,
  top productos) se calculan con funciones SQL, así el cliente baja 1-5 filas
  en vez de miles de órdenes.
- **Realtime acotado**: cocina se suscribe solo a la tabla `orders`, no a cada
  `order_item` individualmente.

## Funcionalidades agregadas en esta ronda

- **Alerta de escasez en tiempo real** (`StockAlertListener`): toast en las
  pantallas de propietario y supervisor apenas un ingrediente cruza su
  umbral mínimo, sin refrescar la página. Además, `crear_orden` ya devuelve
  esta info al mesero al momento de vender.
- **Piezas producibles** (`/propietario/produccion`): tabla con cuántas
  piezas de cada producto/sabor se pueden hacer ahora mismo, calculada en
  Postgres a partir del ingrediente más limitante de la receta.
- **Bebidas con o sin sabor**: un refresco simple se agrega directo al
  carrito sin abrir modal; un agua fresca (con sabores definidos en el
  catálogo) sí pregunta el sabor. La receta de cualquier bebida (con o sin
  sabor) ya se puede cargar desde Catálogo → Recetas.
- **Gestión de empleados** (`/propietario/usuarios`): alta de meseros,
  cocineros y supervisores desde la UI (usa una Route Handler con la
  service_role key, nunca expuesta al navegador), activar/desactivar sin
  borrar su historial, y asignar cada mesero/cocinero a un supervisor.
- **Supervisión filtrada**: si un mesero tiene supervisor asignado, solo
  ese supervisor ve sus órdenes; si no tiene asignado, cualquier supervisor
  lo ve (pool compartido, útil con un solo turno).
- **Historial de cocina** (`/cocina/historial`): órdenes completadas hoy.
- **Cancelación de órdenes**: botón en el tablero del supervisor que
  cancela una orden y devuelve automáticamente el inventario que se había
  descontado (reversa exacta de `crear_orden`).

## Importante: variable de entorno adicional

La gestión de empleados requiere la `SUPABASE_SERVICE_ROLE_KEY` que ya
estaba en `.env.local.example` — asegúrate de tenerla configurada tanto en
local como en Vercel, o la creación de usuarios fallará.

## Próximos pasos sugeridos

- Paginación en el historial de ventas si crece mucho (ya usa `range()`,
  falta si algún día superas varias páginas por día).
- Reportes por empleado (ventas por mesero, tiempos promedio por cocinero).
- Notificaciones push/email (hoy la alerta de escasez es un toast en
  pantalla, no llega si nadie tiene la app abierta).

## Catálogo (`/propietario/catalogo`)

Tres pestañas, todas con escrituras dirigidas (nunca se re-sincroniza más de
lo necesario):

- **Ingredientes**: alta de materia prima (nombre, stock inicial, umbral
  mínimo) y un botón "+ Sumar" por fila para registrar compras en kg — suma
  al stock existente, no lo sobreescribe.
- **Productos**: alta por categoría (pizza/boneless/papas/bebida), precio y
  activar/desactivar sin borrar el histórico de ventas asociado.
- **Sabores**: alta de sabores por categoría (hawaiana, pepperoni, etc.),
  con toggle de activo/inactivo.
- **Recetas**: el corazón del control de producción. Eliges un producto,
  opcionalmente un sabor (o "Base" para ingredientes comunes a todos los
  sabores), y agregas manualmente cada ingrediente con sus gramos. Cada
  combinación producto+sabor carga y guarda solo su propia receta — nunca se
  trae la tabla completa de recetas al cliente.

## Gráficas del dashboard de métricas (`/propietario`)

- Línea de ventas de los últimos 7 días (`get_ventas_por_dia`, con huecos
  rellenados en 0 vía `generate_series` para que la gráfica no se vea rota).
- Barras horizontales de productos más vendidos (`get_productos_top`).
- Ambas gráficas reciben datos ya agregados por Postgres — nunca las
  órdenes crudas — así se mantienen ligeras incluso con miles de ventas
  acumuladas.
