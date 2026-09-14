import { useState } from "react";
import { GameContext } from "./game-context";

export function GameProvider({ children }) {
  const [game, setGame] = useState(null);
  return (
    <GameContext.Provider value={{ game, setGame }}>
      {children}
    </GameContext.Provider>
  );
}
