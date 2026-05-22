'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CommandCenter.module.css';

export default function CommandCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const router = useRouter();

  const commands = [
    { id: 'plan', title: 'New Trip', icon: '✈️', description: 'Generate a new AI itinerary', action: () => router.push('/#planner') },
    { id: 'dash', title: 'Dashboard', icon: '🗺️', description: 'View your saved trips and stats', action: () => router.push('/dashboard') },
    { id: 'community', title: 'Explore Community', icon: '🌍', description: 'Discover trips from other travelers', action: () => router.push('/#community') },
    { id: 'expenses', title: 'Split Expenses', icon: '💰', description: 'Manage group costs', action: () => router.push('/dashboard#expenses') },
    { id: 'buddies', title: 'Find Partners', icon: '🤝', description: 'Connect with other travelers', action: () => router.push('/dashboard#buddies') },
    { id: 'profile', title: 'My Profile', icon: '👤', description: 'Edit your traveler profile', action: () => router.push('/dashboard#profile') },
  ];

  const filtered = query 
    ? commands.filter(c => 
        c.title.toLowerCase().includes(query.toLowerCase()) || 
        c.description.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

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
        <div className={styles.searchBar}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2"/>
            <path d="M14 14L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands, trips, or destinations..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.input}
          />
          <div className={styles.kbh}>ESC to close</div>
        </div>

        <div className={styles.results}>
          {filtered.length === 0 ? (
            <div className={styles.noResults}>No results found for "{query}"</div>
          ) : (
            filtered.map((cmd, i) => (
              <div
                key={cmd.id}
                className={`${styles.result} ${i === selectedIndex ? styles.selected : ''}`}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => {
                  cmd.action();
                  setIsOpen(false);
                }}
              >
                <div className={styles.icon}>{cmd.icon}</div>
                <div className={styles.info}>
                  <div className={styles.title}>{cmd.title}</div>
                  <div className={styles.description}>{cmd.description}</div>
                </div>
                <div className={styles.enter}>↵</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
