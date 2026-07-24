'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { makeId } from './helpers';

const STORE_KEY = 'cv-trail-v4';

const defaultState = {
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
          events: data.events,
          retros: data.retros,
        })
      );
    } catch (e) {
      // ignore — quota errors etc.
    }
  }, [data, hydrated]);

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
