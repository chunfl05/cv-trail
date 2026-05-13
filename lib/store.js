'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { makeId } from './helpers';

const STORE_KEY = 'cv-trail-v4';

const defaultState = {
  applications: [],
  resumes: [],
  events: [],
  retros: [],
};

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  // Start with empty state so server and first client render match.
  // We hydrate from localStorage after mount.
  const [data, setData] = useState(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({ ...defaultState, ...parsed });
      }
    } catch (e) {
      // ignore
    }
    setHydrated(true);
  }, []);

  // Persist on every change after hydration.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORE_KEY,
        JSON.stringify({
          applications: data.applications,
          resumes: data.resumes,
          events: data.events,
          retros: data.retros,
        })
      );
    } catch (e) {
      // ignore — quota errors etc.
    }
  }, [data, hydrated]);

  // --- Applications ---
  const addApplication = useCallback((app) => {
    setData((d) => ({ ...d, applications: [{ id: makeId(), ...app }, ...d.applications] }));
  }, []);

  const updateApplication = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      applications: d.applications.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }, []);

  const deleteApplication = useCallback((id) => {
    setData((d) => ({ ...d, applications: d.applications.filter((a) => a.id !== id) }));
  }, []);

  const cycleApplicationStatus = useCallback((id) => {
    const order = ['applied', 'screening', 'interview', 'offer', 'rejected', 'ghosted'];
    setData((d) => ({
      ...d,
      applications: d.applications.map((a) =>
        a.id === id ? { ...a, status: order[(order.indexOf(a.status) + 1) % order.length] } : a
      ),
    }));
  }, []);

  // --- Resumes ---
  const addResume = useCallback((r) => {
    setData((d) => ({
      ...d,
      resumes: [
        { id: makeId(), uses: 0, created: new Date().toISOString().slice(0, 10), ...r },
        ...d.resumes,
      ],
    }));
  }, []);

  const updateResume = useCallback((id, patch) => {
    setData((d) => ({
      ...d,
      resumes: d.resumes.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const deleteResume = useCallback((id) => {
    setData((d) => ({
      ...d,
      resumes: d.resumes.filter((r) => r.id !== id),
      // Unlink any application that used this resume.
      applications: d.applications.map((a) =>
        a.resumeId === id ? { ...a, resumeId: '' } : a
      ),
    }));
  }, []);

  // --- Events ---
  const addEvent = useCallback((e) => {
    setData((d) => ({ ...d, events: [...d.events, { id: makeId(), ...e }] }));
  }, []);

  const deleteEvent = useCallback((id) => {
    setData((d) => ({ ...d, events: d.events.filter((e) => e.id !== id) }));
  }, []);

  // --- Retros ---
  const addRetro = useCallback((r) => {
    setData((d) => ({ ...d, retros: [...d.retros, { id: makeId(), ...r }] }));
  }, []);

  const deleteRetro = useCallback((id) => {
    setData((d) => ({ ...d, retros: d.retros.filter((r) => r.id !== id) }));
  }, []);

  const value = {
    ...data,
    hydrated,
    addApplication,
    updateApplication,
    deleteApplication,
    cycleApplicationStatus,
    addResume,
    updateResume,
    deleteResume,
    addEvent,
    deleteEvent,
    addRetro,
    deleteRetro,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
