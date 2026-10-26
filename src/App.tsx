import { Navigate, Route, Routes } from "react-router";
import DashboardPage from "./pages/DashboardPage";
import AuthPage from "./pages/AuthPage";
import { ProtectedRoute, PublicRoute } from "./auth/AuthProvider";
import PhotoDownloadPage from "./pages/PhotoDownloadPage";
import CafePhotoBoothPage from "./pages/CafePhotoBoothPage";

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
      <Route
        path="/sesi-foto"
        element={
          <ProtectedRoute>
            <CafePhotoBoothPage />
          </ProtectedRoute>
        }
      />
      <Route path="/session/:sessionCode" element={<PhotoDownloadPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
