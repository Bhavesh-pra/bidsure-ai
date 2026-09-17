import React from 'react';
import { Badge } from '../ui/Badge';
import type { TenderCategory } from '../../types/tender';

export const TenderCategoryBadge: React.FC<{ category: TenderCategory }> = ({ category }) => (
  <Badge variant="info">{category.replace(/_/g, ' ')}</Badge>
);
