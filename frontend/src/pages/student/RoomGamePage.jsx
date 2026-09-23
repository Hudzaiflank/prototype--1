import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GameBoard } from "../../components/game/GameBoard";
import { GameStatus } from "../../components/game/GameStatus";
import { useGame } from "../../hooks/useGame";
import { socketClient } from "../../services/socket/socketClient";
import { SOCKET_EVENTS } from "../../services/socket/socketEvents";
import { getParticipantSession, getStudentRoom } from "../../utils/storage";

export function RoomGamePage() {
  const { game, setGame } = useGame();
  const navigate = useNavigate();
  const room = getStudentRoom();
  const participantSessionId = getParticipantSession();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    if (!room?.gameSessionId || !participantSessionId) return undefined;
    const socket = socketClient.connect({
      participantSessionId,
      gameSessionId: room.gameSessionId,
    });
    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    const updateState = (state) => {
      if (state.status === "WAITING") {
        navigate("../waiting", { replace: true });
        return;
      }
      setGame(state);
    };
    const handleCardsRevealed = (turn) =>
      setGame((current) => ({
        ...current,
        currentTurn: {
          ...current?.currentTurn,
          id: turn.id,
          turnNumber: turn.turnNumber,
          participantName: turn.participant?.displayName,
          problemContent: turn.problem?.content,
          participantCardState: turn.participantCardState,
          problemCardState: turn.problemCardState,
        },
      }));
    const handleTurnChanged = () => socket.emit("request-state");
    const handleLeaderChanged = () => socket.emit("request-state");
    const handleStarted = () => socket.emit("request-state");
    const handleFinished = (state) => {
      updateState(state);
      navigate("../result", { replace: true });
    };
    const events = [
      SOCKET_EVENTS.STATE_SNAPSHOT,
      SOCKET_EVENTS.GAME_STARTED,
      SOCKET_EVENTS.GAME_PAUSED,
      SOCKET_EVENTS.GAME_RESUMED,
    ];
    events.forEach((event) => socket.on(event, updateState));
    socket.on(SOCKET_EVENTS.GAME_STARTED, handleStarted);
    socket.on(SOCKET_EVENTS.CARDS_REVEALED, handleCardsRevealed);
    socket.on(SOCKET_EVENTS.TURN_COMPLETED, handleTurnChanged);
    socket.on(SOCKET_EVENTS.TURN_STARTED, handleTurnChanged);
    socket.on(SOCKET_EVENTS.GROUP_LEADER_CHANGED, handleLeaderChanged);
    socket.on(SOCKET_EVENTS.GAME_FINISHED, handleFinished);
    socket.emit("request-state");
    return () => {
      events.forEach((event) => socket.off(event, updateState));
      socket.off(SOCKET_EVENTS.GAME_STARTED, handleStarted);
      socket.off(SOCKET_EVENTS.CARDS_REVEALED, handleCardsRevealed);
      socket.off(SOCKET_EVENTS.TURN_COMPLETED, handleTurnChanged);
      socket.off(SOCKET_EVENTS.TURN_STARTED, handleTurnChanged);
      socket.off(SOCKET_EVENTS.GROUP_LEADER_CHANGED, handleLeaderChanged);
      socket.off(SOCKET_EVENTS.GAME_FINISHED, handleFinished);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      setSocketConnected(false);
      socketClient.disconnect();
    };
  }, [navigate, participantSessionId, room?.gameSessionId, setGame]);

  const cardState =
    game?.currentTurn?.participantCardState === "REVEALED"
      ? "revealed"
      : "hidden";
  return (
    <section className="space-y-6" aria-labelledby="game-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-[Lexend] text-xs uppercase tracking-[0.3em] text-[#9a7a2a]">
            Permainan berjalan
          </p>
          {game?.gameMode === "GROUPS" && game?.group?.groupNumber ? (
            <p className="mt-2 font-[Lexend] text-sm font-bold text-[#ffd23f]">
              Kelompok {game.group.groupNumber}
            </p>
          ) : null}
          {game?.gameMode === "GROUPS" && game?.group ? (
            <div className="mt-4 rounded-xl border border-[#4f8cf0]/60 bg-[#0a1f5c]/30 p-4 font-[Lexend] text-sm text-[#fdf6e3]">
              <p className="font-bold text-[#ffe98a]">
                Ketua: {game.group.leaderName ?? "Menunggu ketua"}
              </p>
              <ul className="mt-2 space-y-1 text-[#cbb8e0]">
                {(game.group.members ?? []).map((member) => (
                  <li key={member.id}>
                    {member.fullName}
                    {member.isLeader ? " (Ketua)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {(game?.topicTitle ?? room?.topicTitle) ? (
            <p className="mt-2 font-[Lexend] text-sm text-[#cbb8e0]">
              Topik yang di bahas hari ini :{" "}
              {game?.topicTitle ?? room.topicTitle}
            </p>
          ) : null}
          <h2
            className="mt-2 font-['Press_Start_2P'] text-sm leading-relaxed text-[#ffe98a]"
            id="game-title"
          >
            Giliran kamu
          </h2>
        </div>
        <GameStatus status={game?.status ?? "CONNECTING"} />
      </div>
      <GameBoard
        state={cardState}
        participant={game?.currentTurn?.participantName}
        problem={game?.currentTurn?.problemContent}
      />
      {game?.gameMode === "GROUPS" &&
      game?.group?.isLeader &&
      game?.currentTurn?.status === "ACTIVE" ? (
        <div className="flex flex-wrap justify-center gap-3 font-[Lexend]">
          <button
            className="rounded-xl bg-[#ffd23f] px-5 py-3 font-bold text-[#201a14] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={
              !socketConnected ||
              game.currentTurn.participantCardState === "REVEALED"
            }
            onClick={() =>
              socketClient.getSocket()?.emit("reveal-cards", {
                gameSessionId: room.gameSessionId,
                groupId: game.group.id,
                turnId: game.currentTurn.id,
              })
            }
          >
            Buka kartu
          </button>
          <button
            className="rounded-xl border border-[#ffd23f] px-5 py-3 font-bold text-[#ffe98a] disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={
              !socketConnected ||
              game.currentTurn.participantCardState !== "REVEALED"
            }
            onClick={() =>
              socketClient.getSocket()?.emit("complete-turn", {
                gameSessionId: room.gameSessionId,
                groupId: game.group.id,
                turnId: game.currentTurn.id,
              })
            }
          >
            Selesaikan turn
          </button>
        </div>
      ) : null}
    </section>
  );
}
