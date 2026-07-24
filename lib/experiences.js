'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from './supabase/client';

export function useExperiences() {
  const [supabase] = useState(() => createClient());
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('experiences')
      .select('*')
      .order('start_date', { ascending: false, nullsFirst: false });
    if (err) {
      setError(err.message);
    } else {
      setError(null);
      setExperiences(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addExperience = useCallback(
    async (exp) => {
      const { error: err } = await supabase.from('experiences').insert(exp);
      if (err) throw new Error(err.message);
      await refresh();
    },
    [supabase, refresh]
  );

  const updateExperience = useCallback(
    async (id, patch) => {
      const { error: err } = await supabase.from('experiences').update(patch).eq('id', id);
      if (err) throw new Error(err.message);
      await refresh();
    },
    [supabase, refresh]
  );

  const deleteExperience = useCallback(
    async (id) => {
      const { error: err } = await supabase.from('experiences').delete().eq('id', id);
      if (err) throw new Error(err.message);
      await refresh();
    },
    [supabase, refresh]
  );

  const addExperiences = useCallback(
    async (list) => {
      if (!list.length) return;
      const { error: err } = await supabase.from('experiences').insert(list);
      if (err) throw new Error(err.message);
      await refresh();
    },
    [supabase, refresh]
  );

  return {
    experiences,
    loading,
    error,
    addExperience,
    addExperiences,
    updateExperience,
    deleteExperience,
  };
}
