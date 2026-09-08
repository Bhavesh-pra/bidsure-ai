import React from 'react';
import { Badge } from '../ui/Badge';

export const RuleStatus: React.FC<{ enabled: boolean; invalid?: boolean }> = ({ enabled, invalid }) => <Badge variant={invalid ? 'danger' : enabled ? 'success' : 'neutral'}>{invalid ? 'Invalid Rule' : enabled ? 'Enabled' : 'Disabled'}</Badge>;
