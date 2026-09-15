import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { roomApi } from "../../services/api/roomApi";
import { topicApi } from "../../services/api/topicApi";

export function RoomConfigurePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState("GROUPS");
  const [groupCount, setGroupCount] = useState(2);
  const [inputMode, setInputMode] = useState("STUDENT");
  const [problemDisplayLimit, setProblemDisplayLimit] = useState(1);
  const [topicId, setTopicId] = useState("");
  const [topics, setTopics] = useState([]);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    topicApi
      .list()
      .then(({ data }) => setTopics(data.data ?? []))
      .catch((requestError) => setError(requestError.response?.data?.message ?? "Topik belum dapat dimuat."));
  }, []);
  const createPrivateTopic = async () => {
    if (!newTopicTitle.trim()) return;
    try {
      const { data } = await topicApi.create({
        title: newTopicTitle.trim(),
        description: newTopicDescription.trim(),
        visibility: "PRIVATE",
      });
      const created = data.data;
      setTopics((current) => [created, ...current]);
      setTopicId(String(created.id));
      setNewTopicTitle("");
      setNewTopicDescription("");
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Topik pribadi belum dapat dibuat.");
    }
  };
  const createSession = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const { data } = await roomApi.createSession(roomId, {
        topicId: topicId ? Number(topicId) : null,
        inputMode,
        gameMode,
        problemDisplayLimit: Number(problemDisplayLimit),
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
        Topik / permasalahan
        <select className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" value={topicId} onChange={(event) => setTopicId(event.target.value)}>
          <option value="">Tanpa topik khusus</option>
          {topics.map((topic) => <option value={topic.id} key={topic.id}>{topic.title} ({topic.visibility === "PRIVATE" ? "Pribadi" : "Sekolah"})</option>)}
        </select>
      </label>
      <div className="rounded-xl border border-slate-800 p-4">
        <p className="text-sm font-medium">Buat topik pribadi</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" placeholder="Judul topik" value={newTopicTitle} onChange={(event) => setNewTopicTitle(event.target.value)} />
          <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" placeholder="Deskripsi" value={newTopicDescription} onChange={(event) => setNewTopicDescription(event.target.value)} />
        </div>
        <button className="mt-3 rounded-lg border border-amber-300 px-4 py-2 text-sm font-bold text-amber-200" type="button" onClick={createPrivateTopic}>Simpan topik pribadi</button>
      </div>
      <label className="block text-sm font-medium">
        Mode input
        <select
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
          value={inputMode}
          onChange={(event) => setInputMode(event.target.value)}
        >
          <option value="STUDENT">Murid mengisi nama dan masalah</option>
          <option value="TEACHER">Guru mengisi nama dan masalah</option>
        </select>
      </label>
      <label className="block text-sm font-medium">
        Batas tampilan masalah
        <input className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" type="number" min="1" value={problemDisplayLimit} onChange={(event) => setProblemDisplayLimit(event.target.value)} required />
      </label>
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
