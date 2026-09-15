import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { classApi } from "../../services/api/classApi";

export function ClassDetailPage() {
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    classApi
      .detail(classId)
      .then(({ data }) => setClassData(data.data))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ??
            "Detail kelas belum dapat dimuat.",
        ),
      );
  }, [classId]);
  return (
    <section className="space-y-6" aria-labelledby="class-detail-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          School management
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="class-detail-title">
          {classData?.name ?? "Detail kelas"}
        </h1>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Tingkat", classData?.gradeLevel],
          ["Jurusan", classData?.major],
          ["Nomor", classData?.classNumber],
          ["Status", classData?.status],
        ].map(([label, value]) => (
          <div
            className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            key={label}
          >
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-2 font-semibold">{value ?? "-"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
