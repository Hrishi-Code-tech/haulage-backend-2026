'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Dynamically import the 3D scene so it only renders on client
const Scene = dynamic(() => import('../components/Scene'), { ssr: false });

export default function Home() {
  return (
    <>
      <header className="site-nav" id="site-nav">
        <Link className="brand" href="/">
          <span className="brand-mark"><i></i><i></i><i></i></span>
          <span>haulage</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="#platform">Platform</Link>
          <Link href="#network">Network</Link>
          <Link href="#company">Company</Link>
        </nav>
        <Link className="nav-login" href="/login">Log in <span>↗</span></Link>
      </header>
      <main>
      <section className="landing-hero">
        <div className="hero-grid"></div>
        <div className="hero-content">
          <p className="eyebrow"><span className="live-dot"></span> The freight operating system</p>
          <h1>Keep the<br/><em>world moving.</em></h1>
          <p className="hero-lede">One intelligent layer for loads, drivers, and every mile between them.</p>
          <div className="hero-actions">
            <Link className="primary-cta" href="/login">
              <span className="cta-glow"></span>Enter control tower <span className="cta-arrow">→</span>
            </Link>
            <Link className="quiet-cta" href="#platform">
              Explore the platform <span>↓</span>
            </Link>
          </div>
        </div>
        <div className="landing-scene" id="landing-scene" aria-label="Animated haulage truck on a highway">
          <Scene />
        </div>
        <div className="scene-status">
          <span className="live-dot"></span><span>Live route simulation</span>
          <button id="landing-motion" type="button">Pause</button>
        </div>
        <div className="hero-foot">
          <span>ROUTE / 01</span><span className="rule"></span><span>ROTTERDAM — BERLIN</span>
          <span className="hero-scroll">Scroll to move <b>↓</b></span>
        </div>
      </section>

      <motion.section 
        className="signal-strip" 
        id="network"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7 }}
      >
        <div><span className="signal-number" data-count="24">24</span><span>active loads</span></div>
        <div><span className="signal-number" data-count="96.8" data-suffix="%">96.8%</span><span>on-time delivery</span></div>
        <div><span className="signal-number" data-count="18" data-suffix="k">18k</span><span>miles tracked today</span></div>
        <div><span className="signal-number amber" data-count="01">01</span><span>control tower</span></div>
      </motion.section>

      <section className="platform-section" id="platform">
        <motion.div 
          className="section-intro"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7 }}
        >
          <p className="eyebrow">Built for the whole journey</p>
          <h2>Clarity at<br/><em>every mile.</em></h2>
        </motion.div>
        <motion.div 
          className="feature-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
        >
          <motion.article variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <span className="feature-index">01 / Dispatch</span>
            <h3>See the network<br/>as it moves.</h3>
            <p>Live telemetry turns a thousand moving parts into one calm, actionable view.</p>
            <Link href="/login">Open the tower <span>↗</span></Link>
          </motion.article>
          <motion.article variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <span className="feature-index">02 / Intelligence</span>
            <h3>Route around<br/>the unexpected.</h3>
            <p>Closed-loop matching responds to delays before they become missed deliveries.</p>
            <Link href="/login">Meet the system <span>↗</span></Link>
          </motion.article>
          <motion.article variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
            <span className="feature-index">03 / Trust</span>
            <h3>Every handoff,<br/>accounted for.</h3>
            <p>From invoice to arrival, your operation keeps a clean, connected record.</p>
            <Link href="/login">Start moving <span>↗</span></Link>
          </motion.article>
        </motion.div>
      </section>

      <motion.section 
        className="social-proof"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7 }}
      >
        <p className="eyebrow">Trusted by operators across the network</p>
        <div className="proof-grid">
          <div className="proof-card">
            <blockquote>"Haulage cut our dispatch time in half. We see every truck, every load, in real time."</blockquote>
            <div className="proof-author">
              <div className="proof-avatar">JK</div>
              <div><strong>James Keller</strong><span>Ops Director, NorthStar Freight</span></div>
            </div>
          </div>
          <div className="proof-card">
            <blockquote>"The intelligence layer saved us from three late deliveries last week alone."</blockquote>
            <div className="proof-author">
              <div className="proof-avatar">SR</div>
              <div><strong>Sarah Reed</strong><span>Fleet Manager, Apex Logistics</span></div>
            </div>
          </div>
          <div className="proof-card">
            <blockquote>"One dashboard, full clarity. We stopped guessing and started operating."</blockquote>
            <div className="proof-author">
              <div className="proof-avatar">MT</div>
              <div><strong>Marcus Torres</strong><span>CEO, Meridian Transport</span></div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section 
        className="closing-section" 
        id="company"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7 }}
      >
        <p className="eyebrow">The road ahead</p>
        <h2>Good freight<br/>feels <em>inevitable.</em></h2>
        <Link className="primary-cta" href="/login"><span className="cta-glow"></span>Build your network <span className="cta-arrow">→</span></Link>
      </motion.section>
      
      <footer className="site-footer">
        <Link className="brand" href="/">
          <span className="brand-mark"><i></i><i></i><i></i></span><span>haulage</span>
        </Link>
        <span>© 2026 Haulage Systems</span>
        <span>Freight, in motion.</span>
      </footer>
    </main>
    </>
  );
}
