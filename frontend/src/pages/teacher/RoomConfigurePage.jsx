import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { roomApi } from "../../services/api/roomApi";
import { gameApi } from "../../services/api/gameApi";
import { topicApi } from "../../services/api/topicApi";

export function RoomConfigurePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [gameMode, setGameMode] = useState("GROUPS");
  const [groupCount, setGroupCount] = useState(2);
  const [inputMode, setInputMode] = useState("STUDENT");
  const [topicId, setTopicId] = useState("");
  const [topics, setTopics] = useState([]);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicDescription, setNewTopicDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [problemContent, setProblemContent] = useState("");
  const [participantPreview, setParticipantPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  useEffect(() => {
    topicApi
      .list()
      .then(({ data }) => setTopics(data.data ?? []))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ?? "Topik belum dapat dimuat.",
        ),
      );
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
      setError(
        requestError.response?.data?.message ??
          "Topik pribadi belum dapat dibuat.",
      );
    }
  };
  const createSession = async (event) => {
    event.preventDefault();
    if (!topicId) {
      setError("Pilih topik sebelum membuat permainan.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        topicId: topicId ? Number(topicId) : null,
        inputMode,
        gameMode,
        problemDisplayLimit: 1,
        groupCount: gameMode === "GROUPS" ? Number(groupCount) : null,
      };
      const { data } = await roomApi.createSession(roomId, payload);
      const createdSessionId = String(data.data.id);
      if (inputMode === "STUDENT") {
        navigate(
          `/teacher/rooms/${roomId}/monitor?sessionId=${createdSessionId}`,
        );
      } else {
        setSessionId(createdSessionId);
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          "Konfigurasi belum dapat disimpan.",
      );
    } finally {
      setSaving(false);
    }
  };
  const addParticipant = async () => {
    try {
      const activeSessionId = await ensureTeacherSession();
      await gameApi.addTeacherParticipant(activeSessionId, {
        fullName: participantName.trim(),
        content: problemContent.trim(),
      });
      setParticipantName("");
      setProblemContent("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          "Data murid belum dapat ditambahkan.",
      );
    }
  };
  const ensureTeacherSession = async () => {
    if (sessionId) return sessionId;
    if (!topicId) {
      throw new Error("Pilih topik sebelum mengimpor data.");
    }
    const { data } = await roomApi.createSession(roomId, {
      topicId: Number(topicId),
      inputMode: "TEACHER",
      gameMode: "ALL_STUDENTS",
      problemDisplayLimit: 1,
      groupCount: null,
    });
    const createdSessionId = String(data.data.id);
    setSessionId(createdSessionId);
    return createdSessionId;
  };
  const previewParticipantFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const { data } = await gameApi.previewTeacherImport(file);
      setParticipantPreview(data.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "File belum dapat dipreview.",
      );
    } finally {
      event.target.value = "";
    }
  };
  const confirmParticipantImport = async () => {
    if (!participantPreview?.valid) return;
    setImporting(true);
    try {
      const activeSessionId = await ensureTeacherSession();
      await gameApi.importTeacherParticipants(
        activeSessionId,
        participantPreview.rows.map(({ fullName, content }) => ({
          fullName,
          content,
        })),
      );
      setParticipantPreview(null);
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ??
          requestError.message ??
          "Data Excel belum dapat diimport.",
      );
    } finally {
      setImporting(false);
    }
  };
  const downloadParticipantTemplate = async () => {
    try {
      const { data } = await gameApi.teacherParticipantTemplate();
      const url = URL.createObjectURL(data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "template-input-murid.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Template belum dapat diunduh.",
      );
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
        <select
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
          value={topicId}
          onChange={(event) => setTopicId(event.target.value)}
        >
          <option value="">Tanpa topik khusus</option>
          {topics.map((topic) => (
            <option value={topic.id} key={topic.id}>
              {topic.title} (
              {topic.visibility === "PRIVATE" ? "Pribadi" : "Sekolah"})
            </option>
          ))}
        </select>
      </label>
      <div className="rounded-xl border border-slate-800 p-4">
        <p className="text-sm font-medium">Buat topik pribadi</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
            placeholder="Judul topik"
            value={newTopicTitle}
            onChange={(event) => setNewTopicTitle(event.target.value)}
          />
          <input
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
            placeholder="Deskripsi"
            value={newTopicDescription}
            onChange={(event) => setNewTopicDescription(event.target.value)}
          />
        </div>
        <button
          className="mt-3 rounded-lg border border-amber-300 px-4 py-2 text-sm font-bold text-amber-200"
          type="button"
          onClick={createPrivateTopic}
        >
          Simpan topik pribadi
        </button>
      </div>
      <label className="block text-sm font-medium">
        Mode input
        <select
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
          value={inputMode}
          onChange={(event) => {
            const nextInputMode = event.target.value;
            setInputMode(nextInputMode);
            if (nextInputMode === "TEACHER") setGameMode("ALL_STUDENTS");
          }}
        >
          <option value="STUDENT">Murid mengisi nama dan masalah</option>
          <option value="TEACHER">Guru mengisi nama dan masalah</option>
        </select>
      </label>
      {inputMode === "TEACHER" ? (
        <p className="text-sm text-slate-400">
          Semua data permainan akan dikendalikan oleh Guru.
        </p>
      ) : (
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
      )}
      {inputMode === "STUDENT" && gameMode === "GROUPS" ? (
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
      {inputMode === "TEACHER" ? (
        <div className="space-y-4 rounded-xl border border-amber-300/40 p-4">
          <h2 className="text-lg font-semibold">Input data murid</h2>
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <input
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
              placeholder="Nama murid"
              value={participantName}
              onChange={(event) => setParticipantName(event.target.value)}
              required
            />
            <input
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3"
              maxLength="500"
              placeholder="Permasalahan (maksimal 500 karakter)"
              value={problemContent}
              onChange={(event) => setProblemContent(event.target.value)}
              required
            />
            <button
              className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-50"
              type="button"
              onClick={addParticipant}
              disabled={!sessionId}
            >
              Tambah data
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-lg border border-slate-600 px-4 py-3 text-sm font-bold"
              type="button"
              onClick={downloadParticipantTemplate}
            >
              Download template Excel
            </button>
            <label className="cursor-pointer rounded-lg border border-amber-300 px-4 py-3 text-sm font-bold text-amber-200">
              Import Excel
              <input
                className="hidden"
                type="file"
                accept=".xlsx,.xls"
                onChange={previewParticipantFile}
                disabled={importing}
              />
            </label>
          </div>
          {participantPreview ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2">Baris</th>
                    <th className="px-3 py-2">Nama</th>
                    <th className="px-3 py-2">Permasalahan</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {participantPreview.rows.map((row) => (
                    <tr key={row.row}>
                      <td className="px-3 py-2">{row.row}</td>
                      <td className="px-3 py-2">{row.fullName}</td>
                      <td className="px-3 py-2">{row.content}</td>
                      <td className="px-3 py-2 text-emerald-300">Valid</td>
                    </tr>
                  ))}
                  {participantPreview.errors.map((item) => (
                    <tr key={`error-${item.row}`}>
                      <td className="px-3 py-2">{item.row}</td>
                      <td colSpan="2" className="px-3 py-2">
                        {item.message}
                      </td>
                      <td className="px-3 py-2 text-rose-300">Error</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                className="mt-3 rounded-lg bg-amber-300 px-4 py-2 font-bold text-slate-950 disabled:opacity-50"
                type="button"
                disabled={!participantPreview.valid || importing}
                onClick={confirmParticipantImport}
              >
                Konfirmasi import
              </button>
            </div>
          ) : null}
          {sessionId ? (
            <button
              className="rounded-lg bg-emerald-400 px-4 py-3 font-bold text-slate-950"
              type="button"
              onClick={() =>
                navigate(
                  `/teacher/rooms/${roomId}/monitor?sessionId=${sessionId}`,
                )
              }
            >
              Lanjut ke permainan
            </button>
          ) : null}
        </div>
      ) : null}
      {!sessionId ? (
        <button
          className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-60"
          type="submit"
          disabled={saving}
        >
          {saving ? "Menyimpan..." : "Buat game session"}
        </button>
      ) : null}
    </form>
  );
}
