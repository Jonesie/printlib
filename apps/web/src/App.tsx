import { Link, Route, Routes } from "react-router-dom";
import Library from "./pages/Library";
import ModelDetail from "./pages/ModelDetail";
import Login from "./pages/Login";
import { api } from "./api/client";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ThemeProvider, THEMES, useTheme } from "./theme/ThemeContext";
import Dropdown from "./components/Dropdown";

function Header() {
  const { authenticated, refresh } = useAuth();
  const { theme, setTheme } = useTheme();
  return (
    <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
      <Link to="/" className="text-lg font-semibold text-sky-400">
        PrintLib
      </Link>
      <div className="flex items-center gap-4">
        <Dropdown value={theme} options={[...THEMES]} onChange={setTheme} ariaLabel="Color theme" />
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

function Footer() {
  return (
    <footer className="mt-auto flex justify-center gap-4 border-t border-slate-800 px-4 py-4 text-sm text-slate-500">
      <a
        href="https://github.com/Jonesie/printlib"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-slate-300"
      >
        GitHub
      </a>
      <a
        href="https://www.buymeacoffee.com/jonesie"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-slate-300"
      >
        Buy me a coffee ☕
      </a>
    </footer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1 px-4 py-6">
            <Routes>
              <Route path="/" element={<Library />} />
              <Route path="/models/:id" element={<ModelDetail />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}
