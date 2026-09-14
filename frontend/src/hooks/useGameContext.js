import { useContext } from "react";
import { GameContext } from "../context/game-context";

export function useGameContext() {
  return useContext(GameContext);
}
