import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { teacherApi } from "../../services/api/teacherApi";

export function TeacherDetailPage() {
  const { teacherId } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [error, setError] = useState("");
  const [credential, setCredential] = useState(null);
  const [resetting, setResetting] = useState(false);
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
  const resetPassword = async () => {
    setResetting(true);
    setError("");
    try {
      const { data } = await teacherApi.resetPassword(teacherId);
      setCredential(data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Password guru belum dapat di-reset.");
    } finally {
      setResetting(false);
    }
  };
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
      <div className="flex flex-wrap gap-3">
        <button className="rounded-lg bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-60" type="button" onClick={resetPassword} disabled={resetting}>
          {resetting ? "Mereset password..." : "Reset password guru"}
        </button>
      </div>
      {teacher?.classes?.length ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <h2 className="text-lg font-semibold">Kelas terkait</h2>
          <div className="mt-3 space-y-2">
            {teacher.classes.map((item) => <p className="rounded-lg border border-slate-800 p-3" key={item.id}>{item.name} <span className="text-sm text-slate-400">({item.status})</span></p>)}
          </div>
        </div>
      ) : null}
      {credential ? <p className="rounded-xl border border-emerald-400/50 bg-emerald-950/20 p-4 text-sm text-emerald-200">Password sementara: <strong>{credential.password}</strong></p> : null}
    </section>
  );
}
