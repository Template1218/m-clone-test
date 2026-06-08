import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function useAddSelectionToSlip() {
  return useMutation({
    mutationFn: async ({ slipId, outcomeId, acceptedOdds, acceptedOddsVersion }: { slipId: string; outcomeId: string; acceptedOdds: number; acceptedOddsVersion: number }) => {
      const { data } = await api.post("/betslips/user/selection", { slipId, outcomeId, acceptedOdds, acceptedOddsVersion });
      return data.slip;
    }
  });
}

export function useBulkUpsertSlipSelections() {
  return useMutation({
    mutationFn: async (payload: {
      slipId: string;
      slotNumber: 1 | 2 | 3;
      selections: Array<{ outcomeId?: string; selectionKey?: string; acceptedOdds: number; acceptedOddsVersion: number }>;
    }) => {
      const { data } = await api.post("/betslips/user/selections/bulk", payload);
      return data.data;
    },
  });
}

export function usePlaceSlip() {
  return useMutation({
    mutationFn: async ({ slipId, stake }: { slipId: string; stake: number }) => {
      const { data } = await api.post("/betslips/user/place", { slipId, stake });
      return data.slip;
    }
  });
}

export function useCreateUserSlip() {
  return useMutation({
    mutationFn: async ({ slotNumber }: { slotNumber: 1 | 2 | 3 }) => {
      const { data } = await api.post("/betslips/user", { slotNumber });
      return data.slip;
    }
  });
}

export function useMyUserBetslips(enabled = true, period: "24h" | "7d" | "30d" | "all" = "24h") {
  return useQuery({
    queryKey: ["user-betslips", period],
    queryFn: async () => {
      const { data } = await api.get("/betslips/user/mine", { params: { period } });
      return data.slips || [];
    },
    enabled,
  });
}

export function useTicketDetails(slipId: string, enabled = true) {
  return useQuery({
    queryKey: ["user-ticket", slipId],
    queryFn: async () => {
      const { data } = await api.get(`/betslips/user/${slipId}`);
      return data.slip;
    },
    enabled: enabled && !!slipId,
    retry: false,
  });
}
