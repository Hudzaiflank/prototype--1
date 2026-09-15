import { Outlet, useParams } from "react-router-dom";

export function StudentRoomPage() {
  const { roomCode } = useParams();
  return (
    <section
      className="mx-auto min-h-screen w-full max-w-6xl px-4 py-5 sm:px-8 sm:py-8"
      aria-labelledby="room-title"
    >
      <header className="mb-7 flex items-center justify-between border-b border-[#9a7a2a]/50 pb-5">
        <div>
          <p className="font-[Lexend] text-xs uppercase tracking-[0.3em] text-[#9a7a2a]">
            MindPlay
          </p>
          <h1
            className="mt-2 font-['Press_Start_2P'] text-sm leading-relaxed text-[#ffe98a] sm:text-base"
            id="room-title"
          >
            Room {roomCode}
          </h1>
        </div>
        <span className="rounded-full border border-[#4f8cf0] px-3 py-2 font-[Lexend] text-xs text-[#cbb8e0]">
          Student
        </span>
      </header>
      <Outlet />
    </section>
  );
}
