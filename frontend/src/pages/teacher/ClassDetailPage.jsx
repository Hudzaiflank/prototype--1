import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { classApi } from "../../services/api/classApi";
import { roomApi } from "../../services/api/roomApi";

export function ClassDetailPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);
  useEffect(() => {
    classApi
      .detailAssigned(classId)
      .then(({ data }) => setClassData(data.data))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ??
            "Detail kelas belum dapat dimuat.",
        ),
      );
  }, [classId]);
  const openRoom = async () => {
    setOpening(true);
    setError("");
    try {
      const { data } = await roomApi.open(classId);
      navigate(`/teacher/rooms/${data.data.id}/configure`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Room belum dapat dibuka.",
      );
    } finally {
      setOpening(false);
    }
  };
  return (
    <section className="space-y-6" aria-labelledby="teacher-class-title">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          Teacher class
        </p>
        <h1 className="mt-3 text-3xl font-bold" id="teacher-class-title">
          {classData?.name ?? "Detail kelas"}
        </h1>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6">
        <p className="text-sm text-slate-400">Status kelas</p>
        <p className="mt-2 text-xl font-semibold">
          {classData?.status ?? "Memuat..."}
        </p>
        <button
          className="mt-6 rounded-lg bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-60"
          type="button"
          onClick={openRoom}
          disabled={opening}
        >
          {opening ? "Membuka room..." : "Buka room baru"}
        </button>
      </div>
    </section>
  );
}
