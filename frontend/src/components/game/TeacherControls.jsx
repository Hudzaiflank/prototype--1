export function TeacherControls({ status, onAction, disabled = false }) {
  const actions = {
    WAITING: [{ label: "Mulai permainan", action: "start-game" }],
    PLAYING: [
      { label: "Jeda", action: "pause-game" },
      { label: "Buka kartu", action: "reveal-cards" },
      { label: "Selesaikan turn", action: "complete-turn" },
      { label: "Selesaikan permainan", action: "finish-game" },
    ],
    PAUSED: [
      { label: "Lanjutkan", action: "resume-game" },
      { label: "Selesaikan permainan", action: "finish-game" },
    ],
  };

  return (
    <div className="flex flex-wrap gap-3" aria-label="Teacher controls">
      {(actions[status] ?? []).map((item) => (
        <button
          key={item.action}
          className="rounded-xl border border-[#ffd23f] px-4 py-3 font-[Lexend] text-sm font-bold text-[#ffe98a] transition hover:bg-[#ffd23f] hover:text-[#201a14] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={disabled}
          onClick={() => onAction(item.action)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
