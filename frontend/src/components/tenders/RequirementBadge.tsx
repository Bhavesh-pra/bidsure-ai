import React from 'react';
import { Badge } from '../ui/Badge';
import type { Requirement } from '../../types';

export const RequirementBadge: React.FC<{ requirement: Requirement }> = ({ requirement }) => <Badge variant={requirement.mandatory ? 'warning' : 'neutral'}>{requirement.mandatory ? 'Mandatory' : 'Optional'}</Badge>;
