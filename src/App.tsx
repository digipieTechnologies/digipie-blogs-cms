import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { Dashboard } from "@/pages/Dashboard";
import { BlogsList } from "@/pages/BlogsList";
import { BlogEditor } from "@/pages/BlogEditor";
import { BlogPreview } from "@/pages/BlogPreview";
import { Categories } from "@/pages/Categories";
import { Settings } from "@/pages/Settings";
import { Login } from "@/pages/Login";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "hsl(224 71% 4%)",
            color: "hsl(213 31% 91%)",
            border: "1px solid hsl(216 34% 17%)",
            borderRadius: "10px",
            fontSize: "14px",
            fontFamily: "inherit",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          },
          success: {
            iconTheme: { primary: "#4ade80", secondary: "hsl(224 71% 4%)" },
          },
          error: {
            iconTheme: { primary: "#f87171", secondary: "hsl(224 71% 4%)" },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="blogs" element={<BlogsList />} />
            <Route path="categories" element={<Categories />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="/blogs/new" element={<BlogEditor />} />
          <Route path="/blogs/:id" element={<BlogEditor />} />
          <Route path="/blogs/preview/:id" element={<BlogPreview />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}
