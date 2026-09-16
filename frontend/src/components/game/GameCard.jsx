import "../../styles/card.css";

export function GameCard({ type, state, content, onClick }) {
  const isParticipant = type === "participant";
  const suit = isParticipant ? "♠" : "♥";
  const rank = isParticipant ? "A" : "?";

  return (
    <article
      className={`game-card ${type === "problem" && state === "revealed" && onClick ? "game-card--clickable" : ""}`}
      data-card-type={type}
      data-card-state={state}
      role={
        type === "problem" && state === "revealed" && onClick
          ? "button"
          : undefined
      }
      tabIndex={
        type === "problem" && state === "revealed" && onClick ? 0 : undefined
      }
      onClick={type === "problem" && state === "revealed" ? onClick : undefined}
      onKeyDown={(event) => {
        if (
          type === "problem" &&
          state === "revealed" &&
          onClick &&
          ["Enter", " "].includes(event.key)
        ) {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <div
        className={`game-card__inner ${state === "revealed" ? "is-revealed" : ""}`}
      >
        <div className="game-card__face game-card__back">
          <span className="game-card__back-fill" />
          <span className="game-card__back-diamond" />
          <span className="game-card__back-sheen" />
          <span className="game-card__emblem">✦</span>
          <span className="game-card__back-label">MINDPLAY</span>
        </div>
        <div
          className={`game-card__face game-card__front ${isParticipant ? "" : "is-problem"}`}
        >
          <span className="game-card__inner-frame" />
          <span className="game-card__foil" />
          <span className="game-card__corner">
            <b>{rank}</b>
            <small>{suit}</small>
          </span>
          <span className="game-card__suit-glow" />
          <span className="game-card__suit-big">{suit}</span>
          <p className="game-card__id-text">{content ?? "Menunggu kartu"}</p>
          <span className="game-card__corner game-card__corner--bottom">
            <b>{rank}</b>
            <small>{suit}</small>
          </span>
        </div>
      </div>
    </article>
  );
}
