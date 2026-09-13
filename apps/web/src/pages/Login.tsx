import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.login(password);
      await refresh();
      navigate("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form onSubmit={submit} className="grid w-72 gap-3">
        <h1 className="text-center text-lg font-semibold text-sky-400">Log in</h1>
        <input
          type="password"
          autoFocus
          className="rounded bg-slate-800 px-3 py-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {submitting ? "Checking…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
