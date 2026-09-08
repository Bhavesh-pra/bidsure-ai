import React from 'react';
import { Badge } from '../ui/Badge';
import type { TenderStatus } from '../../types/tender';

const styles: Record<TenderStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  CLOSED: 'warning',
  CANCELLED: 'danger',
};

export const TenderStatusBadge: React.FC<{ status: TenderStatus }> = ({ status }) => (
  <Badge variant={styles[status] ?? 'neutral'}>{status.replace(/_/g, ' ')}</Badge>
);
