import React from 'react';
import { Badge } from '../ui/Badge';

export const ConfidenceLevelBadge: React.FC<{ confidence?: number | null }> = ({ confidence }) => {
  if (confidence == null) return <Badge variant="neutral">Unknown</Badge>;
  const value = confidence <= 1 ? confidence : confidence / 100;
  const level = value >= 0.9 ? 'HIGH' : value >= 0.7 ? 'MEDIUM' : 'LOW';
  const variant = level === 'HIGH' ? 'success' : level === 'MEDIUM' ? 'warning' : 'danger';
  return <Badge variant={variant}>{level} · {Math.round(value * 100)}%</Badge>;
};

export default ConfidenceLevelBadge;
