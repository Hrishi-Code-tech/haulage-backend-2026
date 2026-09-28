'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Scene = dynamic(() => import('@/components/Scene'), { ssr: false });

export default function LandingPage() {
  return (
    <div className="landing-wrapper" style={{ overflowX: 'hidden' }}>
      <div className="ambient-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <header className="site-nav scrolled" style={{ transform: 'translateY(0)', animation: 'none' }}>
        <Link href="/" className="brand" aria-label="Haulage Home">
          <span className="brand-mark"><i></i><i></i><i></i></span>
          <span>haulage</span>
        </Link>
        <nav>
          <Link href="#platform">Platform</Link>
          <Link href="#network">Network</Link>
          <Link href="#customers">Customers</Link>
        </nav>
        <Link href="/login" className="nav-login">
          Sign In <span>&rarr;</span>
        </Link>
      </header>

      <section className="landing-hero">
        <div className="hero-grid"></div>
        <div className="landing-scene">
          <Scene />
        </div>
        <div className="hero-content">
          <p className="eyebrow"><span className="live-dot"></span> System Online</p>
          <h1>Move what<br/><em>matters.</em></h1>
          <p className="hero-lede">One connected command center for every mile, load, and delivery. Experience the premium logistics operating system.</p>
          <div className="hero-actions">
            <Link href="/dashboard" className="primary-cta">
              <span className="cta-glow"></span>
              Open Dashboard <span className="cta-arrow">&rarr;</span>
            </Link>
            <Link href="/login" className="quiet-cta">
              Client Login <span>&rarr;</span>
            </Link>
          </div>
        </div>
        <div className="hero-foot">
          <span>HAULAGE V1.0</span>
          <span className="rule"></span>
          <span className="hero-scroll">SCROLL <b>&darr;</b></span>
        </div>
      </section>

      <section className="signal-strip">
        <div>
          <span>ACTIVE LOADS</span>
          <span className="signal-number amber">1,204</span>
        </div>
        <div>
          <span>NETWORK DRIVERS</span>
          <span className="signal-number">4,890</span>
        </div>
        <div>
          <span>ON-TIME DELIVERY</span>
          <span className="signal-number">99.8%</span>
        </div>
        <div>
          <span>SYSTEM UPTIME</span>
          <span className="signal-number amber">99.99%</span>
        </div>
      </section>

      <section id="platform" className="platform-section">
        <div className="section-intro">
          <h2>The Logistics<br/><em>Control Tower</em></h2>
        </div>
        <div className="feature-grid">
          <article>
            <span className="feature-index">01 / DISPATCH</span>
            <h3>Intelligent Routing</h3>
            <p>Automate assignments based on hours of service, location, and load requirements.</p>
            <Link href="/loads">View Loads <span>&rarr;</span></Link>
          </article>
          <article>
            <span className="feature-index">02 / VISIBILITY</span>
            <h3>Real-time Telemetry</h3>
            <p>Track every vehicle in your fleet with sub-second latency and predictive ETAs.</p>
            <Link href="/live-map">Live Map <span>&rarr;</span></Link>
          </article>
          <article>
            <span className="feature-index">03 / OPERATIONS</span>
            <h3>AI Negotiation</h3>
            <p>Let our AI agents negotiate rates with carriers instantly through our broker network.</p>
            <Link href="/negotiation-log">AI Logs <span>&rarr;</span></Link>
          </article>
        </div>
      </section>

      <section id="customers" className="social-proof">
        <p className="eyebrow">TRUSTED BY INDUSTRY LEADERS</p>
        <div className="proof-grid">
          <div className="proof-card">
            <blockquote>"Haulage completely transformed how we manage our European freight operations. The visibility is unmatched."</blockquote>
            <div className="proof-author">
              <div className="proof-avatar">JS</div>
              <div>
                <strong>Jane Smith</strong>
                <span>VP of Logistics, Northstar</span>
              </div>
            </div>
          </div>
          <div className="proof-card">
            <blockquote>"The AI negotiation feature alone saved us 15% on spot rates in the first quarter of using the platform."</blockquote>
            <div className="proof-author">
              <div className="proof-avatar">MR</div>
              <div>
                <strong>Marcus Reed</strong>
                <span>Director of Supply Chain</span>
              </div>
            </div>
          </div>
          <div className="proof-card">
            <blockquote>"Finally, a logistics platform that doesn't look and feel like it was built in 2005. My team loves it."</blockquote>
            <div className="proof-author">
              <div className="proof-avatar">AL</div>
              <div>
                <strong>Amanda Lee</strong>
                <span>Operations Manager</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="closing-section">
        <p className="eyebrow">READY TO DEPLOY?</p>
        <h2>Join the modern<br/><em>freight network.</em></h2>
        <Link href="/login" className="primary-cta">
          <span className="cta-glow"></span>
          Start your journey <span className="cta-arrow">&rarr;</span>
        </Link>
      </section>

      <footer className="site-footer">
        <div className="brand">
          <span className="brand-mark"><i></i><i></i><i></i></span>
          haulage
        </div>
        <span>© 2026 Haulage Logistics Platform</span>
        <span>Privacy Policy · Terms of Service · System Status</span>
      </footer>
    </div>
  );
}
