import React from 'react';
import { Badge } from '../ui/Badge';

export const DocumentTypeBadge: React.FC<{ type?: string | null }> = ({ type }) => {
  const label = (type || 'UNKNOWN').replace(/_/g, ' ');
  return <Badge variant={type && type !== 'UNKNOWN' ? 'info' : 'neutral'}>{label}</Badge>;
};

export default DocumentTypeBadge;
