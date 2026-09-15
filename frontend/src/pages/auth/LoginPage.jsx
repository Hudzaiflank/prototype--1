import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuthContext";
import { getRoleHome } from "../../routes/roleHome";

export function LoginPage() {
  const { user, isLoading, login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoading && user) {
    return <Navigate to={getRoleHome(user.role)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const session = await login({ email, password });
      navigate(
        location.state?.from?.pathname ?? getRoleHome(session.user.role),
        {
          replace: true,
        },
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          "Login gagal. Periksa email dan password Anda.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <form
        className="w-full max-w-md space-y-6 rounded-2xl border border-amber-300/30 bg-slate-900/90 p-8 shadow-2xl"
        onSubmit={handleSubmit}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            MindPlay
          </p>
          <h1 className="mt-3 text-3xl font-bold" id="login-title">
            Masuk ke akun
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Gunakan akun Super Admin, Admin, atau Guru.
          </p>
        </div>
        <label className="block text-sm font-medium">
          Email
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 outline-none focus:border-amber-300"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 outline-none focus:border-amber-300"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button
          className="w-full rounded-lg bg-amber-300 px-4 py-3 font-bold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </section>
  );
}
