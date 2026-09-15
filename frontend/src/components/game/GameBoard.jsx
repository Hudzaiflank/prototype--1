import { CardPair } from "./CardPair";
export function GameBoard(props) {
  return (
    <section
      className="mx-auto w-full max-w-2xl rounded-[28px] border-2 border-[#ffd23f] bg-[#241436]/80 p-5 shadow-[8px_8px_0_rgba(0,0,0,.5)] sm:p-8"
      aria-label="Game board"
    >
      <div className="mb-6 text-center">
        <p className="font-[Lexend] text-xs uppercase tracking-[0.3em] text-[#9a7a2a]">
          MindPlay board
        </p>
        <h2 className="mt-3 font-['Press_Start_2P'] text-sm leading-relaxed text-[#ffe98a]">
          Kartu pasangan
        </h2>
      </div>
      <CardPair {...props} />
    </section>
  );
}
