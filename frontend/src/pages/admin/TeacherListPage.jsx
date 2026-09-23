import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { teacherApi } from "../../services/api/teacherApi";

export function TeacherListPage() {
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [success, setSuccess] = useState("");
  useEffect(() => {
    teacherApi
      .list()
      .then(({ data }) => {
        const result = data.data;
        setTeachers(Array.isArray(result) ? result : (result?.rows ?? []));
      })
      .catch(() => setError("Daftar guru belum dapat dimuat."));
  }, []);
  const previewFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(null);
    setError("");
    setSuccess("");
    try {
      const { data } = await teacherApi.previewImport(file);
      setPreview(data.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "File belum dapat dipreview.",
      );
    } finally {
      event.target.value = "";
    }
  };
  const confirmImport = async () => {
    if (!selectedFile || !preview?.valid) return;
    setImporting(true);
    setError("");
    try {
      const { data } = await teacherApi.import(selectedFile);
      setSuccess(
        `${data.data.count} guru berhasil ditambahkan. Password default: ${data.data.defaultPassword}`,
      );
      setSelectedFile(null);
      setPreview(null);
      const { data: listResponse } = await teacherApi.list();
      const result = listResponse.data;
      setTeachers(Array.isArray(result) ? result : (result?.rows ?? []));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Guru belum dapat di-import.",
      );
    } finally {
      setImporting(false);
    }
  };
  const downloadTemplate = async () => {
    try {
      const { data } = await teacherApi.template();
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "template-guru.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Template belum dapat diunduh.",
      );
    }
  };
  return (
    <section className="space-y-6" aria-labelledby="teachers-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            School management
          </p>
          <h1 className="mt-3 text-3xl font-bold" id="teachers-title">
            Guru
          </h1>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="rounded-lg border border-slate-600 px-4 py-3 text-sm font-bold text-slate-200"
            type="button"
            onClick={downloadTemplate}
          >
            Download template
          </button>
          <label className="cursor-pointer rounded-lg border border-amber-300 px-4 py-3 text-sm font-bold text-amber-200">
            Pilih Excel
            <input
              className="hidden"
              type="file"
              accept=".xlsx,.xls"
              onChange={previewFile}
              disabled={importing}
            />
          </label>
          <Link
            className="rounded-lg bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950"
            to="/admin/teachers/new"
          >
            Tambah guru
          </Link>
        </div>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      {preview ? (
        <div className="space-y-4 rounded-2xl border border-amber-300/40 bg-slate-950/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Preview import</h2>
              <p className="mt-1 text-sm text-slate-400">
                {selectedFile?.name}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm"
                type="button"
                onClick={() => {
                  setPreview(null);
                  setSelectedFile(null);
                }}
              >
                Batal
              </button>
              <button
                className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
                type="button"
                onClick={confirmImport}
                disabled={!preview.valid || importing}
              >
                {importing ? "Mengimport..." : "Konfirmasi import"}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="px-3 py-2">Baris</th>
                  <th className="px-3 py-2">Nama Lengkap</th>
                  <th className="px-3 py-2">NIP</th>
                  <th className="px-3 py-2">Email otomatis</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr className="border-b border-slate-800/70" key={row.row}>
                    <td className="px-3 py-2">{row.row}</td>
                    <td className="px-3 py-2">{row.fullName}</td>
                    <td className="px-3 py-2">{row.nip}</td>
                    <td className="px-3 py-2 text-slate-400">{row.email}</td>
                    <td className="px-3 py-2 text-emerald-300">Valid</td>
                  </tr>
                ))}
                {preview.errors.map((item) => (
                  <tr
                    className="border-b border-slate-800/70"
                    key={`error-${item.row}`}
                  >
                    <td className="px-3 py-2">{item.row}</td>
                    <td className="px-3 py-2" colSpan="3">
                      -
                    </td>
                    <td className="px-3 py-2 text-rose-300">{item.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!preview.valid ? (
            <p className="text-sm text-rose-300">
              Perbaiki baris bermasalah sebelum melakukan import.
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="border-b border-slate-800 text-slate-400">
            <tr>
              <th className="px-5 py-4">Nama</th>
              <th className="px-5 py-4">NIP</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Detail</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr className="border-b border-slate-800/70" key={teacher.id}>
                <td className="px-5 py-4 font-semibold">{teacher.fullName}</td>
                <td className="px-5 py-4 text-slate-400">{teacher.nip}</td>
                <td className="px-5 py-4 text-slate-400">{teacher.email}</td>
                <td className="px-5 py-4">{teacher.status ?? "ACTIVE"}</td>
                <td className="px-5 py-4">
                  <Link
                    className="text-amber-300 hover:text-amber-200"
                    to={`/admin/teachers/${teacher.id}`}
                  >
                    Buka
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!teachers.length && !error ? (
          <p className="p-5 text-sm text-slate-400">Belum ada guru.</p>
        ) : null}
      </div>
    </section>
  );
}
