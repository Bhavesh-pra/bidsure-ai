import React from 'react';
import { Badge } from '../ui/Badge';
import type { RuleType } from '../../types/rule';

export const RuleTypeBadge: React.FC<{ type: RuleType }> = ({ type }) => <Badge variant="info">{type.replace(/_/g, ' ')}</Badge>;
