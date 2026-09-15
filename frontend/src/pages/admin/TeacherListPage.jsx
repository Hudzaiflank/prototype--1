import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { teacherApi } from "../../services/api/teacherApi";

export function TeacherListPage() {
  const [teachers, setTeachers] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    teacherApi
      .list()
      .then(({ data }) => {
        const result = data.data;
        setTeachers(Array.isArray(result) ? result : (result?.rows ?? []));
      })
      .catch(() => setError("Daftar guru belum dapat dimuat."));
  }, []);
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
        <Link
          className="rounded-lg bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950"
          to="/admin/teachers/new"
        >
          Tambah guru
        </Link>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50">
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead className="border-b border-slate-800 text-slate-400">
            <tr>
              <th className="px-5 py-4">Nama</th>
              <th className="px-5 py-4">Email</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Detail</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr className="border-b border-slate-800/70" key={teacher.id}>
                <td className="px-5 py-4 font-semibold">{teacher.fullName}</td>
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
