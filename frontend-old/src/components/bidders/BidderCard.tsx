import React from 'react';
import { Card } from '../ui/Card';
import type { Bidder } from '../../types';
export const BidderCard: React.FC<{ bidder: Bidder }> = ({ bidder }) => <Card title={bidder.legal_name}><p className="text-sm text-slate-600">PAN: {bidder.pan || '—'} · GSTIN: {bidder.gstin || '—'}</p></Card>;
