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

  useEffect(() => {
    if (!sessionId) return undefined;
    let active = true;
    gameApi
      .state(sessionId)
      .then(({ data }) => {
        if (active) setGame(data.data);
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
    socket.on("connect", () =>
      socket.emit("join-game", { gameSessionId: Number(sessionId) }),
    );
    return () => {
      active = false;
      events.forEach((event) => socket.off(event, updateState));
      socketClient.disconnect();
    };
  }, [sessionId]);

  const handleAction = (action) => {
    const socket = socketClient.getSocket();
    if (!socket?.connected) return;
    if (["reveal-cards", "complete-turn"].includes(action)) {
      setError("Turn control membutuhkan group dan turn aktif.");
      return;
    }
    socket.emit(action);
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
      <GameBoard state="hidden" />
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
