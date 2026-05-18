'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CommandCenter.module.css';

// Utility to create icons
const Icon = ({ name }) => {
  switch(name) {
    case 'plan': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 22l10-4 10 4L12 2z"/></svg>;
    case 'dash': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 9h18M9 21V9"/></svg>;
    case 'community': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
    case 'expenses': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case 'buddies': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'profile': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
    case 'search': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;
    case 'ai': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/><circle cx="12" cy="12" r="4"/></svg>;
    case 'terminal': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>;
    default: return null;
  }
};

export default function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const router = useRouter();

  const commands = [
    { id: 'plan', title: 'Initialize New Mission', icon: 'plan', description: 'Deploy an autonomous AI itinerary', action: () => router.push('/#planner') },
    { id: 'dash', title: 'Access Dashboard', icon: 'dash', description: 'View encrypted trip logs and stats', action: () => router.push('/dashboard') },
    { id: 'community', title: 'Global Feed', icon: 'community', description: 'Intercept traveler frequencies', action: () => router.push('/#community') },
    { id: 'expenses', title: 'Financial Splitter', icon: 'expenses', description: 'Allocate mission resources', action: () => router.push('/dashboard#expenses') },
    { id: 'buddies', title: 'Connect Agents', icon: 'buddies', description: 'Find partners for the next drop', action: () => router.push('/dashboard#buddies') },
    { id: 'profile', title: 'Agent Profile', icon: 'profile', description: 'Configure identity protocols', action: () => router.push('/dashboard#profile') },
  ];

  let filtered = query 
    ? commands.filter(c => 
        c.title.toLowerCase().includes(query.toLowerCase()) || 
        c.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  if (query && filtered.length === 0) {
    filtered = [
      { id: 'ai-prompt', title: `Ask Orchestrator: "${query}"`, icon: 'ai', description: 'Engage AI assistant', action: () => router.push(`/#assistant`) },
      { id: 'dest', title: `Scan Destination: ${query}`, icon: 'search', description: 'Generate recon report', action: () => router.push(`/#planner`) }
    ];
  } else if (query) {
    filtered = [
      ...filtered,
      { id: 'ai-prompt', title: `Ask Orchestrator: "${query}"`, icon: 'ai', description: 'Engage AI assistant', action: () => router.push(`/#assistant`) }
    ];
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.terminalHeader}>
          <div className={styles.terminalDots}>
            <span></span><span></span><span></span>
          </div>
          <div className={styles.terminalTitle}>ANDOR.SYS // COMMAND.CENTER</div>
        </div>
        <div className={styles.searchBar}>
          <div className={styles.promptArrow}><Icon name="terminal" /></div>
          <input
            ref={inputRef}
            type="text"
            placeholder="ENTER COMMAND OR TARGET..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.input}
            spellCheck="false"
          />
          <div className={styles.kbh}>ESC</div>
        </div>

        <div className={styles.results}>
          {filtered.map((cmd, i) => (
            <div
              key={cmd.id}
              className={`${styles.result} ${i === selectedIndex ? styles.selected : ''}`}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => {
                cmd.action();
                setIsOpen(false);
              }}
            >
              <div className={styles.icon}><Icon name={cmd.icon} /></div>
              <div className={styles.info}>
                <div className={styles.title}>{cmd.title}</div>
                <div className={styles.description}>{cmd.description}</div>
              </div>
              <div className={styles.enter}>↵</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
