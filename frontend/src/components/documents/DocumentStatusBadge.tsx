import React from 'react';
import { Badge } from '../ui/Badge';

export interface DocumentStatusBadgeProps {
  status: string;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({ status }) => {
  const norm = (status || '').toUpperCase();

  switch (norm) {
    case 'UPLOADED':
      return <Badge variant="success">✓ Uploaded</Badge>;
    case 'PROCESSING':
      return <Badge variant="info">⏳ Processing</Badge>;
    case 'PROCESSED':
      return <Badge variant="success">✓ Processed</Badge>;
    case 'INVALID':
      return <Badge variant="danger">✕ Invalid</Badge>;
    case 'FAILED':
      return <Badge variant="danger">✕ Failed</Badge>;
    case 'MISSING':
      return <Badge variant="neutral">○ Missing</Badge>;
    default:
      return <Badge variant="neutral">{status || 'Unknown'}</Badge>;
  }
};

export default DocumentStatusBadge;
