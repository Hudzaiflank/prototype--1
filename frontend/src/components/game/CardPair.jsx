import { GameCard } from "./GameCard";
export function CardPair({ participant, problem, state = "hidden", onProblemClick }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-8">
      <GameCard type="participant" state={state} content={participant} />
      <GameCard type="problem" state={state} content={problem} onClick={onProblemClick} />
    </div>
  );
}
