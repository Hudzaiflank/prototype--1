import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { classApi } from "../../services/api/classApi";

export function ClassFormPage() {
  const navigate = useNavigate();
  const [gradeLevel, setGradeLevel] = useState("X");
  const [major, setMajor] = useState("");
  const [classNumber, setClassNumber] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await classApi.create({
        gradeLevel: gradeLevel.trim(),
        major: major.trim(),
        classNumber: Number(classNumber),
      });
      navigate(`/admin/classes/${data.data.id}`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Kelas belum dapat dibuat.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6" aria-labelledby="class-form-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          School management
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="class-form-title">
          Tambah kelas
        </h1>
      </div>
      <form className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-6" onSubmit={submit}>
        <label className="block text-sm font-medium">
          Tingkat
          <input className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)} required />
        </label>
        <label className="block text-sm font-medium">
          Jurusan
          <input className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" placeholder="MIPA" value={major} onChange={(event) => setMajor(event.target.value)} required />
        </label>
        <label className="block text-sm font-medium">
          Nomor kelas
          <input className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" type="number" min="1" value={classNumber} onChange={(event) => setClassNumber(event.target.value)} required />
        </label>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={saving}>
          {saving ? "Menyimpan..." : "Buat kelas"}
        </button>
      </form>
    </section>
  );
}