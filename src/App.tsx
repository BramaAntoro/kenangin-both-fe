import { Navigate, Route, Routes } from "react-router";
import DashboardPage from "./pages/DashboardPage";
import AuthPage from "./pages/AuthPage";
import { ProtectedRoute, PublicRoute } from "./auth/AuthProvider";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
