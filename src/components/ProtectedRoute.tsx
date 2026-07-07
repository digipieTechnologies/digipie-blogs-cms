import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DigipieLoader } from "@/components/ui/DigipieLoader";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  // Redirect to login if loading is done and no user is authenticated
  if (!isLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <DigipieLoader loading={isLoading} fullPage size="lg" />
      {user && <Outlet />}
    </>
  );
}

