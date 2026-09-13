import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import Library from "./pages/Library";
import ModelDetail from "./pages/ModelDetail";
import Login from "./pages/Login";
import { api } from "./api/client";

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    api.getSession().then((s) => setAuthenticated(s.authenticated));
  }, []);

  if (authenticated === null) return null;
  if (!authenticated) return <Login onLoggedIn={() => setAuthenticated(true)} />;

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-sky-400">
          PrintLib
        </Link>
        <button
          onClick={() => api.logout().then(() => setAuthenticated(false))}
          className="text-sm text-slate-500 hover:text-slate-300"
        >
          Log out
        </button>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/models/:id" element={<ModelDetail />} />
        </Routes>
      </main>
    </div>
  );
}
