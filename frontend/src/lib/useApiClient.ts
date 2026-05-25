"use client";

import { useAuth } from "@clerk/nextjs";
import { useCallback, useRef } from "react";
import * as api from "./api";
import type {
  SimulationRequest,
} from "./api";

export function useApiClient() {
  const { getToken, isLoaded } = useAuth();
  const tokenRef = useRef<string | null>(null);

  const withToken = useCallback(
    async <T>(fn: (token: string | undefined) => Promise<T>): Promise<T> => {
      if (!tokenRef.current) {
        tokenRef.current = await getToken();
      }
      return fn(tokenRef.current ?? undefined);
    },
    [getToken],
  );

  if (!isLoaded) return null;

  return {
    getRisks: (params?: Parameters<typeof api.getRisks>[0]) =>
      withToken((t) => api.getRisks(params, t)),

    getAlerts: (params?: Parameters<typeof api.getAlerts>[0]) =>
      withToken((t) => api.getAlerts(params, t)),

    acknowledgeAlert: (id: string) =>
      withToken((t) => api.acknowledgeAlert(id, t)),

    getGraphNodes: (params?: Parameters<typeof api.getGraphNodes>[0]) =>
      withToken((t) => api.getGraphNodes(params, t)),

    searchGraph: (query: string) =>
      withToken((t) => api.searchGraph(query, t)),

    getAgentStatus: () =>
      withToken((t) => api.getAgentStatus(t)),

    startSimulation: (body: SimulationRequest) =>
      withToken((t) => api.startSimulation(body, t)),

    getSimulation: (jobId: string) =>
      withToken((t) => api.getSimulation(jobId, t)),
  };
}
