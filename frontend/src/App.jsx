import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Web3Provider } from './context/Web3Context';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Machines from './pages/Machines';
import MachineDetails from './pages/MachineDetails';
import AIAnalysis from './pages/AIAnalysis';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import BlockchainAudit from './pages/BlockchainAudit';
import Reports from './pages/Reports';

function AppContent() {
  const { user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedMachineId, setSelectedMachineId] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [labTelemetry, setLabTelemetry] = useState(null);
  const [labMachineId, setLabMachineId] = useState('M01');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user || !user.isAuthenticated) {
    return <Login onLoginSuccess={() => setActivePage('dashboard')} />;
  }

  const handleSelectMachine = (machineId) => {
    setSelectedMachineId(machineId);
    setActivePage('machine-details');
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId);
    setActivePage('event-details');
  };

  const handleAnalyzeInLab = (telemetry, machineId) => {
    setLabTelemetry(telemetry);
    setLabMachineId(machineId || 'M01');
    setActivePage('ai-analysis');
  };

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard
            key={refreshKey}
            onSelectMachine={handleSelectMachine}
            onSelectEvent={handleSelectEvent}
          />
        );
      case 'machines':
        return (
          <Machines
            key={refreshKey}
            onSelectMachine={handleSelectMachine}
          />
        );
      case 'machine-details':
        return (
          <MachineDetails
            key={refreshKey}
            machineId={selectedMachineId || 'M01'}
            onBack={() => setActivePage('machines')}
            onSelectEvent={handleSelectEvent}
            onAnalyzeTelemetry={handleAnalyzeInLab}
          />
        );
      case 'ai-analysis':
        return (
          <AIAnalysis
            initialTelemetry={labTelemetry}
            initialMachineId={labMachineId}
            onEventLogged={() => setRefreshKey((k) => k + 1)}
          />
        );
      case 'events':
        return (
          <Events
            key={refreshKey}
            onSelectEvent={handleSelectEvent}
          />
        );
      case 'event-details':
        return (
          <EventDetails
            key={refreshKey}
            eventId={selectedEventId}
            onBack={() => setActivePage('events')}
            onSelectMachine={handleSelectMachine}
          />
        );
      case 'blockchain':
        return (
          <BlockchainAudit
            key={refreshKey}
            onSelectEvent={handleSelectEvent}
          />
        );
      case 'reports':
        return <Reports key={refreshKey} />;
      default:
        return <Dashboard onSelectMachine={handleSelectMachine} onSelectEvent={handleSelectEvent} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-industrial-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage.startsWith('machine-details') ? 'machines' : activePage.startsWith('event-details') ? 'events' : activePage}
        setActivePage={(page) => {
          if (page === 'machines') setSelectedMachineId(null);
          if (page === 'events') setSelectedEventId(null);
          setActivePage(page);
        }}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-slate-50 dark:bg-industrial-950">
        {/* Top Navbar */}
        <Navbar onRefresh={handleGlobalRefresh} isRefreshing={isRefreshing} />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-grid-pattern">
          <div className="mx-auto max-w-7xl">
            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Web3Provider>
          <AppContent />
        </Web3Provider>
      </AuthProvider>
    </ThemeProvider>
  );
}
