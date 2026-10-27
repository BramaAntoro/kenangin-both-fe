import { Navigate } from "react-router";
import { useAuth } from "../auth/AuthProvider";
import CafePhotoBooth from "../dashboard/cafe-admin/CafePhotoBooth";

export default function CafePhotoBoothPage() {
  const { user } = useAuth();

  if (user?.role !== "cafe_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <CafePhotoBooth />;
}
