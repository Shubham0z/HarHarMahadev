import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AnalyzePage from './pages/AnalyzePage';
import RoutesPage from './pages/RoutePage';
import RiskPage from './pages/RiskPage';
import SuppliersPage from './pages/SuppliersPage';
import CostPage from './pages/CostPage';
import ScenariosPage from './pages/ScenariosPage';
import ReportsPage from './pages/ReportsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<Layout><HomePage /></Layout>}      />
        <Route path="/dashboard"  element={<Layout><DashboardPage /></Layout>} />
        <Route path="/analyze"    element={<Layout><AnalyzePage /></Layout>}   />
        <Route path="/routes"     element={<Layout><RoutesPage /></Layout>}    />
        <Route path="/risk"       element={<Layout><RiskPage /></Layout>}      />
        <Route path="/suppliers"  element={<Layout><SuppliersPage /></Layout>} />
        <Route path="/costs"      element={<Layout><CostPage /></Layout>}      />
        <Route path="/scenarios"  element={<Layout><ScenariosPage /></Layout>} />
        <Route path="/reports"    element={<Layout><ReportsPage /></Layout>}   />
        <Route path="/Cost"           element={<Layout><CostPage /></Layout>}      />
      </Routes>
    </BrowserRouter>
  );
}
