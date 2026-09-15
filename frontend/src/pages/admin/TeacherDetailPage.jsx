import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { teacherApi } from "../../services/api/teacherApi";

export function TeacherDetailPage() {
  const { teacherId } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    teacherApi
      .detail(teacherId)
      .then(({ data }) => setTeacher(data.data))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ??
            "Detail guru belum dapat dimuat.",
        ),
      );
  }, [teacherId]);
  return (
    <section className="space-y-6" aria-labelledby="teacher-detail-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          School management
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="teacher-detail-title">
          {teacher?.fullName ?? "Detail guru"}
        </h1>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Email", teacher?.email],
          ["Status", teacher?.status],
          ["Dibuat", teacher?.createdAt],
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
