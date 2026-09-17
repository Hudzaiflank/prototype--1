import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { schoolApi } from "../../services/api/schoolApi";

export function SchoolFormPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [level, setLevel] = useState("SMA");
  const [credential, setCredential] = useState(null);
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const { data } = await schoolApi.create({
        name: name.trim(),
        level,
      });
      setCredential(data.data.admin);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Sekolah belum dapat dibuat.",
      );
    }
  };
  return (
    <section
      className="mx-auto max-w-2xl space-y-6"
      aria-labelledby="school-form-title"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          Super Admin
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="school-form-title">
          Tambah sekolah
        </h1>
      </div>
      <form
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-6"
        onSubmit={submit}
      >
        <label className="block text-sm font-medium">
          Nama sekolah
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Jenjang sekolah
          <select
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            required
          >
            <option value="SMP">SMP</option>
            <option value="SMA">SMA</option>
            <option value="SMK">SMK</option>
          </select>
        </label>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button
          className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-slate-950"
          type="submit"
        >
          Buat sekolah
        </button>
      </form>
      {credential ? (
        <div className="rounded-2xl border border-emerald-400/50 bg-emerald-950/20 p-6 text-sm">
          <p className="font-semibold text-emerald-200">
            Sekolah berhasil dibuat
          </p>
          <p className="mt-3">
            Email Admin: <strong>{credential.email}</strong>
          </p>
          <p className="mt-1">
            Password sementara: <strong>{credential.password}</strong>
          </p>
          <button
            className="mt-5 rounded-lg border border-emerald-300 px-4 py-2 text-emerald-200"
            type="button"
            onClick={() => navigate("/schools")}
          >
            Kembali ke sekolah
          </button>
        </div>
      ) : null}
    </section>
  );
}
