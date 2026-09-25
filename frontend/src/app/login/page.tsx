'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

export default function Login() {
  const router = useRouter();
  const { login, signup, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await signup({ name, companyName: company, email, password });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="hero-stage" aria-label="Haulage transport animation">
        <div className="hero-orbs" aria-hidden="true">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
        </div>
        <div className="hero-copy">
          <Link className="brand" href="/" aria-label="Haulage home">
            <span className="brand-mark"><i></i><i></i><i></i></span>
            <span>haulage</span>
          </Link>
          <div className="hero-message">
            <p className="eyebrow"><span className="eyebrow-dot"></span> Freight, in motion</p>
            <h1>Move what<br/><em>matters.</em></h1>
            <p>One connected command center for every mile, load, and delivery.</p>
          </div>
          <div className="hero-caption">
            <span className="route-code">ROUTE / 01</span>
            <span className="caption-line"></span>
            <span>EUROPEAN FREIGHT NETWORK</span>
          </div>
        </div>
        
        {/* We can use the static scene fallback here to keep it simple and authentic to the original's static state while on the login page */}
        <div className="scene-fallback" style={{ display: 'block' }} aria-hidden="true">
          <div className="poster-sun"></div>
          <div className="poster-road"></div>
          <div className="poster-truck">
            <span className="poster-cab"></span>
            <span className="poster-trailer"><b>haulage</b></span>
          </div>
        </div>
        <div className="hero-grain"></div>
      </section>

      <section className="auth-side">
        <div className="auth-ambient" aria-hidden="true"></div>
        <div className="auth-topline">
          <span>HAULAGE / CONTROL TOWER</span>
          <span className="secure-state"><i></i> Secure access</span>
        </div>
        
        <div className={`auth-card ${!isLogin ? 'is-signup' : ''}`}>
          <div className="auth-heading">
            <p className="panel-kicker">Welcome aboard</p>
            <h2>{isLogin ? 'Log in to Haulage' : 'Create your account'}</h2>
            <p>{isLogin ? 'Your network is ready when you are.' : 'Join the freight operating system.'}</p>
          </div>
          
          <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
            <button 
              className={`auth-tab ${isLogin ? 'active' : ''}`} 
              type="button" 
              onClick={() => {setIsLogin(true); setError('');}}
            >
              Log in
            </button>
            <button 
              className={`auth-tab ${!isLogin ? 'active' : ''}`} 
              type="button" 
              onClick={() => {setIsLogin(false); setError('');}}
            >
              Sign up
            </button>
            <span className="tab-indicator" style={{ transform: isLogin ? 'translateX(0)' : 'translateX(69px)' }}></span>
          </div>

          <form id="auth-form" noValidate onSubmit={handleSubmit}>
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="field-group">
                    <label htmlFor="full-name">Full name</label>
                    <div className="input-wrap">
                      <svg className="field-icon" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M3.5 17.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                      <input id="full-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Alex Morgan" />
                    </div>
                  </div>
                  <div className="field-group">
                    <label htmlFor="company">Company name</label>
                    <div className="input-wrap">
                      <svg className="field-icon" viewBox="0 0 20 20" fill="none">
                        <rect x="3" y="6" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M7 6V4.5A2.5 2.5 0 0 1 9.5 2h1A2.5 2.5 0 0 1 13 4.5V6" stroke="currentColor" strokeWidth="1.3"/>
                      </svg>
                      <input id="company" type="text" value={company} onChange={e => setCompany(e.target.value)} required placeholder="Northstar Freight" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="field-group">
              <label htmlFor="email">Work email</label>
              <div className="input-wrap">
                <svg className="field-icon" viewBox="0 0 20 20" fill="none">
                  <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M2 6l8 5 8-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" />
              </div>
            </div>

            <div className="field-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                {isLogin && <a className="forgot-link" href="#forgot">Forgot password?</a>}
              </div>
              <div className="input-wrap">
                <svg className="field-icon" viewBox="0 0 20 20" fill="none">
                  <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.3"/>
                  <circle cx="10" cy="13.5" r="1.2" fill="currentColor"/>
                </svg>
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter your password" />
              </div>
            </div>

            <button className={`submit-button ${loading ? 'is-loading' : ''}`} type="submit" disabled={loading}>
              <span className="submit-shine"></span>
              <span className="submit-label">{isLogin ? 'Enter control tower' : 'Create account'}</span>
              <span className="submit-loader"><i></i><i></i><i></i></span>
              <span className="submit-arrow">&#8594;</span>
            </button>
            {error && <p className="form-message" role="status" style={{ color: '#ef8e78' }}>{error}</p>}
          </form>

          <p className="auth-switch">
            <span>{isLogin ? 'New to Haulage?' : 'Already have an account?'}</span> 
            <button type="button" onClick={() => {setIsLogin(!isLogin); setError('');}}>
              {isLogin ? 'Create an account' : 'Log in'} <span>&rarr;</span>
            </button>
          </p>
        </div>

        <div className="auth-footer">
          <span>© 2026 Haulage Systems</span>
          <span>Privacy <b>·</b> Support</span>
        </div>
      </section>
    </main>
  );
}
