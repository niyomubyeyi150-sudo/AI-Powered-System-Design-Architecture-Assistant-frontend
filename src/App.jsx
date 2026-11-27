import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import EntryPage from "./pages/EntryPage";
import DashboardPage from "./pages/DashboardPage";
import RequirementsPage from "./pages/RequirementsPage";
import ArchitecturePage from "./pages/ArchitecturePage";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public entry page */}
          <Route path="/" element={<EntryPage />} />

          {/* Temporary development routes - no authentication */}
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route
            path="/dev/projects/:projectId/requirements"
            element={<RequirementsPage />}
          />

          <Route
            path="/dev/projects/:projectId/architecture"
            element={<ArchitecturePage />}
          />

          {/* Protected application routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            <Route
              path="/projects/:projectId/requirements"
              element={<RequirementsPage />}
            />

            <Route
              path="/projects/:projectId/architecture"
              element={<ArchitecturePage />}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
