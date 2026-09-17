import React from 'react';
import { Badge } from '../ui/Badge';

export const RuleBadge: React.FC<{ configured: boolean }> = ({ configured }) => <Badge variant={configured ? 'success' : 'warning'}>{configured ? '✓ Rule Configured' : '⚠ Rule Requires Configuration'}</Badge>;
