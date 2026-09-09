import React from 'react';
import { Badge } from '../ui/Badge';
export const BidStatusBadge: React.FC<{ status: string }> = ({ status }) => <Badge>{status.replace(/_/g, ' ')}</Badge>;
