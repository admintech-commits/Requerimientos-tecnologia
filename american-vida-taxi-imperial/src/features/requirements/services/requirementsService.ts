import { api } from '@/lib/apiClient';
import type {
  CreateRequirementInput,
  ListFilters,
  Metrics,
  Requirement,
  RequirementEvent,
  Status,
} from '../types';

export function listRequirements(filters: ListFilters = {}): Promise<Requirement[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return api.get<Requirement[]>(`/requirements${query ? `?${query}` : ''}`);
}

export function getRequirement(
  id: number,
): Promise<{ requirement: Requirement; events: RequirementEvent[] }> {
  return api.get(`/requirements/${id}`);
}

export function createRequirement(input: CreateRequirementInput): Promise<Requirement> {
  return api.post<Requirement>('/requirements', input);
}

export function changeStatus(
  id: number,
  status: Status,
  comment?: string,
): Promise<Requirement> {
  return api.patch<Requirement>(`/requirements/${id}/status`, { status, comment });
}

export async function uploadAttachmentToRequirement(
  id: number,
  file: File,
): Promise<Requirement> {
  const { url } = await api.upload('/uploads', file);
  return api.post<Requirement>(`/requirements/${id}/attachments`, { url });
}

export function addComment(id: number, comment: string): Promise<{ ok: boolean }> {
  return api.post(`/requirements/${id}/comments`, { comment });
}

export function getMetrics(): Promise<Metrics> {
  return api.get<Metrics>('/requirements/metrics');
}

export function assignRequirement(
  id: number,
  assignee: { userId?: number | null; externalName?: string | null },
): Promise<Requirement> {
  return api.patch<Requirement>(`/requirements/${id}/assign`, assignee);
}
