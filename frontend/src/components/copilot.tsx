'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Cpu, Zap, FileSearch, Mail } from 'lucide-react';
import { aiApi, GraphStreamEvent } from '@/api/ai.api';
import styles from './copilot.module.css';

type CopilotMode = 'idle' | 'processing' | 'streaming' | 'result';

interface StreamLog {
  node: string;
  status: string;
  data?: any;
}

export function Copilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<CopilotMode>('idle');
  const [streamLogs, setStreamLogs] = useState<StreamLog[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        abortRef.current?.abort();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setMode('idle');
      setStreamLogs([]);
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  const handleRagSearch = async (searchQuery: string) => {
    setMode('processing');
    setError(null);
    try {
      const data = await aiApi.search(searchQuery, 5);
      setResult({ type: 'search', data });
      setMode('result');
    } catch (err: any) {
      setError(err.message || 'AI service unavailable');
      setMode('idle');
    }
  };

  const handleEmailIngest = async (emailText: string) => {
    setMode('processing');
    setError(null);
    try {
      const data = await aiApi.ingestEmail(emailText);
      setResult({ type: 'email', data });
      setMode('result');
    } catch (err: any) {
      setError(err.message || 'AI service unavailable');
      setMode('idle');
    }
  };

  const handleGraphStream = async (emailText: string) => {
    setMode('streaming');
    setStreamLogs([]);
    setError(null);

    abortRef.current = aiApi.streamGraph(
      emailText,
      undefined,
      (event: GraphStreamEvent) => {
        setStreamLogs((prev) => [...prev, event]);
      },
      () => {
        setMode('result');
      },
      (errMsg: string) => {
        setError(errMsg);
        setMode('idle');
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const q = query.toLowerCase();
    if (q.startsWith('/search ')) {
      handleRagSearch(query.slice(8));
    } else if (q.startsWith('/email ')) {
      handleEmailIngest(query.slice(7));
    } else if (q.startsWith('/graph ')) {
      handleGraphStream(query.slice(7));
    } else {
      // Default: RAG search
      handleRagSearch(query);
    }
  };

  const suggestions = [
    { icon: <FileSearch size={16} />, text: '/search penalty clause for late delivery', label: 'RAG Search' },
    { icon: <Mail size={16} />, text: '/email Pickup: Dallas TX, Drop: Seattle WA, 42000 lbs, rate $1200, pickup 10/01', label: 'Email Ingest' },
    { icon: <Zap size={16} />, text: '/graph New load from Houston to Denver, 38000 lbs, invoice $1450', label: 'AI Graph' },
  ];

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={() => { abortRef.current?.abort(); setIsOpen(false); }}>
      <div
        className={`${styles.palette} ${mode === 'streaming' ? styles.processing : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <Cpu className={styles.aiIcon} />
          <span>Haulage AI Copilot</span>
          <span className={styles.shortcutBadge}>ESC to close</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.inputForm}>
          <Search className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Type a command: /search, /email, /graph, or just ask..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={mode === 'streaming'}
          />
          {(mode === 'processing' || mode === 'streaming') && <div className={styles.loader}></div>}
        </form>

        {/* Error */}
        {error && (
          <div style={{ padding: '16px 20px', color: '#ef4444', fontSize: '0.9rem', background: 'rgba(239,68,68,0.05)' }}>
            ⚠ {error}
          </div>
        )}

        {/* Suggestions */}
        {mode === 'idle' && !query && !error && (
          <div className={styles.suggestions}>
            <div className={styles.suggestHeader}>AI COMMANDS</div>
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                className={styles.suggestBtn}
                onClick={() => {
                  setQuery(item.text);
                  inputRef.current?.focus();
                }}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.text}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--amber)', background: 'rgba(245,163,58,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Streaming Logs */}
        {mode === 'streaming' && (
          <div className={styles.processingState}>
            {streamLogs.map((log, idx) => (
              <p key={idx} className={styles.processLog} style={{ animationDelay: `${idx * 0.15}s` }}>
                <span style={{ color: log.status === 'error' ? '#ef4444' : 'var(--amber)', marginRight: '8px' }}>
                  {log.status === 'error' ? '✗' : '▸'}
                </span>
                [{log.node}] {log.status}
                {log.data?.message && ` — ${log.data.message}`}
              </p>
            ))}
          </div>
        )}

        {/* Processing */}
        {mode === 'processing' && (
          <div className={styles.processingState}>
            <p className={styles.processLog}>Connecting to AI service...</p>
            <p className={styles.processLog} style={{ animationDelay: '0.3s' }}>Querying Qdrant vector database...</p>
            <p className={styles.processLog} style={{ animationDelay: '0.6s' }}>Running hybrid BM25 + dense retrieval...</p>
          </div>
        )}

        {/* Results */}
        {mode === 'result' && result && (
          <div style={{ padding: '16px 20px', maxHeight: '300px', overflowY: 'auto' }}>
            {result.type === 'search' && result.data?.results && (
              <>
                <div style={{ fontSize: '0.75rem', color: 'var(--amber)', fontWeight: 600, marginBottom: '12px' }}>
                  RAG SEARCH — {result.data.results.length} results
                </div>
                {result.data.results.map((r: any, idx: number) => (
                  <div key={idx} style={{
                    padding: '10px 12px', marginBottom: '8px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)'
                  }}>
                    <div style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: 1.4 }}>{r.text}</div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                      <span>Source: {r.source}</span>
                      <span>Score: {(r.score * 100).toFixed(1)}%</span>
                      <span style={{ color: 'var(--amber)' }}>{r.clause_type}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
            {result.type === 'email' && result.data?.load && (
              <>
                <div style={{ fontSize: '0.75rem', color: 'var(--amber)', fontWeight: 600, marginBottom: '12px' }}>
                  PARSED LOAD FROM EMAIL
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.entries(result.data.load).map(([key, val]) => (
                    <div key={key} style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase' }}>{key.replace(/_/g, ' ')}</div>
                      <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px' }}>{String(val)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
