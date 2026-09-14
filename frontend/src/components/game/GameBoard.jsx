import { CardPair } from "./CardPair";
export function GameBoard(props) {
  return (
    <section aria-label="Game board">
      <CardPair {...props} />
    </section>
  );
}
