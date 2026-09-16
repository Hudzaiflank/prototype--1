import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { roomApi } from "../../services/api/roomApi";
import { isRoomCode } from "../../utils/validation";
import {
  clearStudentSession,
  getParticipantSession,
  getStudentRoom,
  setStudentRoom,
} from "../../utils/storage";

const routeForGameStatus = (roomCode, status) => {
  if (status === "WAITING") return `/room/${roomCode}/waiting`;
  if (status === "FINISHED") return `/room/${roomCode}/result`;
  return `/room/${roomCode}/game`;
};

export function JoinRoomPage() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedCode = roomCode.trim().toUpperCase();
    if (!isRoomCode(normalizedCode)) {
      setError("Kode room harus terdiri dari 6 karakter.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const { data } = await roomApi.join(normalizedCode);
      const room = data.data;
      const previousRoom = getStudentRoom();
      const participantSessionId = getParticipantSession();

      if (
        participantSessionId &&
        previousRoom?.gameSessionId === room.gameSessionId
      ) {
        try {
          const stateResponse = await roomApi.studentState(
            room.gameSessionId,
            participantSessionId,
          );
          setStudentRoom(room);
          navigate(
            routeForGameStatus(normalizedCode, stateResponse.data.data.status),
            {
              replace: true,
            },
          );
          return;
        } catch {
          clearStudentSession();
        }
      } else if (participantSessionId) {
        clearStudentSession();
      }

      setStudentRoom(room);
      navigate(`/room/${normalizedCode}/input`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ?? "Room tidak dapat ditemukan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      className="mx-auto flex min-h-screen w-full max-w-xl items-center px-5 py-10"
      aria-labelledby="join-title"
    >
      <form
        className="w-full space-y-7 rounded-[28px] border-2 border-[#ffd23f] bg-[#241436]/90 p-7 shadow-[6px_6px_0_rgba(0,0,0,.5)] sm:p-10"
        onSubmit={handleSubmit}
      >
        <div className="text-center">
          <p className="font-[Lexend] text-xs uppercase tracking-[0.3em] text-[#9a7a2a]">
            MindPlay
          </p>
          <h1
            className="mt-4 font-['Press_Start_2P'] text-xl leading-relaxed text-[#ffe98a]"
            id="join-title"
          >
            Masuk ke room
          </h1>
          <p className="mt-5 font-[Lexend] text-sm leading-6 text-[#cbb8e0]">
            Masukkan kode room dari guru untuk mulai bermain.
          </p>
        </div>
        <label className="block font-[Lexend] text-sm font-semibold text-[#fdf6e3]">
          Kode room
          <input
            className="mt-3 w-full rounded-xl border-2 border-[#4f8cf0] bg-[#0a1f5c]/50 px-4 py-4 text-center font-['Press_Start_2P'] text-lg uppercase tracking-[0.25em] text-[#fdf6e3] outline-none focus:border-[#ffd23f]"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            maxLength={6}
            autoComplete="off"
            autoFocus
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
          {isSubmitting ? "Memeriksa..." : "Masuk room"}
        </button>
      </form>
    </section>
  );
}
