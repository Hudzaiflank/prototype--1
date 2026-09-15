import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { GameBoard } from "../../components/game/GameBoard";
import { GameStatus } from "../../components/game/GameStatus";
import { TeacherControls } from "../../components/game/TeacherControls";
import { gameApi } from "../../services/api/gameApi";
import { socketClient } from "../../services/socket/socketClient";
import { SOCKET_EVENTS } from "../../services/socket/socketEvents";
import { getAccessToken } from "../../utils/storage";

export function RoomMonitorPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId");
  const [game, setGame] = useState(null);
  const [error, setError] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [problemContent, setProblemContent] = useState("");
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [currentTurn, setCurrentTurn] = useState(null);
  const [participantPreview, setParticipantPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!sessionId) return undefined;
    let active = true;
    gameApi
      .state(sessionId)
      .then(({ data }) => {
        if (active) {
          setGame(data.data);
          return gameApi.groups(sessionId);
        }
        return null;
      })
      .then((response) => {
        if (!response || !active) return;
        const nextGroups = response.data.data ?? [];
        setGroups(nextGroups);
        if (nextGroups[0]) setSelectedGroupId(String(nextGroups[0].id));
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError.response?.data?.message ?? "Game belum dapat dimuat.",
          );
      });
    const socket = socketClient.connect({ token: getAccessToken() });
    const updateState = (state) =>
      setGame((current) => ({ ...current, ...state }));
    const events = [
      SOCKET_EVENTS.STATE_SNAPSHOT,
      SOCKET_EVENTS.GAME_STARTED,
      SOCKET_EVENTS.GAME_PAUSED,
      SOCKET_EVENTS.GAME_RESUMED,
      SOCKET_EVENTS.GAME_FINISHED,
    ];
    events.forEach((event) => socket.on(event, updateState));
    const refreshAfterTransition = () => {
      gameApi.state(sessionId).then(({ data }) => setGame(data.data)).catch(() => {});
    };
    socket.on(SOCKET_EVENTS.GAME_STARTED, refreshAfterTransition);
    socket.on(SOCKET_EVENTS.GAME_FINISHED, refreshAfterTransition);
    socket.on("connect", () =>
      socket.emit("join-game", { gameSessionId: Number(sessionId) }),
    );
    return () => {
      active = false;
      events.forEach((event) => socket.off(event, updateState));
      socket.off(SOCKET_EVENTS.GAME_STARTED, refreshAfterTransition);
      socket.off(SOCKET_EVENTS.GAME_FINISHED, refreshAfterTransition);
      socketClient.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || !selectedGroupId || !["PLAYING", "PAUSED"].includes(game?.status)) return;
    gameApi.currentTurn(sessionId, selectedGroupId)
      .then(({ data }) => setCurrentTurn(data.data))
      .catch(() => setCurrentTurn(null));
  }, [game?.status, selectedGroupId, sessionId]);

  const refreshMonitor = async () => {
    const [{ data: stateResponse }, { data: groupsResponse }] = await Promise.all([
      gameApi.state(sessionId),
      gameApi.groups(sessionId),
    ]);
    setGame(stateResponse.data);
    const nextGroups = groupsResponse.data ?? [];
    setGroups(nextGroups);
    if (!selectedGroupId && nextGroups[0]) setSelectedGroupId(String(nextGroups[0].id));
  };

  const handleAction = async (action) => {
    setError("");
    try {
      if (action === "start-game") await gameApi.startGame(sessionId);
      if (action === "pause-game") await gameApi.pauseGame(sessionId);
      if (action === "resume-game") await gameApi.resumeGame(sessionId);
      if (action === "finish-game") await gameApi.finishGame(sessionId);
      if (action === "reveal-cards") {
        if (!selectedGroupId || !currentTurn) throw new Error("Belum ada turn aktif.");
        await gameApi.revealCard(sessionId, selectedGroupId, currentTurn.id);
      }
      if (action === "complete-turn") {
        if (!selectedGroupId || !currentTurn) throw new Error("Belum ada turn aktif.");
        await gameApi.completeTurn(sessionId, selectedGroupId, currentTurn.id);
      }
      await refreshMonitor();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? requestError.message ?? "Aksi game gagal.");
    }
  };

  const addParticipant = async (event) => {
    event.preventDefault();
    setAddingParticipant(true);
    setError("");
    try {
      await gameApi.addTeacherParticipant(sessionId, {
        fullName: participantName.trim(),
        content: problemContent.trim(),
      });
      setParticipantName("");
      setProblemContent("");
      const { data } = await gameApi.state(sessionId);
      setGame(data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Data murid belum dapat ditambahkan.");
    } finally {
      setAddingParticipant(false);
    }
  };

  const previewParticipantFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setError("");
    try {
      const { data } = await gameApi.previewTeacherImport(sessionId, file);
      setParticipantPreview(data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "File belum dapat dipreview.");
    } finally {
      event.target.value = "";
    }
  };

  const confirmParticipantImport = async () => {
    if (!participantPreview?.valid) return;
    setImporting(true);
    try {
      await gameApi.importTeacherParticipants(sessionId, participantPreview.rows.map(({ fullName, content }) => ({ fullName, content })));
      setParticipantPreview(null);
      await refreshMonitor();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? "Data Excel belum dapat diimport.");
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
      setError(requestError.response?.data?.message ?? "Template belum dapat diunduh.");
    }
  };

  return (
    <section className="space-y-6" aria-labelledby="monitor-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Teacher monitor
          </p>
          <h1 className="mt-3 text-3xl font-bold" id="monitor-title">
            Pantau permainan
          </h1>
        </div>
        <GameStatus status={game?.status ?? "CONNECTING"} />
      </div>
      {error ? (
        <p className="rounded-xl border border-rose-400/50 bg-rose-950/30 p-4 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      {game?.status === "WAITING" && game?.inputMode === "TEACHER" ? (
        <div className="space-y-4">
          <form className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-5 md:grid-cols-[1fr_2fr_auto]" onSubmit={addParticipant}>
            <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" placeholder="Nama murid" value={participantName} onChange={(event) => setParticipantName(event.target.value)} required />
            <input className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-3" placeholder="Permasalahan" value={problemContent} onChange={(event) => setProblemContent(event.target.value)} required />
            <button className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-slate-950 disabled:opacity-60" type="submit" disabled={addingParticipant}>{addingParticipant ? "Menambah..." : "Tambah data"}</button>
          </form>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg border border-slate-600 px-4 py-3 text-sm font-bold text-slate-200" type="button" onClick={downloadParticipantTemplate}>Download template</button>
            <label className="cursor-pointer rounded-lg border border-amber-300 px-4 py-3 text-sm font-bold text-amber-200">Import Excel<input className="hidden" type="file" accept=".xlsx,.xls" onChange={previewParticipantFile} disabled={importing} /></label>
          </div>
        </div>
      ) : null}
      {groups.length && game?.gameMode === "GROUPS" ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <label className="text-sm font-medium">Kelompok aktif<select className="ml-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2" value={selectedGroupId} onChange={(event) => setSelectedGroupId(event.target.value)}>{groups.map((group) => <option value={group.id} key={group.id}>Kelompok {group.groupNumber} ({group.status})</option>)}</select></label>
          <p className="mt-3 text-sm text-slate-400">Peserta: {groups.find((group) => String(group.id) === String(selectedGroupId))?.members?.length ?? 0}</p>
        </div>
      ) : null}
      <GameBoard
        state={currentTurn?.participantCardState === "REVEALED" ? "revealed" : "hidden"}
        participant={currentTurn?.participantName ?? currentTurn?.participant?.displayName}
        problem={currentTurn?.problemContent ?? currentTurn?.problem?.content}
      />
      <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
        <TeacherControls
          status={game?.status}
          onAction={handleAction}
          disabled={!game}
        />
      </div>
      {participantPreview ? (
        <div className="space-y-4 rounded-2xl border border-amber-300/40 bg-slate-950/50 p-5">
          <h2 className="text-lg font-semibold">Preview data murid</h2>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-slate-800 text-slate-400"><tr><th className="px-3 py-2">Baris</th><th className="px-3 py-2">Nama Lengkap</th><th className="px-3 py-2">Permasalahan</th><th className="px-3 py-2">Status</th></tr></thead><tbody>{participantPreview.rows.map((row) => <tr className="border-b border-slate-800/70" key={row.row}><td className="px-3 py-2">{row.row}</td><td className="px-3 py-2">{row.fullName}</td><td className="px-3 py-2">{row.content}</td><td className="px-3 py-2 text-emerald-300">Valid</td></tr>)}{participantPreview.errors.map((item) => <tr key={`error-${item.row}`}><td className="px-3 py-2">{item.row}</td><td colSpan="2" className="px-3 py-2">{item.message}</td><td className="px-3 py-2 text-rose-300">Error</td></tr>)}</tbody></table></div>
          <div className="flex gap-3"><button className="rounded-lg border border-slate-600 px-4 py-2 text-sm" type="button" onClick={() => setParticipantPreview(null)}>Batal</button><button className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50" type="button" disabled={!participantPreview.valid || importing} onClick={confirmParticipantImport}>Konfirmasi import</button></div>
        </div>
      ) : null}
    </section>
  );
}
