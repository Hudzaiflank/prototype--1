import { useEffect, useState } from "react";
import { useAuthContext } from "../../hooks/useAuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { classApi } from "../../services/api/classApi";
import { roomApi } from "../../services/api/roomApi";
import QRCode from "qrcode";

export function ClassDetailPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [classData, setClassData] = useState(null);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);
  const [closing, setClosing] = useState(false);
  const [roomQr, setRoomQr] = useState("");
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
  useEffect(() => {
    if (!classData?.currentRoom?.code) return;
    QRCode.toDataURL(
      `${window.location.origin}/join?room=${classData.currentRoom.code}`,
    )
      .then(setRoomQr)
      .catch(() => setRoomQr(""));
  }, [classData?.currentRoom?.code]);
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
  const closeRoom = async () => {
    if (!classData?.currentRoom) return;
    setClosing(true);
    setError("");
    try {
      await roomApi.close(classData.currentRoom.id);
      const { data } = await classApi.detailAssigned(classId);
      setClassData(data.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Room belum dapat ditutup.",
      );
    } finally {
      setClosing(false);
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
        {classData?.currentRoom ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-lg border border-amber-300 px-4 py-3 text-sm font-bold text-amber-200">
              Room: {classData.currentRoom.code}
            </span>
            {roomQr ? (
              <img
                className="h-28 w-28 rounded-lg bg-white p-2"
                src={roomQr}
                alt={`QR code room ${classData.currentRoom.code}`}
              />
            ) : null}
            {Number(classData.currentRoom.createdBy) === Number(user?.id) ? (
              <button
                className="rounded-lg border border-rose-300 px-4 py-3 text-sm font-bold text-rose-200 disabled:opacity-60"
                type="button"
                onClick={closeRoom}
                disabled={closing}
              >
                {closing ? "Menutup room..." : "Tutup room"}
              </button>
            ) : (
              <span className="text-sm text-slate-400">
                Room dibuat oleh Guru lain
              </span>
            )}
          </div>
        ) : (
          <button
            className="mt-6 rounded-lg bg-amber-300 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-60"
            type="button"
            onClick={openRoom}
            disabled={opening}
          >
            {opening ? "Membuka room..." : "Buka room baru"}
          </button>
        )}
      </div>
    </section>
  );
}
