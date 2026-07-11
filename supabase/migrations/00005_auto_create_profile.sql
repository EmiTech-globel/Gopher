-- Auto-create a profiles row the moment a new auth.users record exists,
-- since email confirmation is enabled and no client session exists yet
-- at signup time to satisfy the profiles_own_insert RLS policy.

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, phone, department)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'department'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
