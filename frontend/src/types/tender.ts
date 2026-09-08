import type { Requirement } from './requirement';

export interface Tender {
  id: string;
  title: string;
  description?: string;
  requirements?: Requirement[];
  createdAt?: string;
  updatedAt?: string;
}
