import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { roomApi } from "../../services/api/roomApi";
import {
  getStudentRoom,
  setParticipantSession,
} from "../../utils/storage";

export function RoomInputPage() {
  const navigate = useNavigate();
  const room = getStudentRoom();
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (room?.gameSessionId)
      roomApi.students(room.gameSessionId).then(({ data }) => setStudents(data.data ?? []));
  }, [room?.gameSessionId]);

  const filteredStudents = students
    .filter((student) => {
      const search = studentSearch.trim().toLowerCase();
      return !search || `${student.fullName} ${student.nisn}`.toLowerCase().includes(search);
    })
    .slice(0, 20);

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
        studentId: Number(studentId),
      });
      await roomApi.submitProblem(room.gameSessionId, {
        participantSessionId,
        content: content.trim(),
      });
      setParticipantSession(participantSessionId);
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
        {room?.topicTitle ? (
          <p className="mt-4 font-[Lexend] text-sm font-bold text-[#ffd23f]">
            Topik yang di bahas hari ini : {room.topicTitle}
          </p>
        ) : null}
        <p className="mt-4 font-[Lexend] text-sm leading-6 text-[#cbb8e0]">
          Pilih nama kamu dari daftar kelas. Tulis satu hal yang
          ingin dibagikan dengan aman.
        </p>
      </div>
      <label className="block font-[Lexend] text-sm font-semibold">
        Nama siswa
        <input
          className="mt-2 w-full rounded-xl border border-[#4f8cf0] bg-[#0a1f5c]/50 px-4 py-3 text-[#fdf6e3] outline-none focus:border-[#ffd23f]"
          value={studentSearch}
          onChange={(event) => setStudentSearch(event.target.value)}
          placeholder="Cari nama atau NISN"
          autoComplete="off"
        />
        <select
          className="mt-2 w-full rounded-xl border border-[#4f8cf0] bg-[#0a1f5c]/50 px-4 py-3 text-[#fdf6e3] outline-none focus:border-[#ffd23f]"
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          required
        >
          <option value="">Pilih nama</option>
          {filteredStudents.map((student) => (
            <option key={student.studentId} value={student.studentId}>
              {student.fullName} - {student.nisn}
            </option>
          ))}
        </select>
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
