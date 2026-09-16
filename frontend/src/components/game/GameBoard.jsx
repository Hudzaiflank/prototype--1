import { useState } from "react";
import { CardPair } from "./CardPair";
export function GameBoard(props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const { problem, state } = props;
  return (
    <>
      <section
        className="game-board mx-auto w-full max-w-2xl rounded-[28px] border-2 border-[#ffd23f] bg-[#241436]/80 p-5 shadow-[8px_8px_0_rgba(0,0,0,.5)] sm:p-8"
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
        <CardPair {...props} onProblemClick={() => setDetailOpen(true)} />
      </section>
      {detailOpen && state === "revealed" ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-transparent p-5 backdrop-blur-md"
          role="presentation"
          onClick={() => setDetailOpen(false)}
        >
          <article
            className="relative max-h-[82vh] w-full max-w-lg overflow-y-auto rounded-xl border-2 border-[#ffd23f] bg-gradient-to-b from-[#3a2350] to-[#241436] p-6 text-left shadow-[5px_5px_0_rgba(0,0,0,.6)] sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="problem-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border-2 border-[#ffd23f] bg-black/30 text-lg text-[#ffe98a]"
              type="button"
              aria-label="Tutup detail masalah"
              onClick={() => setDetailOpen(false)}
            >
              x
            </button>
            <h3 className="pr-10 font-['Press_Start_2P'] text-sm leading-relaxed text-[#ffe98a]" id="problem-detail-title">
              Detail masalah
            </h3>
            <p className="mt-5 whitespace-pre-line font-[Lexend] text-sm leading-7 text-[#fdf6e3]">
              {problem || "Belum ada masalah"}
            </p>
          </article>
        </div>
      ) : null}
    </>
  );
}
