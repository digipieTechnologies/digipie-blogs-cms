import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { Dashboard } from "@/pages/Dashboard";
import { BlogsList } from "@/pages/BlogsList";
import { BlogEditor } from "@/pages/BlogEditor";
import { BlogPreview } from "@/pages/BlogPreview";
import { Categories } from "@/pages/Categories";
import { Settings } from "@/pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="blogs" element={<BlogsList />} />
          <Route path="categories" element={<Categories />} />
          <Route path="settings" element={<Settings />} />
          {/* Editor and preview take full screen, no sidebar */}
        </Route>
        <Route path="/blogs/new" element={<BlogEditor />} />
        <Route path="/blogs/:id" element={<BlogEditor />} />
        <Route path="/blogs/preview/:id" element={<BlogPreview />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
