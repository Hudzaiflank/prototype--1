import { useQuery } from "@tanstack/react-query";
import { gameApi } from "../services/api/gameApi";

export function useTeacherGameQuery(sessionId) {
  return useQuery({
    queryKey: ["game-session", "teacher", String(sessionId)],
    queryFn: async () => {
      const { data } = await gameApi.state(sessionId);
      return data.data;
    },
    enabled: Boolean(sessionId),
    staleTime: 5000,
    refetchInterval: (query) =>
      query.state.data?.status === "WAITING" ? 2000 : false,
    refetchIntervalInBackground: true,
  });
}

export function useGameGroupsQuery(sessionId) {
  return useQuery({
    queryKey: ["game-groups", String(sessionId)],
    queryFn: async () => {
      const { data } = await gameApi.groups(sessionId);
      return data.data ?? [];
    },
    enabled: Boolean(sessionId),
    staleTime: 5000,
  });
}
