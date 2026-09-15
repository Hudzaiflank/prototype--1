import { useEffect, useState } from "react";
import { getParticipantSession, getStudentRoom } from "../../utils/storage";
import { roomApi } from "../../services/api/roomApi";

export function RoomResultPage() {
  const room = getStudentRoom();
  const participantSessionId = getParticipantSession();
  const [state, setState] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!room?.gameSessionId || !participantSessionId) return undefined;
    roomApi
      .studentState(room.gameSessionId, participantSessionId)
      .then(({ data }) => setState(data.data))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message ?? "Hasil belum dapat dimuat.",
        ),
      );
    return undefined;
  }, [participantSessionId, room?.gameSessionId]);

  return (
    <section
      className="mx-auto max-w-2xl rounded-[28px] border-2 border-[#ffd23f] bg-[#241436]/90 p-7 text-center shadow-[6px_6px_0_rgba(0,0,0,.5)] sm:p-10"
      aria-labelledby="result-title"
    >
      <p className="font-[Lexend] text-xs uppercase tracking-[0.3em] text-[#9a7a2a]">
        MindPlay · Room {room?.code}
      </p>
      <h2
        className="mt-5 font-['Press_Start_2P'] text-sm leading-relaxed text-[#ffe98a] sm:text-base"
        id="result-title"
      >
        Permainan selesai
      </h2>
      {error ? (
        <p className="mt-6 font-[Lexend] text-sm text-[#ff9b8f]">{error}</p>
      ) : (
        <>
          <p className="mt-5 font-[Lexend] text-sm leading-7 text-[#cbb8e0]">
            Terima kasih sudah ikut berbagi dan bermain bersama.
          </p>
          <div className="mt-8 grid gap-3 text-left font-[Lexend] text-sm">
            <div className="rounded-xl border border-[#4f8cf0]/60 bg-[#0a1f5c]/40 p-4">
              <span className="text-[#9a7a2a]">Status game</span>
              <strong className="float-right text-[#ffe98a]">
                {state?.status ?? "Memuat..."}
              </strong>
            </div>
            <div className="rounded-xl border border-[#4f8cf0]/60 bg-[#0a1f5c]/40 p-4">
              <span className="text-[#9a7a2a]">Nama kamu</span>
              <strong className="float-right text-[#fdf6e3]">
                {state?.participant?.fullName ?? "-"}
              </strong>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
