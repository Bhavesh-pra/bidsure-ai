import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { authService } from '../services/authService';
import { ShieldCheck, Lock, Mail, AlertCircle, Building2, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const [email, setEmail] = useState('officer@bidsure.gov.in');
  const [password, setPassword] = useState('officer123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both official email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      const token = response.data.access_token;
      localStorage.setItem('access_token', token);
      localStorage.setItem('token', token);
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your officer credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[75vh] items-center justify-center py-10">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-slate-300">
          <div className="text-center mb-6 pt-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[10px] bg-[#0F2747] text-[#14B8A6] mb-3 shadow-sm border border-[#183B63]">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F2747] tracking-tight">BidSure AI</h1>
            <p className="text-xs text-slate-500 mt-1">
              Procurement Compliance & Verification Authority Portal
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2.5 rounded-[6px] bg-[#FEF2F2] p-3 text-xs text-[#B91C1C] border border-[#FCA5A5] font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Official Government / Enterprise Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@bidsure.gov.in"
                  required
                  className="w-full rounded-[6px] border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Authority Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-[6px] border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E] transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full justify-center py-2.5 font-bold"
              isLoading={loading}
            >
              Sign In to Procurement Portal
            </Button>
          </form>

          <div className="mt-6 rounded-[6px] bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-1">
              <KeyRound className="h-3.5 w-3.5 text-[#0F766E]" />
              <span>SIH Demo Officer Credentials:</span>
            </div>
            <p className="font-mono text-[11px]"><strong>Email:</strong> officer@bidsure.gov.in</p>
            <p className="font-mono text-[11px]"><strong>Password:</strong> officer123</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
