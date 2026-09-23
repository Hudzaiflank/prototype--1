import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentRoom, getParticipantSession } from "../../utils/storage";
import { socketClient } from "../../services/socket/socketClient";
import { SOCKET_EVENTS } from "../../services/socket/socketEvents";

export function RoomWaitingPage() {
  const navigate = useNavigate();
  const room = getStudentRoom();
  const participantSessionId = getParticipantSession();
  const [participantName, setParticipantName] = useState("");

  useEffect(() => {
    if (!room?.gameSessionId || !participantSessionId) return undefined;
    const socket = socketClient.connect({
      participantSessionId,
      gameSessionId: room.gameSessionId,
    });
    const handleSnapshot = (state) => {
      setParticipantName(state.participant?.fullName ?? "");
      if (["PLAYING", "PAUSED"].includes(state.status))
        navigate("../game", { replace: true });
    };
    socket.on(SOCKET_EVENTS.STATE_SNAPSHOT, handleSnapshot);
    socket.on(SOCKET_EVENTS.GAME_STARTED, handleSnapshot);
    return () => {
      socket.off(SOCKET_EVENTS.STATE_SNAPSHOT, handleSnapshot);
      socket.off(SOCKET_EVENTS.GAME_STARTED, handleSnapshot);
      socketClient.disconnect();
    };
  }, [navigate, participantSessionId, room?.gameSessionId]);

  return (
    <section className="mx-auto max-w-2xl rounded-[28px] border-2 border-[#ffd23f] bg-[#241436]/90 p-7 text-center shadow-[6px_6px_0_rgba(0,0,0,.5)] sm:p-10">
      <p className="font-[Lexend] text-xs uppercase tracking-[0.3em] text-[#9a7a2a]">
        Room {room?.code}
      </p>
      {room?.topicTitle ? (
        <p className="mt-3 font-[Lexend] text-sm font-bold text-[#ffd23f]">
          Topik yang di bahas hari ini : {room.topicTitle}
        </p>
      ) : null}
      <h2 className="mt-5 font-['Press_Start_2P'] text-sm leading-relaxed text-[#ffe98a] sm:text-base">
        Menunggu permainan
      </h2>
      {participantName ? (
        <p className="mt-4 font-[Lexend] text-base font-bold text-[#fdf6e3]">
          {participantName}
        </p>
      ) : null}
      <p className="mx-auto mt-5 max-w-lg font-[Lexend] text-sm leading-7 text-[#cbb8e0]">
        Jawabanmu sudah tersimpan. Guru akan memulai permainan ketika semua
        peserta siap.
      </p>
    </section>
  );
}
