'use client';

import React, { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Eye, RefreshCw, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

interface Offer {
  id: string;
  role: string;
  company: string;
  city: string;
  experience_years: number;
  base_salary: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  market_salary_median?: string;
  recommended_base?: string;
  equity_rating?: string;
  created_at: string;
}

export default function Dashboard() {
  const { authenticated, ready, user } = usePrivy();
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch offers from database
  const fetchOffers = async (silent = false) => {
    if (!user?.id) return;
    try {
      if (!silent) setRefreshing(true);
      const res = await fetch(`/api/offers?userId=${user.id}`);
      const data = await res.json();
      if (data.offers) {
        setOffers(data.offers);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  // Initial fetch
  useEffect(() => {
    if (user?.id) {
      fetchOffers();
    }
  }, [user]);

  // Status Polling for active checks
  useEffect(() => {
    if (!user?.id || offers.length === 0) return;

    const hasActiveChecks = offers.some(
      (o) => o.status === 'pending' || o.status === 'processing'
    );

    if (hasActiveChecks) {
      const interval = setInterval(() => {
        fetchOffers(true); // Silent background fetch
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [offers, user]);

  if (!ready || loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(val));
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.25rem' }}>Your Offers</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track and manage your compensation reviews</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => fetchOffers()} 
            className="btn btn-secondary" 
            style={{ padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            disabled={refreshing}
            title="Refresh list"
          >
            <RefreshCw size={18} className={refreshing ? 'spinner' : ''} style={{ animationDuration: '2s' }} />
          </button>
          <Link href="/upload" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={18} /> New Offer Review
          </Link>
        </div>
      </div>

      {offers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', borderStyle: 'dashed' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <FileText size={64} style={{ opacity: 0.5 }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>No offers evaluated yet</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
            Did you get cold feet? Do not worry, negotiating is scary but leaving money on the table is scarier. Upload your offer letter details and let us do the heavy lifting.
          </p>
          <Link href="/upload" className="btn btn-success">
            Review Your First Offer
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {offers.map((offer) => {
            const hasDelta = offer.recommended_base && Number(offer.recommended_base) > Number(offer.base_salary);
            const delta = hasDelta ? Number(offer.recommended_base) - Number(offer.base_salary) : 0;

            return (
              <div key={offer.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.35rem' }}>{offer.role}</h3>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>at {offer.company}</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span>City: <strong>{offer.city}</strong></span>
                    <span>Experience: <strong>{offer.experience_years} years</strong></span>
                    <span>Offered: <strong>{formatCurrency(offer.base_salary)}</strong></span>
                  </div>

                  {/* Status Indicator */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', 
                    ...(offer.status === 'completed' && { backgroundColor: 'rgba(88, 204, 2, 0.1)', color: 'var(--success-color)' }),
                    ...(offer.status === 'processing' && { backgroundColor: 'rgba(28, 176, 246, 0.1)', color: 'var(--primary-color)' }),
                    ...(offer.status === 'pending' && { backgroundColor: 'rgba(71, 85, 105, 0.1)', color: 'var(--text-secondary)' }),
                    ...(offer.status === 'failed' && { backgroundColor: 'rgba(238, 82, 83, 0.1)', color: 'var(--danger-color)' }),
                  }}>
                    {offer.status === 'completed' && <CheckCircle size={14} />}
                    {offer.status === 'failed' && <AlertTriangle size={14} />}
                    {offer.status === 'processing' && <RefreshCw size={14} className="spinner" style={{ animationDuration: '2s' }} />}
                    {offer.status}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {offer.status === 'completed' && offer.recommended_base && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Target Base</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--success-color)' }}>
                        {formatCurrency(offer.recommended_base)}
                      </div>
                      {hasDelta && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: '700' }}>
                          +{formatCurrency(delta)} potential gain
                        </div>
                      )}
                    </div>
                  )}

                  {offer.status === 'completed' ? (
                    <Link href={`/report/${offer.id}`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Eye size={16} /> View Analysis
                    </Link>
                  ) : offer.status === 'processing' || offer.status === 'pending' ? (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                      Validators agreeing...
                    </div>
                  ) : (
                    <button onClick={() => fetchOffers()} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      Retry Check
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
