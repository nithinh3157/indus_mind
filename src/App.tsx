import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './components/auth/LoginPage';
import { AppShell } from './components/layout/AppShell';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { AutoForgeDashboard } from './pages/AutoForgeDashboard';
import { DairyFlowDashboard } from './pages/DairyFlowDashboard';
import { DairyTemperatureVerificationPage } from './pages/DairyTemperatureVerificationPage';
import { CrossIndustryPage } from './pages/CrossIndustryPage';
import { ProductionAndSimulationPage } from './pages/ProductionAndSimulationPage';
import { MachineMonitoringPage } from './pages/MachineMonitoringPage';
import { BottleneckAnalysisPage } from './pages/BottleneckAnalysisPage';
import { PredictiveAnalyticsPage } from './pages/PredictiveAnalyticsPage';
import { QualityManagementPage } from './pages/QualityManagementPage';
import { InventoryManagementPage } from './pages/InventoryManagementPage';
import { FinancialIntelligencePage } from './pages/FinancialIntelligencePage';
import { EnergySustainabilityPage } from './pages/EnergySustainabilityPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';

const AuthenticatedWorkspace: React.FC = () => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<OverviewDashboard />} />
        <Route path="/autoforge" element={<AutoForgeDashboard />} />
        <Route path="/dairyflow" element={<DairyFlowDashboard />} />
        <Route
          path="/dairyflow/temperature-verification"
          element={<DairyTemperatureVerificationPage />}
        />
        <Route path="/cross-industry" element={<CrossIndustryPage />} />
        <Route path="/production" element={<ProductionAndSimulationPage />} />
        <Route path="/machines" element={<MachineMonitoringPage />} />
        <Route path="/bottlenecks" element={<BottleneckAnalysisPage />} />
        <Route path="/predictive" element={<PredictiveAnalyticsPage />} />
        <Route path="/quality" element={<QualityManagementPage />} />
        <Route path="/inventory" element={<InventoryManagementPage />} />
        <Route path="/finance" element={<FinancialIntelligencePage />} />
        <Route path="/energy" element={<EnergySustainabilityPage />} />
        <Route path="/assistant" element={<AiAssistantPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/users" element={<UserManagementPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AuthenticatedWorkspace />
      </BrowserRouter>
    </AppProvider>
  );
}
