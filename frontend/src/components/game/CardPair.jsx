import { GameCard } from "./GameCard";
export function CardPair({ participant, problem, state = "hidden" }) {
  return (
    <div>
      <GameCard type="participant" state={state} content={participant} />
      <GameCard type="problem" state={state} content={problem} />
    </div>
  );
}
