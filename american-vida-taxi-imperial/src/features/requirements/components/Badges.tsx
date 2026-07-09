import { PRIORITY_LABELS, STATUS_LABELS } from '../constants';
import type { Priority, Status } from '../types';
import './Badges.css';

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`badge badge--status-${status}`}>{STATUS_LABELS[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`badge badge--priority-${priority}`}>{PRIORITY_LABELS[priority]}</span>;
}
