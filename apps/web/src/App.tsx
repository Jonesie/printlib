import { Link, Route, Routes } from "react-router-dom";
import Library from "./pages/Library";
import ModelDetail from "./pages/ModelDetail";

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-sky-400">
          PrintLib
        </Link>
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
