import React from 'react';
import { Badge } from '../ui/Badge';

export const ConfidenceBadge: React.FC<{ confidence?: number | null; threshold?: number }> = ({ confidence, threshold = 0.7 }) => {
  if (confidence == null) return <Badge variant="neutral">No confidence</Badge>;
  const value = confidence <= 1 ? confidence * 100 : confidence;
  const review = value / 100 < threshold;
  return <Badge variant={review ? 'warning' : 'success'}>{Math.round(value)}% confidence</Badge>;
};

export default ConfidenceBadge;
