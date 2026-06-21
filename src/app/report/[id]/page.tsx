'use client';

import React, { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, Copy, Check, MessageSquare, ExternalLink, HelpCircle } from 'lucide-react';

interface Offer {
  id: string;
  role: string;
  company: string;
  city: string;
  experience_years: number;
  base_salary: string;
  equity?: string;
  sign_on?: string;
  status: string;
  created_at: string;
}

interface Report {
  id: string;
  offer_id: string;
  tx_hash: string;
  contract_address: string;
  market_salary_min: string;
  market_salary_max: string;
  market_salary_median: string;
  recommended_base: string;
  equity_rating: 'excellent' | 'standard' | 'below_market' | 'risky';
  equity_advice: string;
  negotiation_leverage: string;
  created_at: string;
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { authenticated, ready, user } = usePrivy();
  const router = useRouter();
  const { id } = React.use(params);

  const [offer, setOffer] = useState<Offer | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'polite' | 'assertive' | 'humorous'>('polite');

  const fetchReportDetails = async () => {
    try {
      const res = await fetch(`/api/offers/${id}`);
      const data = await res.json();
      if (res.ok) {
        setOffer(data.offer);
        setReport(data.report);
      }
    } catch (err) {
      console.error('Error fetching report details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  // Fetch report details
  useEffect(() => {
    if (id) {
      fetchReportDetails();
    }
  }, [id]);

  if (!ready || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!offer || !report) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Analysis Not Ready Yet</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          GenLayer validators are still executing models to verify the salary benchmarks for this role.
        </p>
        <Link href="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(val));
  };

  const getPercentagePosition = (val: number, min: number, max: number) => {
    if (val <= min) return 0;
    if (val >= max) return 100;
    return ((val - min) / (max - min)) * 100;
  };

  const offeredNum = Number(offer.base_salary);
  const minNum = Number(report.market_salary_min);
  const maxNum = Number(report.market_salary_max);
  const medianNum = Number(report.market_salary_median);
  const recNum = Number(report.recommended_base);

  const offeredPosition = getPercentagePosition(offeredNum, minNum, maxNum);
  const medianPosition = getPercentagePosition(medianNum, minNum, maxNum);
  const recPosition = getPercentagePosition(recNum, minNum, maxNum);

  // Email/Script templates based on selected tone
  const getEmailScript = () => {
    const candidateName = user?.email?.address?.split('@')[0] || 'Candidate';
    const targetSalaryStr = formatCurrency(recNum);
    const offeredSalaryStr = formatCurrency(offeredNum);

    switch (selectedTone) {
      case 'polite':
        return `Subject: Offer discussion - ${offer.role}

Hi team,

Thank you so much for extending this offer. I am thrilled about the opportunity to join ${offer.company} as a ${offer.role} and work with the team in ${offer.city}.

I reviewed the full terms of the agreement, and I am excited about the projects ahead. To make my transition smooth and finalize the details, I want to discuss the base compensation. Based on market parameters for Staff/Senior engineers in ${offer.city} with my experience level, I was hoping we could adjust the starting base salary to ${targetSalaryStr}. 

If we can align on this parameter, I am ready to sign the agreement immediately and start preparing for my transition.

Looking forward to your thoughts.

Best,
${candidateName}`;

      case 'assertive':
        return `Subject: Negotiation of terms - ${offer.role}

Hi team,

I received the written offer for the ${offer.role} position and appreciate the time everyone took during the interviews. I am confident I will bring immediate value to ${offer.company}'s upcoming milestones.

Before signing, I want to address the annual base salary. The offered base of ${offeredSalaryStr} is slightly below the current market median for staff roles of this caliber in ${offer.city}. Given my track record and years of experience, a base salary of ${targetSalaryStr} is standard. 

If we can adjust the contract base to ${targetSalaryStr}, I will sign and return the documents today.

Let me know if we can schedule a quick call to wrap this up.

Sincerely,
${candidateName}`;

      case 'humorous':
        return `Subject: Offer review: ${offer.role}

Hi team,

I am incredibly excited about the offer to join ${offer.company}! The culture and team match my style perfectly.

That said, my local grocery store in ${offer.city} does not accept equity options for eggs yet. I looked at the compensation benchmarks for Staff roles, and the current base of ${offeredSalaryStr} is lagging slightly behind the market. To ensure I can give 110% without worrying about inflation, can we adjust the starting base to ${targetSalaryStr}?

Let me know if this works. I would love to sign the papers and get to work!

Cheers,
${candidateName}`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getEmailScript());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Evaluated: <strong>{new Date(report.created_at).toLocaleDateString()}</strong>
        </div>
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '2.5rem' }}>{offer.role} Review</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Compensation report for <strong>{offer.company}</strong> in <strong>{offer.city}</strong>
        </p>
      </div>

      {/* Salary Visualizer Card */}
      <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Market Salary Benchmark</h2>
        
        {/* Visual range bar */}
        <div style={{ position: 'relative', height: '40px', backgroundColor: 'var(--bg-secondary)', borderRadius: '20px', border: '2px solid var(--card-border)', marginBottom: '3rem', marginTop: '1.5rem' }}>
          
          {/* Median Marker */}
          <div style={{ position: 'absolute', left: `${medianPosition}%`, top: '-10px', bottom: '-10px', width: '4px', backgroundColor: 'var(--primary-color)', zIndex: 10 }}>
            <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-color)' }}>
              MEDIAN ({formatCurrency(medianNum)})
            </div>
          </div>

          {/* Target Base Marker */}
          <div style={{ position: 'absolute', left: `${recPosition}%`, top: '-10px', bottom: '-10px', width: '4px', backgroundColor: 'var(--success-color)', zIndex: 11 }}>
            <div style={{ position: 'absolute', bottom: '-25px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: '800', color: 'var(--success-color)' }}>
              TARGET ({formatCurrency(recNum)})
            </div>
          </div>

          {/* Offered Base Indicator */}
          <div style={{ position: 'absolute', left: `${offeredPosition}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--danger-color)', border: '3px solid white', boxShadow: '0 0 10px rgba(0,0,0,0.2)', zIndex: 12 }} title="Your Offer">
            <div style={{ position: 'absolute', top: '-28px', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: '700', color: 'var(--danger-color)' }}>
              OFFERED ({formatCurrency(offeredNum)})
            </div>
          </div>
        </div>

        {/* Range metrics */}
        <div className="report-metrics" style={{ margin: 0 }}>
          <div className="metric-item">
            <div className="metric-label">Market Min</div>
            <div className="metric-value" style={{ color: 'var(--text-secondary)' }}>{formatCurrency(minNum)}</div>
          </div>
          <div className="metric-item" style={{ borderLeft: '2px solid var(--card-border)', borderRight: '2px solid var(--card-border)', padding: '0 1.5rem' }}>
            <div className="metric-label">Your Offer</div>
            <div className="metric-value" style={{ color: 'var(--danger-color)' }}>{formatCurrency(offeredNum)}</div>
          </div>
          <div className="metric-item">
            <div className="metric-label">Target Ask</div>
            <div className="metric-value" style={{ color: 'var(--success-color)' }}>{formatCurrency(recNum)}</div>
          </div>
        </div>

        {offeredNum < recNum && (
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: 'rgba(28, 176, 246, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--primary-color)' }}>
            <div style={{ color: 'var(--primary-color)' }}><ShieldCheck size={24} /></div>
            <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>
              Validators agreed you are leaving <strong>{formatCurrency(recNum - offeredNum)}</strong> on the table. You should push back on the base.
            </span>
          </div>
        )}
      </div>

      {/* Equity Assessment Card */}
      <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Equity Assessment</h2>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: '24px', fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase',
            ...(report.equity_rating === 'excellent' && { backgroundColor: 'rgba(88, 204, 2, 0.1)', color: 'var(--success-color)' }),
            ...(report.equity_rating === 'standard' && { backgroundColor: 'rgba(28, 176, 246, 0.1)', color: 'var(--primary-color)' }),
            ...(report.equity_rating === 'below_market' && { backgroundColor: 'rgba(255, 159, 67, 0.1)', color: 'var(--warning-color)' }),
            ...(report.equity_rating === 'risky' && { backgroundColor: 'rgba(238, 82, 83, 0.1)', color: 'var(--danger-color)' }),
          }}>
            {report.equity_rating === 'excellent' && <CheckCircle2 size={16} />}
            {report.equity_rating === 'risky' && <AlertTriangle size={16} />}
            Equity Rating: {report.equity_rating}
          </div>
        </div>

        <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
          {report.equity_advice}
        </p>

        {offer.equity && (
          <div style={{ borderTop: '2px solid var(--card-border)', paddingTop: '1.25rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Offered terms inputted: <em>{offer.equity}</em>
          </div>
        )}
      </div>

      {/* Negotiation Leverage & Talking Points */}
      <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem' }}>Strategic Leverage Points</h2>
        <div style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.8' }} className="leverage-points">
          {report.negotiation_leverage}
        </div>
      </div>

      {/* Script/Email Generator */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Customized Negotiation Script</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Select a tone to format your script, then copy it to use in your emails.</p>

        {/* Tone Selector Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--card-border)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
          <button 
            onClick={() => setSelectedTone('polite')}
            className="btn" 
            style={{ 
              padding: '0.5rem 1rem', 
              fontSize: '0.9rem',
              backgroundColor: selectedTone === 'polite' ? 'var(--primary-color)' : 'transparent',
              color: selectedTone === 'polite' ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            Polite & Professional
          </button>
          <button 
            onClick={() => setSelectedTone('assertive')}
            className="btn" 
            style={{ 
              padding: '0.5rem 1rem', 
              fontSize: '0.9rem',
              backgroundColor: selectedTone === 'assertive' ? 'var(--primary-color)' : 'transparent',
              color: selectedTone === 'assertive' ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            Assertive & Direct
          </button>
          <button 
            onClick={() => setSelectedTone('humorous')}
            className="btn" 
            style={{ 
              padding: '0.5rem 1rem', 
              fontSize: '0.9rem',
              backgroundColor: selectedTone === 'humorous' ? 'var(--primary-color)' : 'transparent',
              color: selectedTone === 'humorous' ? 'white' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '8px'
            }}
          >
            Witty & Humorous
          </button>
        </div>

        {/* Script Display box */}
        <div style={{ position: 'relative', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '2px solid var(--card-border)', padding: '1.5rem', minHeight: '150px', marginBottom: '1.5rem' }}>
          <button 
            onClick={handleCopy} 
            className="btn btn-secondary" 
            style={{ position: 'absolute', top: '10px', right: '10px', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}
            title="Copy script"
          >
            {copied ? (
              <>
                <Check size={14} style={{ color: 'var(--success-color)' }} /> Copied
              </>
            ) : (
              <>
                <Copy size={14} /> Copy Script
              </>
            )}
          </button>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.6', paddingTop: '1.5rem' }}>
            {getEmailScript()}
          </pre>
        </div>
      </div>

      {/* On-Chain Consensus Details */}
      <div style={{ borderTop: '2px solid var(--card-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <div>
          GenLayer Smart Contract: <code style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>{report.contract_address}</code>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          Consensus Tx Hash:{' '}
          <a 
            href={`https://genlayer-explorer.vercel.app/tx/${report.tx_hash}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}
          >
            {report.tx_hash.substring(0, 16)}... <ExternalLink size={12} />
          </a>
        </div>
      </div>

    </div>
  );
}
