'use client';
import { useEffect, useState } from 'react';
import RiskBadge from '@/components/RiskBadge';

interface Stats {
  total_scans: number;
  high_risk_count: number;
  flagged_urls: number;
}

interface ScanRecord {
  id: number;
  type: 'url' | 'email';
  url?: string;
  sender_domain?: string;
  risk_score: number;
  classification: string;
  reasons: string[];
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/analyze/history?type=stats').then(r => r.json()),
      fetch('/api/analyze/history?limit=20').then(r => r.json()),
    ])
      .then(([s, h]) => { setStats(s); setHistory(h); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: 'Total Scans', value: stats?.total_scans ?? '—', sub: 'URLs + Emails',
      color: 'text-indigo-600 bg-indigo-50',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
    },
    {
      label: 'High Risk Detected', value: stats?.high_risk_count ?? '—', sub: 'Score ≥ 70',
      color: 'text-red-600 bg-red-50',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
    },
    {
      label: 'Flagged URLs', value: stats?.flagged_urls ?? '—', sub: 'Medium or High risk',
      color: 'text-amber-600 bg-amber-50',
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918" /></svg>,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Live scan history and threat statistics.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${s.color}`}>{s.icon}</div>
            <p className="text-2xl font-bold text-slate-900">{loading ? '…' : s.value}</p>
            <p className="text-sm font-medium text-slate-700 mt-0.5">{s.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent scans table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Recent Scans</h2>
          <span className="text-xs text-slate-400">Last 20</span>
        </div>

        {loading ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">Loading…</div>
        ) : history.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
            </svg>
            <p className="text-sm text-slate-400">No scans yet. Analyze a URL or email to see results here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Target</th>
                  <th className="px-6 py-3 text-left">Risk</th>
                  <th className="px-6 py-3 text-left">Score</th>
                  <th className="px-6 py-3 text-left">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((row) => (
                  <tr key={`${row.type}-${row.id}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        row.type === 'url' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {row.type === 'url' ? 'URL' : 'Email'}
                      </span>
                    </td>
                    <td className="px-6 py-3 max-w-xs truncate font-mono text-xs text-slate-600">
                      {row.url || row.sender_domain || '—'}
                    </td>
                    <td className="px-6 py-3">
                      <RiskBadge classification={row.classification} />
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-700">{row.risk_score}</td>
                    <td className="px-6 py-3 text-xs text-slate-400">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
