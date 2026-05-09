import { useMutation } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function useCreateOfflineTicket() {
  return useMutation({
    mutationFn: async (payload: { stake?: number; selections: Array<{ outcomeId: string; acceptedOdds: number; acceptedOddsVersion: number }> }) => {
      const { data } = await api.post("/offline-tickets", payload);
      return data as { id: string; shortCode: string; expiresAt: string };
    }
  });
}

