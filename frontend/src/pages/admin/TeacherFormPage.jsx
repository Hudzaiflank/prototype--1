import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { teacherApi } from "../../services/api/teacherApi";

export function TeacherFormPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [nip, setNip] = useState("");
  const [credential, setCredential] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await teacherApi.create({
        fullName: fullName.trim(),
        nip: nip.trim(),
      });
      setCredential(data.data.credential);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Guru belum dapat ditambahkan.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="mx-auto max-w-xl space-y-6"
      aria-labelledby="teacher-form-title"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          School management
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="teacher-form-title">
          Tambah guru
        </h1>
      </div>
      <form
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-6"
        onSubmit={submit}
      >
        <label className="block text-sm font-medium">
          Nama lengkap
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
            minLength="2"
          />
        </label>
        <label className="block text-sm font-medium">
          NIP
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
            value={nip}
            onChange={(event) =>
              setNip(event.target.value.replace(/\D/g, "").slice(0, 18))
            }
            inputMode="numeric"
            pattern="[0-9]{18}"
            minLength="18"
            maxLength="18"
            placeholder="18 digit angka"
            required
          />
        </label>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button
          className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-60"
          type="submit"
          disabled={saving}
        >
          {saving ? "Menyimpan..." : "Tambah guru"}
        </button>
      </form>
      {credential ? (
        <div className="rounded-2xl border border-emerald-400/50 bg-emerald-950/20 p-5 text-sm">
          <p className="font-semibold text-emerald-200">
            Guru berhasil ditambahkan
          </p>
          <p className="mt-3">
            Email: <strong>{credential.email}</strong>
          </p>
          <p className="mt-1">
            Password sementara: <strong>{credential.password}</strong>
          </p>
          <button
            className="mt-4 text-amber-200"
            type="button"
            onClick={() => navigate("/admin/teachers")}
          >
            Kembali ke daftar guru
          </button>
        </div>
      ) : null}
    </section>
  );
}
