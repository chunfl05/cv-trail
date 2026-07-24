'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createClient } from './supabase/client';

export const STATUS_ORDER = ['applied', 'screening', 'interview', 'offer', 'closed'];

const ApplicationsContext = createContext(null);

export function ApplicationsProvider({ children }) {
  const [supabase] = useState(() => createClient());
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('applications')
      .select('*')
      .order('applied_date', { ascending: false, nullsFirst: false });
    if (err) {
      setError(err.message);
    } else {
      setError(null);
      setApplications(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addApplication = useCallback(
    async (app) => {
      const { error: err } = await supabase.from('applications').insert(app);
      if (err) throw new Error(err.message);
      await refresh();
    },
    [supabase, refresh]
  );

  const updateApplication = useCallback(
    async (id, patch) => {
      const { error: err } = await supabase.from('applications').update(patch).eq('id', id);
      if (err) throw new Error(err.message);
      await refresh();
    },
    [supabase, refresh]
  );

  const deleteApplication = useCallback(
    async (id) => {
      const { error: err } = await supabase.from('applications').delete().eq('id', id);
      if (err) throw new Error(err.message);
      await refresh();
    },
    [supabase, refresh]
  );

  const cycleApplicationStatus = useCallback(
    async (id) => {
      const app = applications.find((a) => a.id === id);
      if (!app) return;
      const next = STATUS_ORDER[(STATUS_ORDER.indexOf(app.status) + 1) % STATUS_ORDER.length];
      await updateApplication(id, { status: next });
    },
    [applications, updateApplication]
  );

  const value = {
    applications,
    loading,
    error,
    addApplication,
    updateApplication,
    deleteApplication,
    cycleApplicationStatus,
    refresh,
  };

  return <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>;
}

export function useApplications() {
  const ctx = useContext(ApplicationsContext);
  if (!ctx) throw new Error('useApplications must be used inside <ApplicationsProvider>');
  return ctx;
}
