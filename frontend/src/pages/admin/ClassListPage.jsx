import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { classApi } from "../../services/api/classApi";

export function ClassListPage() {
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    classApi
      .list()
      .then(({ data }) => setClasses(data.data ?? []))
      .catch(() => setError("Daftar kelas belum dapat dimuat."));
  }, []);
  return (
    <section className="space-y-6" aria-labelledby="classes-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            School management
          </p>
          <h1 className="mt-3 text-3xl font-bold" id="classes-title">
            Kelas
          </h1>
        </div>
        <Link
          className="rounded-lg bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950"
          to="/admin/classes/new"
        >
          Tambah kelas
        </Link>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((item) => (
          <Link
            className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 transition hover:border-amber-300"
            to={`/admin/classes/${item.id}`}
            key={item.id}
          >
            <p className="text-lg font-semibold">{item.name}</p>
            <p className="mt-2 text-sm text-slate-400">
              {item.gradeLevel} · {item.major}
            </p>
            <p className="mt-4 text-xs text-amber-300">{item.status}</p>
          </Link>
        ))}
      </div>
      {!classes.length && !error ? (
        <p className="text-sm text-slate-400">Belum ada kelas.</p>
      ) : null}
    </section>
  );
}
