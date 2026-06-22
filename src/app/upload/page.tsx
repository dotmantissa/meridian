'use client';

import React, { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, AlertCircle } from 'lucide-react';

export default function UploadOffer() {
  const { authenticated, ready, user } = usePrivy();
  const router = useRouter();

  // Form State
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [city, setCity] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [equity, setEquity] = useState('');
  const [signOn, setSignOn] = useState('');
  const [rawText, setRawText] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!role.trim() || !company.trim() || !city.trim() || !experienceYears || !baseSalary) {
      setError('Please fill in all required fields.');
      return;
    }

    if (Number(experienceYears) < 0 || Number(baseSalary) <= 0) {
      setError('Please enter valid numeric parameters.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          role: role.trim(),
          company: company.trim(),
          city: city.trim(),
          experienceYears: parseInt(experienceYears),
          baseSalary: parseFloat(baseSalary),
          equity: equity.trim(),
          signOn: parseFloat(signOn || '0'),
          rawText: rawText.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit offer.');
      }

      // Success - redirect directly to report page (where polling loader will wait for consensus)
      router.push(`/report/${data.offer.id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1>Analyze Your Offer</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Input the parameters below. GenLayer validators will evaluate the market benchmarks and verify the terms on-chain.</p>
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: 'rgba(238, 82, 83, 0.1)', borderColor: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', marginBottom: '1.5rem', color: 'var(--danger-color)' }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Row 1: Role & Company */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="role">Role / Job Title *</label>
            <input 
              id="role"
              type="text" 
              className="form-control" 
              placeholder="e.g. Staff Dev" 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="company">Company Name *</label>
            <input 
              id="company"
              type="text" 
              className="form-control" 
              placeholder="e.g. Acme Corp" 
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              disabled={submitting}
            />
          </div>
        </div>

        {/* Row 2: Location & Experience */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="city">City / Location *</label>
            <input 
              id="city"
              type="text" 
              className="form-control" 
              placeholder="e.g. London" 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="experience">Years of Experience *</label>
            <input 
              id="experience"
              type="number" 
              className="form-control" 
              placeholder="e.g. 5" 
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              required
              min="0"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Row 3: Base Salary & Sign-on */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="salary">Annual Base Salary (USD) *</label>
            <input 
              id="salary"
              type="number" 
              className="form-control" 
              placeholder="e.g. 120000" 
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              required
              min="1"
              disabled={submitting}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" htmlFor="signon">Sign-on Bonus (Optional)</label>
            <input 
              id="signon"
              type="number" 
              className="form-control" 
              placeholder="e.g. 10000" 
              value={signOn}
              onChange={(e) => setSignOn(e.target.value)}
              min="0"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Equity description */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="equity">Equity Details (Optional)</label>
          <input 
            id="equity"
            type="text" 
            className="form-control" 
            placeholder="e.g. 0.05% options, 4-year vesting, 1-year cliff" 
            value={equity}
            onChange={(e) => setEquity(e.target.value)}
            disabled={submitting}
          />
        </div>

        {/* Raw Offer Wording */}
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label" htmlFor="rawtext">Offer Letter Wording / Additional Notes (Optional)</label>
          <textarea 
            id="rawtext"
            rows={4} 
            className="form-control" 
            placeholder="Paste the exact clauses here. Validators will inspect them for unfavorable terms."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            disabled={submitting}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={submitting}
          style={{ width: '100%', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          {submitting ? (
            <>
              <div className="spinner" style={{ width: '1.2rem', height: '1.2rem', borderWidth: '2px' }}></div>
              Submitting to consensus...
            </>
          ) : (
            <>
              <Send size={18} /> Submit for Validation
            </>
          )}
        </button>
      </form>
    </div>
  );
}
