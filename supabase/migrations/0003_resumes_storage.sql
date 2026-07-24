-- CV Trail — Resume Vault storage bucket
-- Generated tailored-resume PDFs (and manually uploaded resume files) live
-- here, one folder per user: resumes/<user_id>/<file>.

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy "own resume files only" on storage.objects
  for all using (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );
