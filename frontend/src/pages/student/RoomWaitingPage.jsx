import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentRoom, getParticipantSession } from "../../utils/storage";
import { socketClient } from "../../services/socket/socketClient";
import { SOCKET_EVENTS } from "../../services/socket/socketEvents";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";

export function RoomWaitingPage() {
  const navigate = useNavigate();
  const room = getStudentRoom();
  const participantSessionId = getParticipantSession();
  const [participantName, setParticipantName] = useState("");
  const [socketError, setSocketError] = useState("");
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    if (!room?.gameSessionId || !participantSessionId) return undefined;
    const socket = socketClient.connect({
      participantSessionId,
      gameSessionId: room.gameSessionId,
    });
    const handleSnapshot = (state) => {
      setParticipantName(state.participant?.fullName ?? "");
      if (state.status === "FINISHED") {
        setGameFinished(true);
        return;
      }
      if (["PLAYING", "PAUSED"].includes(state.status))
        navigate("../game", { replace: true });
    };
    const handleGameFinished = () => setGameFinished(true);
    const handleSocketError = ({ code, message } = {}) => {
      setSocketError(message ?? "Koneksi room gagal.");
      if (code === "PARTICIPANT_ALREADY_CONNECTED")
        socketClient.disconnect();
    };
    const handleConnectError = (error) => {
      setSocketError(error.message ?? "Koneksi room gagal.");
    };
    socket.on(SOCKET_EVENTS.STATE_SNAPSHOT, handleSnapshot);
    socket.on(SOCKET_EVENTS.GAME_STARTED, handleSnapshot);
    socket.on(SOCKET_EVENTS.GAME_FINISHED, handleGameFinished);
    socket.on(SOCKET_EVENTS.SERVER_ERROR, handleSocketError);
    socket.on("connect_error", handleConnectError);
    return () => {
      socket.off(SOCKET_EVENTS.STATE_SNAPSHOT, handleSnapshot);
      socket.off(SOCKET_EVENTS.GAME_STARTED, handleSnapshot);
      socket.off(SOCKET_EVENTS.GAME_FINISHED, handleGameFinished);
      socket.off(SOCKET_EVENTS.SERVER_ERROR, handleSocketError);
      socket.off("connect_error", handleConnectError);
      socketClient.disconnect();
    };
  }, [navigate, participantSessionId, room?.gameSessionId]);

  return (
    <section className="mx-auto max-w-2xl rounded-[28px] border-2 border-[#ffd23f] bg-[#241436]/90 p-7 text-center shadow-[6px_6px_0_rgba(0,0,0,.5)] sm:p-10">
      <p className="font-[Lexend] text-xs uppercase tracking-[0.3em] text-[#9a7a2a]">
        Room {room?.code}
      </p>
      {room?.topicTitle ? (
        <div className="mt-3 space-y-2">
          <p className="font-[Lexend] text-sm font-bold text-[#ffd23f]">
            Topik yang di bahas hari ini : {room.topicTitle}
          </p>
          {room?.topicDescription ? (
            <p className="font-[Lexend] text-sm leading-6 text-[#cbb8e0]">
              {room.topicDescription}
            </p>
          ) : null}
        </div>
      ) : null}
      <h2 className="mt-5 font-['Press_Start_2P'] text-sm leading-relaxed text-[#ffe98a] sm:text-base">
        {gameFinished ? "Permainan selesai" : "Menunggu permainan"}
      </h2>
      {gameFinished ? (
        <p className="mt-5 font-[Lexend] text-sm text-[#cbb8e0]" role="status">
          Guru telah mengakhiri sesi permainan ini.
        </p>
      ) : (
        <LoadingSpinner
          className="mt-5 justify-center text-sm text-[#cbb8e0]"
          label="Menunggu guru memulai..."
          size="sm"
        />
      )}
      {participantName ? (
        <p className="mt-4 font-[Lexend] text-base font-bold text-[#fdf6e3]">
          {participantName}
        </p>
      ) : null}
      {socketError ? (
        <p className="mt-4 font-[Lexend] text-sm text-[#ff9b8f]" role="alert">
          {socketError}
        </p>
      ) : null}
      <p className="mx-auto mt-5 max-w-lg font-[Lexend] text-sm leading-7 text-[#cbb8e0]">
        {gameFinished
          ? "Sesi room telah ditutup oleh guru."
          : "Jawabanmu sudah tersimpan. Guru akan memulai permainan ketika semua peserta siap."}
      </p>
    </section>
  );
}
