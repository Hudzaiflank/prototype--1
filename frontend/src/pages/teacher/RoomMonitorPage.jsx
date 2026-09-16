import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GameBoard } from "../../components/game/GameBoard";
import { GameStatus } from "../../components/game/GameStatus";
import { TeacherControls } from "../../components/game/TeacherControls";
import { gameApi } from "../../services/api/gameApi";
import { socketClient } from "../../services/socket/socketClient";
import { SOCKET_EVENTS } from "../../services/socket/socketEvents";
import { getAccessToken } from "../../utils/storage";

export function RoomMonitorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get("sessionId");
  const [game, setGame] = useState(null);
  const [error, setError] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [currentTurn, setCurrentTurn] = useState(null);
  const [completionCountdown, setCompletionCountdown] = useState(null);
  const [completionForSession, setCompletionForSession] = useState(null);
  const completionRedirectStarted = useRef(false);
  const teacherInputMode = game?.inputMode === "TEACHER";

  useEffect(() => {
    if (
      Number(game?.id) !== Number(sessionId) ||
      game?.status !== "FINISHED"
    )
      {
        completionRedirectStarted.current = false;
        return undefined;
      }
    if (completionRedirectStarted.current) return undefined;
    completionRedirectStarted.current = true;
    setCompletionForSession(sessionId);
    setCompletionCountdown(3);
    const countdown = window.setInterval(() => {
      setCompletionCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(countdown);
          navigate("/teacher/dashboard", { replace: true });
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(countdown);
  }, [game?.id, game?.status, navigate, sessionId]);

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
    const updateState = (state) => {
      if (Number(state?.id) !== Number(sessionId)) return;
      setGame(state);
    };
    const events = [
      SOCKET_EVENTS.STATE_SNAPSHOT,
      SOCKET_EVENTS.GAME_STARTED,
      SOCKET_EVENTS.GAME_PAUSED,
      SOCKET_EVENTS.GAME_RESUMED,
      SOCKET_EVENTS.GAME_FINISHED,
    ];
    events.forEach((event) => socket.on(event, updateState));
    const refreshAfterTransition = () => {
      gameApi.state(sessionId).then(({ data }) => {
        if (Number(data.data?.id) === Number(sessionId)) setGame(data.data);
      }).catch(() => {});
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

  const refreshCurrentTurn = async (groupId = selectedGroupId) => {
    if (!sessionId || !groupId || !["PLAYING", "PAUSED"].includes(game?.status)) return;
    try {
      const { data } = await gameApi.currentTurn(sessionId, groupId);
      setCurrentTurn(data.data);
    } catch {
      setCurrentTurn(null);
    }
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
      await refreshCurrentTurn();
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? requestError.message ?? "Aksi game gagal.");
    }
  };

  return (
    <section className="space-y-6" aria-labelledby="monitor-title">
      {completionCountdown !== null && completionForSession === sessionId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6" role="dialog" aria-modal="true" aria-labelledby="game-complete-title">
          <div className="w-full max-w-sm rounded-2xl border border-amber-300/60 bg-slate-900 p-8 text-center shadow-2xl">
            <h2 className="text-2xl font-bold text-amber-200" id="game-complete-title">Game selesai</h2>
            <p className="mt-3 text-sm text-slate-300">Anda akan diarahkan ke dashboard Guru.</p>
            <p className="mt-6 text-6xl font-black text-amber-300" aria-live="assertive">{completionCountdown}</p>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Teacher monitor
          </p>
          <h1 className="mt-3 text-3xl font-bold" id="monitor-title">
            Pantau permainan
          </h1>
          <p className="mt-2 text-sm font-semibold text-amber-200">
            Room {game?.roomCode ?? "-"}
          </p>
        </div>
        <GameStatus status={game?.status ?? "CONNECTING"} />
      </div>
      {error ? (
        <p className="rounded-xl border border-rose-400/50 bg-rose-950/30 p-4 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      {groups.length && teacherInputMode ? (
        <div className="rounded-2xl border border-amber-300/40 bg-slate-950/50 p-5">
          <p className="text-lg font-semibold text-amber-200">
            Sisa {Math.max(Number(groups[0].totalTurnCount ?? 0) - Number(groups[0].completedTurnCount ?? 0), 0)} turn
          </p>
        </div>
      ) : null}
      {groups.length && !teacherInputMode ? (
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <div>
            <p className="text-sm font-medium">Semua kelompok</p>
            <p className="mt-1 text-sm text-slate-400">Pilih kartu kelompok untuk mengatur turn yang sedang dipantau.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <button className={`rounded-xl border p-4 text-left ${String(group.id) === String(selectedGroupId) ? "border-amber-300" : "border-slate-700"}`} type="button" key={group.id} onClick={() => setSelectedGroupId(String(group.id))}>
                <div className="flex items-center justify-between gap-3"><span className="font-semibold">Kelompok {group.groupNumber}</span><span className="text-xs text-slate-400">{group.status}</span></div>
                <p className="mt-2 text-sm text-slate-400">Turn {Number(group.currentTurnNumber ?? group.completedTurnCount ?? 0)} dari {Number(group.totalTurnCount ?? 0)}</p>
                <p className="mt-1 text-sm text-amber-200">Sisa {Math.max(Number(group.totalTurnCount ?? 0) - Number(group.completedTurnCount ?? 0), 0)} turn</p>
                <p className="mt-1 text-sm text-slate-400">{group.members?.length ?? 0} peserta</p>
                <ul className="mt-3 space-y-1 text-sm text-slate-300">{(group.members ?? []).map((member) => <li key={member.id}>{member.fullName}</li>)}</ul>
              </button>
            ))}
          </div>
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
    </section>
  );
}
