import React from 'react';
import { Badge } from '../ui/Badge';

export const ProcessingStatus: React.FC<{ status: string }> = ({ status }) => <Badge variant={status === 'PROCESSED' ? 'success' : status === 'FAILED' ? 'danger' : status === 'PROCESSING' ? 'warning' : 'neutral'}>{status.replace(/_/g, ' ')}</Badge>;
