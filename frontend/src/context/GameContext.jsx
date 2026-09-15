import { useCallback, useState } from "react";
import { GameContext } from "./game-context";

export function GameProvider({ children }) {
  const [game, setGame] = useState(null);
  const mergeGame = useCallback((nextGame) => {
    setGame((current) => ({ ...current, ...nextGame }));
  }, []);
  return (
    <GameContext.Provider value={{ game, setGame, mergeGame }}>
      {children}
    </GameContext.Provider>
  );
}
