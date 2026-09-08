import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import ErrorState from '../components/ui/ErrorState';
import { EmptyTenderState } from '../components/tenders/EmptyTenderState';
import { TenderTable } from '../components/tenders/TenderTable';
import { tenderService } from '../services/tenderService';
import type { Tender } from '../types/tender';

const messageFor = (error: unknown) => (error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Failed to load tenders.');

export const TendersPage: React.FC = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const loadTenders = useCallback(async () => {
    setLoading(true); setError(undefined);
    try { const response = await tenderService.getTenders(); setTenders(response.data); }
    catch (requestError) { setError(messageFor(requestError)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadTenders(); }, [loadTenders]);

  return <Card title="Tenders" subtitle="Create and manage procurement tenders" action={<Link to="/tenders/new"><Button>Create Tender</Button></Link>}>
    {loading && <Loading message="Loading tenders..." />}
    {!loading && error && <div><ErrorState title="Unable to load tenders" message={error} /><div className="px-6 pb-6"><Button variant="outline" onClick={() => void loadTenders()}>Retry</Button></div></div>}
    {!loading && !error && tenders.length === 0 && <EmptyTenderState />}
    {!loading && !error && tenders.length > 0 && <TenderTable tenders={tenders} />}
  </Card>;
};

export default TendersPage;
