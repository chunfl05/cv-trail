'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from './supabase/client';

export function useResumes() {
  const [supabase] = useState(() => createClient());
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('resumes')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setError(null);
      setResumes(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addResume = useCallback(
    async (r) => {
      const { error: err } = await supabase.from('resumes').insert(r);
      if (err) throw new Error(err.message);
      await refresh();
    },
    [supabase, refresh]
  );

  const updateResume = useCallback(
    async (id, patch) => {
      const { error: err } = await supabase.from('resumes').update(patch).eq('id', id);
      if (err) throw new Error(err.message);
      await refresh();
    },
    [supabase, refresh]
  );

  const deleteResume = useCallback(
    async (id) => {
      const { error: err } = await supabase.from('resumes').delete().eq('id', id);
      if (err) throw new Error(err.message);
      await refresh();
    },
    [supabase, refresh]
  );

  // Uploads a file into the user's own folder in the private `resumes` bucket
  // and returns the storage path to store as `file_url`.
  const uploadResumeFile = useCallback(
    async (file) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated.');
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: err } = await supabase.storage.from('resumes').upload(path, file);
      if (err) throw new Error(err.message);
      return path;
    },
    [supabase]
  );

  // `file_url` is a bucket-relative path for our own stored files, or a full
  // http(s) URL when the user pasted an external link instead of uploading.
  const getFileUrl = useCallback(
    async (fileUrl) => {
      if (!fileUrl) return null;
      if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
      const { data, error: err } = await supabase.storage
        .from('resumes')
        .createSignedUrl(fileUrl, 3600);
      if (err) throw new Error(err.message);
      return data.signedUrl;
    },
    [supabase]
  );

  return {
    resumes,
    loading,
    error,
    addResume,
    updateResume,
    deleteResume,
    uploadResumeFile,
    getFileUrl,
  };
}
