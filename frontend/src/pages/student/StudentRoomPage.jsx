import { Outlet, useParams } from "react-router-dom";

export function StudentRoomPage() {
  const { roomCode } = useParams();
  return (
    <section aria-labelledby="room-title">
      <h1 id="room-title">Room {roomCode}</h1>
      <Outlet />
    </section>
  );
}
