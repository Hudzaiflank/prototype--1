import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { schoolApi } from "../../services/api/schoolApi";

export function SchoolListPage() {
  const [schools, setSchools] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState("");
  const [removingId, setRemovingId] = useState(null);
  useEffect(() => {
    schoolApi
      .list()
      .then(({ data }) => {
        const result = data.data;
        setSchools(Array.isArray(result) ? result : (result?.rows ?? []));
        setPagination(Array.isArray(result) ? null : result);
      })
      .catch(() => setError("Daftar sekolah belum dapat dimuat."));
  }, []);
  const removeSchool = async (school) => {
    if (!window.confirm(`Hapus permanen sekolah ${school.name} beserta data kelas, guru, topic, room, dan game?`)) return;
    setRemovingId(school.id);
    setError("");
    try {
      await schoolApi.remove(school.id);
      setSchools((current) => current.filter((item) => item.id !== school.id));
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Sekolah belum dapat dihapus.");
    } finally {
      setRemovingId(null);
    }
  };
  return (
    <section className="space-y-6" aria-labelledby="schools-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Management
          </p>
          <h1 className="mt-3 text-3xl font-bold" id="schools-title">
            Sekolah
          </h1>
        </div>
        <Link
          className="rounded-lg bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950"
          to="/schools/new"
        >
          Tambah sekolah
        </Link>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {pagination ? (
        <p className="text-sm text-slate-400">
          Menampilkan {schools.length} dari {pagination.total ?? schools.length} sekolah
          {pagination.page ? ` · Halaman ${pagination.page}` : ""}
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-800 text-slate-400">
            <tr>
              <th className="px-5 py-4">Nama</th>
              <th className="px-5 py-4">Domain</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Detail</th>
              <th className="px-5 py-4">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {schools.map((school) => (
              <tr className="border-b border-slate-800/70" key={school.id}>
                <td className="px-5 py-4 font-semibold">{school.name}</td>
                <td className="px-5 py-4 text-slate-400">{school.domain}</td>
                <td className="px-5 py-4">{school.status}</td>
                <td className="px-5 py-4">
                  <Link
                    className="text-amber-300 hover:text-amber-200"
                    to={`/schools/${school.id}`}
                  >
                    Buka
                  </Link>
                </td>
                <td className="px-5 py-4">
                  {school.status === "ACTIVE" ? (
                    <button className="text-rose-300 disabled:opacity-50" type="button" onClick={() => removeSchool(school)} disabled={removingId === school.id}>
                      {removingId === school.id ? "Memproses..." : "Hapus"}
                    </button>
                  ) : <span className="text-slate-500">Sudah nonaktif</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!schools.length && !error ? (
          <p className="p-5 text-sm text-slate-400">Belum ada sekolah.</p>
        ) : null}
      </div>
    </section>
  );
}
