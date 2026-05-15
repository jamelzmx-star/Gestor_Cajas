-- ══════════════════════════════════════════════════════════════
-- SISTEMA DE CONTROL DE CAJAS — Setup de Supabase
-- ══════════════════════════════════════════════════════════════
-- 1. Ve a tu proyecto en supabase.com
-- 2. Clic en "SQL Editor"
-- 3. Pega TODO este archivo y ejecuta
-- ══════════════════════════════════════════════════════════════


-- ──────────────────────────────────────────────────────────────
-- TABLA: profiles
-- Extiende la tabla de usuarios de Supabase Auth
-- ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id               uuid references auth.users(id) on delete cascade primary key,
  email            text not null,
  nombre           text,
  es_admin         boolean not null default false,
  activo           boolean not null default false,  -- inactivo hasta que admin apruebe
  plan             text not null default 'mensual', -- 'mensual' | 'anual'
  suscripcion_desde date default current_date,
  suscripcion_hasta date,                           -- null = sin vencimiento
  notas            text,                            -- notas internas del admin
  created_at       timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────
-- SEGURIDAD: Row Level Security
-- ──────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- El usuario puede leer su propio perfil
create policy "usuario_lee_su_perfil"
  on public.profiles for select
  using (auth.uid() = id);

-- El admin puede leer todos los perfiles
create policy "admin_lee_todos"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and es_admin = true
    )
  );

-- El admin puede modificar todos los perfiles
create policy "admin_modifica_todos"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and es_admin = true
    )
  );

-- El admin puede eliminar perfiles
create policy "admin_elimina"
  on public.profiles for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and es_admin = true
    )
  );


-- ──────────────────────────────────────────────────────────────
-- FUNCIÓN + TRIGGER: crear perfil automáticamente al registrarse
-- ──────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre, activo)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'nombre',
      split_part(new.email, '@', 1)
    ),
    false  -- siempre inactivo hasta que el admin lo active
  );
  return new;
end;
$$;

-- Asegurarse de no duplicar el trigger
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ══════════════════════════════════════════════════════════════
-- PASO FINAL — Después de ejecutar esto:
--
-- 1. Crea tu cuenta en la app (regístrate normalmente)
-- 2. Copia tu User ID desde Supabase → Authentication → Users
-- 3. Ejecuta este comando reemplazando el email:
-- ══════════════════════════════════════════════════════════════

-- ⚠️ CAMBIA 'tu@email.com' por tu email real
update public.profiles
set
  es_admin         = true,
  activo           = true,
  suscripcion_hasta = '2099-12-31',
  nombre           = 'Admin'
where email = 'trabajscolar@gmail.com';
