import { gameApi } from "../services/api/gameApi";

export function useTeacherGame() {
  return {
    startGame: gameApi.startGame,
    pauseGame: gameApi.pauseGame,
    resumeGame: gameApi.resumeGame,
    revealCard: gameApi.revealCard,
    completeTurn: gameApi.completeTurn,
    finishGame: gameApi.finishGame,
  };
}
