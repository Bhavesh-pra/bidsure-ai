import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { authService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { ShieldCheck, Lock, Mail, AlertCircle, Building2, KeyRound, UserCheck, Briefcase } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const { login: authLogin } = useAuth();

  const [email, setEmail] = useState('officer@bidsure.demo');
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
      const userData = response.data.user;

      authLogin(token, {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        actor_type: userData.actor_type || 'GOVERNMENT',
        organization_id: userData.organization_id,
        organization_name: userData.organization_name,
        organization_type: userData.organization_type,
      });

      // Role-based redirect
      if (returnTo) {
        navigate(returnTo, { replace: true });
      } else if (userData.actor_type === 'BIDDER') {
        navigate('/bidder/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (preset: 'officer' | 'bidder') => {
    if (preset === 'officer') {
      setEmail('officer@bidsure.demo');
      setPassword('officer123');
    } else {
      setEmail('bidder@abctech.demo');
      setPassword('bidder123');
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

          <div className="mt-6 rounded-[6px] bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 space-y-2.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-1">
              <KeyRound className="h-3.5 w-3.5 text-[#0F766E]" />
              <span>SIH Demo — Quick Login:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLogin('officer')}
                className={`flex items-center space-x-2 rounded-[6px] border p-2.5 text-left transition-all ${
                  email === 'officer@bidsure.demo'
                    ? 'border-[#0F766E] bg-[#ECFDF3] ring-1 ring-[#0F766E]'
                    : 'border-slate-200 hover:border-slate-400 hover:bg-white'
                }`}
              >
                <UserCheck className="h-4 w-4 text-[#0F766E] shrink-0" />
                <div>
                  <p className="font-semibold text-[11px] text-slate-800">Procurement Officer</p>
                  <p className="font-mono text-[10px] text-slate-500">officer@bidsure.demo</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('bidder')}
                className={`flex items-center space-x-2 rounded-[6px] border p-2.5 text-left transition-all ${
                  email === 'bidder@abctech.demo'
                    ? 'border-[#0F766E] bg-[#ECFDF3] ring-1 ring-[#0F766E]'
                    : 'border-slate-200 hover:border-slate-400 hover:bg-white'
                }`}
              >
                <Briefcase className="h-4 w-4 text-[#2563EB] shrink-0" />
                <div>
                  <p className="font-semibold text-[11px] text-slate-800">Vendor / Bidder</p>
                  <p className="font-mono text-[10px] text-slate-500">bidder@abctech.demo</p>
                </div>
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
