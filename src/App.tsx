import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { Dashboard } from "@/pages/Dashboard";
import { BlogsList } from "@/pages/BlogsList";
import { BlogEditor } from "@/pages/BlogEditor";
import { BlogPreview } from "@/pages/BlogPreview";
import { Categories } from "@/pages/Categories";
import { Tags } from "@/pages/Tags";
import { Settings } from "@/pages/Settings";
import { Inquiries } from "@/pages/Inquiries";
import { Login } from "@/pages/Login";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="blogs" element={<BlogsList />} />
              <Route path="categories" element={<Categories />} />
              <Route path="tags" element={<Tags />} />
              <Route path="settings" element={<Settings />} />
              <Route path="inquiries" element={<Inquiries />} />
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
