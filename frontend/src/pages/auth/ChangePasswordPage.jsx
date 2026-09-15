import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../services/api/authApi";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setMessage("Password berhasil diganti. Silakan masuk lagi.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Password belum dapat diganti.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl space-y-6" aria-labelledby="password-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">Account</p>
        <h1 className="mt-3 text-3xl font-bold" id="password-title">Ganti password</h1>
      </div>
      <form className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-6" onSubmit={submit}>
        <label className="block text-sm font-medium">Password saat ini<input className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label>
        <label className="block text-sm font-medium">Password baru<input className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" type="password" minLength="8" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></label>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
        <button className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-60" type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan password"}</button>
      </form>
      {message ? <button className="text-sm text-amber-200" type="button" onClick={() => navigate("/login")}>Kembali ke login</button> : null}
    </section>
  );
}
