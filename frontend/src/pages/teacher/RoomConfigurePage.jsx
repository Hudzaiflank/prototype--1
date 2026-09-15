import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { roomApi } from "../../services/api/roomApi";

export function RoomConfigurePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState("GROUPS");
  const [groupCount, setGroupCount] = useState(2);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const createSession = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await roomApi.createSession(roomId, {
        inputMode: "STUDENT",
        gameMode,
        problemDisplayLimit: 1,
        groupCount: gameMode === "GROUPS" ? Number(groupCount) : null,
      });
      navigate(`/teacher/rooms/${roomId}/monitor?sessionId=${data.data.id}`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          "Konfigurasi belum dapat disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <form
      className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-6"
      onSubmit={createSession}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
          Room configuration
        </p>
        <h1 className="mt-3 text-3xl font-bold">Atur permainan</h1>
      </div>
      <label className="block text-sm font-medium">
        Mode permainan
        <select
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
          value={gameMode}
          onChange={(event) => setGameMode(event.target.value)}
        >
          <option value="GROUPS">Kelompok</option>
          <option value="ALL_STUDENTS">Semua siswa</option>
        </select>
      </label>
      {gameMode === "GROUPS" ? (
        <label className="block text-sm font-medium">
          Jumlah kelompok
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
            type="number"
            min="1"
            value={groupCount}
            onChange={(event) => setGroupCount(event.target.value)}
          />
        </label>
      ) : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <button
        className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-60"
        type="submit"
        disabled={saving}
      >
        {saving ? "Menyimpan..." : "Buat game session"}
      </button>
    </form>
  );
}
