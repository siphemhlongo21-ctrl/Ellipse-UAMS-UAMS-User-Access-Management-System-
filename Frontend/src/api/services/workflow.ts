import { http } from "../client";
import type {
  FlowableTaskDto,
  FlowableHistoryEventDto,
  FlowableHealthDetails,
  FlowableSyncReport,
  FlowableSyncResult,
} from "../types";

export const workflowApi = {
  getTasks: (params: { candidateGroup?: string; requestId?: number }) =>
    http.get<FlowableTaskDto[]>("/WorkflowTasks/GetTasks", { params }),

  getHistory: (processInstanceId: string) =>
    http.get<FlowableHistoryEventDto[]>("/WorkflowTasks/GetHistory", {
      params: { processInstanceId },
    }),

  getHealth: () =>
    http.get<FlowableHealthDetails>("/WorkflowTasks/GetHealth"),

  getSyncReport: () =>
    http.get<FlowableSyncReport>("/WorkflowTasks/GetSyncReport"),

  syncRequest: (requestId: number) =>
    http.post<FlowableSyncResult>("/WorkflowTasks/SyncRequest", { params: { requestId } }),

  syncAll: () =>
    http.post<FlowableSyncResult[]>("/WorkflowTasks/SyncAll"),
};
