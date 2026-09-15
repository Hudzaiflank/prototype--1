import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { classApi } from "../../services/api/classApi";

export function ClassListPage() {
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    classApi
      .listAssigned()
      .then(({ data }) => setClasses(data.data ?? []))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ?? "Kelas belum dapat dimuat.",
        ),
      );
  }, []);
  return (
    <section className="space-y-6" aria-labelledby="teacher-classes-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          Teacher space
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="teacher-classes-title">
          Kelas Saya
        </h1>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((item) => (
          <Link
            className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 transition hover:border-amber-300"
            to={`/teacher/classes/${item.id}`}
            key={item.id}
          >
            <p className="text-lg font-semibold">{item.name}</p>
            <p className="mt-2 text-sm text-slate-400">{item.status}</p>
          </Link>
        ))}
      </div>
      {!classes.length && !error ? (
        <p className="text-sm text-slate-400">
          Belum ada kelas yang di-assign.
        </p>
      ) : null}
    </section>
  );
}
