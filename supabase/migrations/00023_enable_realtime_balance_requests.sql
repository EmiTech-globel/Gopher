do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'balance_requests'
  ) then
    alter publication supabase_realtime add table balance_requests;
  end if;
end $$;