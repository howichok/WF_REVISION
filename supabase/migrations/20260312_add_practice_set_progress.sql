do $$
begin
  if not exists (
    select 1
    from pg_enum
    where enumlabel = 'practice-set'
      and enumtypid = 'public.revision_entity_type'::regtype
  ) then
    alter type public.revision_entity_type add value 'practice-set';
  end if;
end
$$;
