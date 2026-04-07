import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AuthGuard from './components/auth/AuthGuard';
import AppShell from './components/layout/AppShell';
import DashboardPage from './components/dashboard/DashboardPage';
import AppointmentsPage from './components/appointments/AppointmentsPage';
import MedicationsPage from './components/medications/MedicationsPage';
import RoutinesPage from './components/routines/RoutinesPage';
import SymptomsPage from './components/symptoms/SymptomsPage';
import WellnessPage from './components/wellness/WellnessPage';
import SettingsPage from './components/settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/medications" element={<MedicationsPage />} />
            <Route path="/routines" element={<RoutinesPage />} />
            <Route path="/symptoms" element={<SymptomsPage />} />
            <Route path="/wellness" element={<WellnessPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthGuard>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          },
        }}
      />
    </BrowserRouter>
  );
}
