import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import MainLayout from "./components/MainLayout";
import HomePage from "./pages/HomePage";
import UserLibraryPage from "./pages/UserLibraryPage";
import UserProfilePage from "./pages/UserProfilePage";
import BookPage from "./pages/BookPage";
import CreateBookPage from "./pages/CreateBookPage";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
function ProtectedRoutes() {
  const { user, loading, error, restore } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center" role="status">Abrindo sua biblioteca…</div>;
  if (error) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6"><p role="alert">{error}</p><button className="rounded-xl bg-forest px-6 py-3" onClick={restore}>Tentar novamente</button></div>;
  return user ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
}
function App() {
  return (
    <AuthProvider><Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoutes />}>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route path="/users/:id/library" element={<UserLibraryPage />} />
        <Route path="/books/:id" element={<BookPage />} />
        <Route path="/create-book" element={<CreateBookPage />} />
        <Route path="/create-post" element={<Navigate to="/?tab=comunidade&compose=1" replace />} />
      </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></AuthProvider>
  );
}

export default App;
