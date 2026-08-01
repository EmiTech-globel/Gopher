do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'scouts'
  ) then
    alter publication supabase_realtime add table scouts;
  end if;
end $$;