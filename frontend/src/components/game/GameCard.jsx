import "../../styles/card.css";

export function GameCard({ type, state, content }) {
  return (
    <article
      className="game-card"
      data-card-type={type}
      data-card-state={state}
    >
      <div
        className={`game-card__inner ${state === "revealed" ? "is-revealed" : ""}`}
      >
        <div className="game-card__face game-card__back">
          <span className="game-card__emblem">✦</span>
          <span className="game-card__back-label">MINDPLAY</span>
        </div>
        <div
          className={`game-card__face game-card__front ${type === "problem" ? "is-problem" : ""}`}
        >
          <span className="game-card__corner">
            {type === "participant" ? "A" : "?"}
          </span>
          <span className="game-card__type">
            {type === "participant" ? "NAMA PEMAIN" : "CERITA"}
          </span>
          <p>{content ?? "Menunggu kartu"}</p>
          <span className="game-card__corner game-card__corner--bottom">
            {type === "participant" ? "A" : "?"}
          </span>
        </div>
      </div>
    </article>
  );
}
