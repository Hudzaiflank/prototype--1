import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { classApi } from "../../services/api/classApi";
import { useAuthContext } from "../../hooks/useAuthContext";

export function ClassFormPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const isSmp = user?.school?.level === "SMP";
  const [gradeLevel, setGradeLevel] = useState(
    user?.school?.level === "SMP" ? "7" : "10",
  );
  const [major, setMajor] = useState("");
  const [classNumber, setClassNumber] = useState("");
  const [academicYear, setAcademicYear] = useState("2026/2027");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!file || !preview?.valid)
        throw new Error("Upload Excel siswa yang valid terlebih dahulu.");
      const formData = new FormData();
      formData.append("gradeLevel", gradeLevel.trim());
      if (!isSmp) formData.append("major", major.trim());
      formData.append("classNumber", classNumber);
      formData.append("academicYear", academicYear.trim());
      formData.append("file", file);
      const { data } = await classApi.create(formData);
      navigate(`/admin/classes/${data.data.id}`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Kelas belum dapat dibuat.",
      );
    } finally {
      setSaving(false);
    }
  };
  const selectFile = async (nextFile) => {
    setFile(nextFile);
    setPreview(null);
    if (!nextFile) return;
    try {
      const { data } = await classApi.previewStudents(nextFile, academicYear);
      setPreview(data.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Excel belum dapat dibaca.",
      );
    }
  };
  const downloadTemplate = async () => {
    const { data } = await classApi.downloadStudentTemplate();
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "template-siswa.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className="mx-auto max-w-2xl space-y-6"
      aria-labelledby="class-form-title"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          School management
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="class-form-title">
          Tambah kelas
        </h1>
      </div>
      <form
        className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-6"
        onSubmit={submit}
      >
        <label className="block text-sm font-medium">
          Tingkat
          <select
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
            value={gradeLevel}
            onChange={(event) => setGradeLevel(event.target.value)}
            required
          >
            {(isSmp ? ["7", "8", "9"] : ["10", "11", "12"]).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        {!isSmp ? (
          <label className="block text-sm font-medium">
            Jurusan
            <input
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
              placeholder="MIPA"
              value={major}
              onChange={(event) => setMajor(event.target.value)}
              required
            />
          </label>
        ) : null}
        <label className="block text-sm font-medium">
          Tahun ajaran
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
            placeholder="2026/2027"
            pattern="[0-9]{4}/[0-9]{4}"
            value={academicYear}
            onChange={(event) => setAcademicYear(event.target.value)}
            required
          />
        </label>
        <div className="space-y-3 rounded-xl border border-slate-700 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">
              Daftar siswa (Excel verplicht)
            </p>
            <button
              className="text-sm text-amber-200"
              type="button"
              onClick={downloadTemplate}
            >
              Download template
            </button>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
            required
          />
          {preview ? (
            <p
              className={
                preview.valid
                  ? "text-sm text-emerald-300"
                  : "text-sm text-rose-300"
              }
            >
              {preview.validCount} valid, {preview.errorCount} error
            </p>
          ) : null}
          {preview ? (
            <div className="max-h-72 overflow-auto rounded-lg border border-slate-800">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-3 py-2">Baris</th>
                    <th className="px-3 py-2">Nama Lengkap</th>
                    <th className="px-3 py-2">NISN</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row) => (
                    <tr className="border-b border-slate-900" key={row.row}>
                      <td className="px-3 py-2">{row.row}</td>
                      <td className="px-3 py-2">{row.fullName || "-"}</td>
                      <td className="px-3 py-2">{row.nisn || "-"}</td>
                      <td
                        className={`px-3 py-2 font-semibold ${row.valid ? "text-emerald-300" : "text-rose-300"}`}
                      >
                        {row.valid ? "Valid" : "Error"}
                      </td>
                      <td className="px-3 py-2 text-rose-300">
                        {row.errors?.join(", ") || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
        <label className="block text-sm font-medium">
          Nomor kelas
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
            type="number"
            min="1"
            value={classNumber}
            onChange={(event) => setClassNumber(event.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button
          className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={saving}
        >
          {saving ? "Menyimpan..." : "Buat kelas"}
        </button>
      </form>
    </section>
  );
}
