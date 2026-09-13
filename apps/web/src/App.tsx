import { Link, Route, Routes } from "react-router-dom";
import Library from "./pages/Library";
import ModelDetail from "./pages/ModelDetail";
import Login from "./pages/Login";
import { api } from "./api/client";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ThemeProvider, THEMES, useTheme } from "./theme/ThemeContext";

function Header() {
  const { authenticated, refresh } = useAuth();
  const { theme, setTheme } = useTheme();
  return (
    <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
      <Link to="/" className="text-lg font-semibold text-sky-400">
        PrintLib
      </Link>
      <div className="flex items-center gap-4">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as typeof theme)}
          className="rounded bg-slate-800 px-2 py-1 text-sm text-slate-300"
          aria-label="Color theme"
        >
          {THEMES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        {authenticated && (
          <button
            onClick={() => api.logout().then(refresh)}
            className="text-sm text-slate-500 hover:text-slate-300"
          >
            Log out
          </button>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}
