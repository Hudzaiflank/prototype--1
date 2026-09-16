import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { roomApi } from "../../services/api/roomApi";
import {
  getStudentName,
  getStudentRoom,
  setParticipantSession,
  setStudentName,
} from "../../utils/storage";

export function RoomInputPage() {
  const navigate = useNavigate();
  const room = getStudentRoom();
  const [fullName, setFullName] = useState(getStudentName() ?? "");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!room?.gameSessionId) {
      setError("Sesi game belum tersedia.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const participantSessionId = crypto.randomUUID();
      await roomApi.registerParticipant(room.gameSessionId, {
        sessionId: participantSessionId,
        fullName: fullName.trim(),
      });
      await roomApi.submitProblem(room.gameSessionId, {
        participantSessionId,
        content: content.trim(),
      });
      setParticipantSession(participantSessionId);
      setStudentName(fullName.trim());
      navigate("../waiting", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Data belum dapat dikirim.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      className="mx-auto max-w-2xl space-y-6 rounded-[28px] border border-[#4f8cf0]/70 bg-[#241436]/90 p-6 shadow-[6px_6px_0_rgba(0,0,0,.45)] sm:p-9"
      onSubmit={handleSubmit}
    >
      <div>
        <h2 className="font-['Press_Start_2P'] text-sm leading-relaxed text-[#ffe98a] sm:text-base">
          Siapkan kartu kamu
        </h2>
        <p className="mt-4 font-[Lexend] text-sm leading-6 text-[#cbb8e0]">
          Nama kamu akan menjadi salah satu kartu permainan. Tulis satu hal yang
          ingin dibagikan dengan aman.
        </p>
      </div>
      <label className="block font-[Lexend] text-sm font-semibold">
        Nama panggilan
        <input
          className="mt-2 w-full rounded-xl border border-[#4f8cf0] bg-[#0a1f5c]/50 px-4 py-3 text-[#fdf6e3] outline-none focus:border-[#ffd23f]"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          maxLength={150}
          required
        />
      </label>
      <label className="block font-[Lexend] text-sm font-semibold">
        Hal yang ingin dibagikan
        <textarea
          className="mt-2 min-h-36 w-full resize-y rounded-xl border border-[#4f8cf0] bg-[#0a1f5c]/50 px-4 py-3 text-[#fdf6e3] outline-none focus:border-[#ffd23f]"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={500}
          required
        />
      </label>
      {error ? (
        <p className="font-[Lexend] text-sm text-[#ff9b8f]">{error}</p>
      ) : null}
      <button
        className="w-full rounded-xl bg-[#ffd23f] px-5 py-4 font-[Lexend] font-bold text-[#201a14] transition hover:bg-[#ffe98a] disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Mengirim..." : "Kirim dan tunggu"}
      </button>
    </form>
  );
}
