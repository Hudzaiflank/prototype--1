import { useContext } from "react";
import { AuthContext } from "../context/auth-context";

export function useAuthContext() {
  return useContext(AuthContext);
}
