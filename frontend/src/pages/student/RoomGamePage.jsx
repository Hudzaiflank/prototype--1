import { useEffect } from "react";
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

  useEffect(() => {
    if (!room?.gameSessionId || !participantSessionId) return undefined;
    const socket = socketClient.connect({
      participantSessionId,
      gameSessionId: room.gameSessionId,
    });
    const updateState = (state) =>
      setGame((current) => ({ ...current, ...state }));
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
    socket.on(SOCKET_EVENTS.GAME_FINISHED, handleFinished);
    socket.emit("request-state");
    return () => {
      events.forEach((event) => socket.off(event, updateState));
      socket.off(SOCKET_EVENTS.GAME_STARTED, handleStarted);
      socket.off(SOCKET_EVENTS.CARDS_REVEALED, handleCardsRevealed);
      socket.off(SOCKET_EVENTS.TURN_COMPLETED, handleTurnChanged);
      socket.off(SOCKET_EVENTS.TURN_STARTED, handleTurnChanged);
      socket.off(SOCKET_EVENTS.GAME_FINISHED, handleFinished);
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
    </section>
  );
}
