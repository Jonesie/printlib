import { Link, Route, Routes } from "react-router-dom";
import Library from "./pages/Library";
import ModelDetail from "./pages/ModelDetail";
import Login from "./pages/Login";
import { api } from "./api/client";
import { AuthProvider, useAuth } from "./auth/AuthContext";

function Header() {
  const { authenticated, refresh } = useAuth();
  return (
    <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
      <Link to="/" className="text-lg font-semibold text-sky-400">
        PrintLib
      </Link>
      {authenticated && (
        <button
          onClick={() => api.logout().then(refresh)}
          className="text-sm text-slate-500 hover:text-slate-300"
        >
          Log out
        </button>
      )}
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/models/:id" element={<ModelDetail />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
