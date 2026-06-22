'use client';

import React, { useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { Compass, ShieldAlert, Award, TrendingUp, Sparkles } from 'lucide-react';

export default function Home() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();



  if (!ready) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Hero Section */}
      <section style={{ textAlign: 'center', margin: '3rem 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo.svg" alt="Meridian Logo" style={{ width: '5.5rem', height: '5.5rem' }} />
        </div>
        
        <h1 style={{ fontSize: '3.5rem', lineHeight: '1.1', marginBottom: '1.5rem' }}>
          Stop leaving money on the table
        </h1>
        
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto 2.5rem auto' }}>
          You got the offer letter. Now the panic sets in. Are they lowballing you because of your city? Is that equity grant a standard piece of the pie or just a clever tax trap?
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={authenticated ? () => router.push('/upload') : login} 
            className="btn btn-primary" 
            style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
          >
            Verify Your Offer Now
          </button>
          <a href="#how-it-works" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            See How it Works
          </a>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section style={{ margin: '5rem 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '2.5rem' }}>
          The secrets recruiters do not want you to know
        </h2>
        
        <div className="grid">
          <div className="card">
            <div style={{ color: 'var(--primary-color)', marginBottom: '1rem' }}>
              <ShieldAlert size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Is it a trap?</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              We read between the lines. We check the vesting schedules, liquidation preferences, and potential dilution, revealing the real value of your equity.
            </p>
          </div>

          <div className="card">
            <div style={{ color: 'var(--success-color)', marginBottom: '1rem' }}>
              <TrendingUp size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Real salary benchmarks</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              We compare your base pay with live salary data across your role, experience level, and city. No outdated survey spreadsheets allowed here.
            </p>
          </div>

          <div className="card">
            <div style={{ color: 'var(--warning-color)', marginBottom: '1rem' }}>
              <Sparkles size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Negotiation script generator</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Get customized, persuasive copy scripts you can drop straight into your emails. Sound human, confident, and perfectly reasonable.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works / Consensus Section */}
      <section id="how-it-works" style={{ margin: '5rem 0', padding: '3rem 2rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '24px', border: '2px solid var(--card-border)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          On-chain compensation intelligence
        </h2>
        
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 3rem auto' }}>
          We deploy validator models to run consensus over your compensation parameters. This ensures your final recommendation is backed by a decentralized quorum, leaving no room for individual model bias.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--primary-color)', color: 'white', width: '2.5rem', height: '2.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>1</div>
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>Upload your offer letter details</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Input the base salary, equity stakes, city, and role from your letter.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--success-color)', color: 'white', width: '2.5rem', height: '2.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>2</div>
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>Consensus agreement</h3>
              <p style={{ color: 'var(--text-secondary)' }}>GenLayer validators query search APIs, verify benchmarks, and execute independent LLM models to reach a stable consensus on your review.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--warning-color)', color: 'white', width: '2.5rem', height: '2.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>3</div>
            <div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>Get your personalized negotiation scripts</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Read specifically what numbers to push back on and exactly by how much. Copy your customized email script and close the gap.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '2px solid var(--card-border)', paddingTop: '2rem', marginTop: '5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        <p>&copy; {new Date().getFullYear()} Meridian. Negotiation intelligence for everyone. Powered by on-chain consensus.</p>
      </footer>

    </div>
  );
}
