'use client';

import { useState } from 'react';
import { StoreProvider } from '@/lib/store';
import TopBar from '@/components/TopBar';
import LeftRail from '@/components/LeftRail';
import RightRail from '@/components/RightRail';
import Dashboard from '@/components/Dashboard';
import Applications from '@/components/Applications';
import Resumes from '@/components/Resumes';
import Calendar from '@/components/Calendar';
import Retrospective from '@/components/Retrospective';
import ApplicationModal from '@/components/modals/ApplicationModal';
import ResumeModal from '@/components/modals/ResumeModal';
import EventModal from '@/components/modals/EventModal';
import RetroModal from '@/components/modals/RetroModal';

function App() {
  const [view, setView] = useState('dashboard');

  // Modal state: { open: bool, editing: object|null }
  const [appModal, setAppModal] = useState({ open: false, editing: null });
  const [resModal, setResModal] = useState({ open: false, editing: null });
  const [evtModal, setEvtModal] = useState({ open: false });
  const [retroModal, setRetroModal] = useState({ open: false });

  const switchView = (v) => {
    setView(v);
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };

  const openNewApp = () => setAppModal({ open: true, editing: null });
  const openEditApp = (a) => setAppModal({ open: true, editing: a });
  const openNewRes = () => setResModal({ open: true, editing: null });
  const openEditRes = (r) => setResModal({ open: true, editing: r });

  return (
    <>
      <TopBar view={view} onSwitch={switchView} />
      <div className="layout">
        <LeftRail view={view} onSwitch={switchView} />
        <main>
          {view === 'dashboard' && (
            <Dashboard onNew={openNewApp} onEdit={openEditApp} onSwitch={switchView} />
          )}
          {view === 'applications' && (
            <Applications onNew={openNewApp} onEdit={openEditApp} />
          )}
          {view === 'resumes' && (
            <Resumes onNew={openNewRes} onEdit={openEditRes} />
          )}
          {view === 'calendar' && (
            <Calendar onNew={() => setEvtModal({ open: true })} />
          )}
          {view === 'retrospective' && (
            <Retrospective onNew={() => setRetroModal({ open: true })} />
          )}
        </main>
        <RightRail />
      </div>

      <ApplicationModal
        open={appModal.open}
        editing={appModal.editing}
        onClose={() => setAppModal({ open: false, editing: null })}
      />
      <ResumeModal
        open={resModal.open}
        editing={resModal.editing}
        onClose={() => setResModal({ open: false, editing: null })}
      />
      <EventModal open={evtModal.open} onClose={() => setEvtModal({ open: false })} />
      <RetroModal open={retroModal.open} onClose={() => setRetroModal({ open: false })} />
    </>
  );
}

export default function Page() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}
