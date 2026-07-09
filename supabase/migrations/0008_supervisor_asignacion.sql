-- =========================================================
-- 0008_supervisor_asignacion.sql
-- Permite asignar cada mesero/cocinero a un supervisor
-- específico. Si queda null, cualquier supervisor lo ve
-- (útil mientras el negocio es chico y solo hay un turno).
-- =========================================================

alter table profiles
  add column supervisor_id uuid references profiles(id) on delete set null;

create index idx_profiles_supervisor on profiles (supervisor_id);
