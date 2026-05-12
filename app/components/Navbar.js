'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';
import LoginModal from './LoginModal';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    const handleOpenAuth = () => {
      setIsLoginOpen(true);
    };
    window.addEventListener('open-auth-modal', handleOpenAuth);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-auth-modal', handleOpenAuth);
    };
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const openLogin = () => {
    setIsLoginOpen(true);
    setIsMobileMenuOpen(false); // close mobile menu if open
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>
          <a href="/" className={styles.logo}>
            <span className={styles.logoIcon}>
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 4L8 32H14L20 18L26 32H32L20 4Z" fill="#1E6FD9"/>
                <path d="M12 28C12 28 16 24 20 24C24 24 28 28 28 28" stroke="#0A1628" strokeWidth="2" strokeLinecap="round"/>
                <path d="M20 4V18" stroke="#D4A853" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 34C10 34 15 31 20 31C25 31 30 34 30 34" stroke="#1E6FD9" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </span>
            Andor
          </a>

          <div className={`${styles.links} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
            <a href="/#features" className={styles.link} onClick={() => setIsMobileMenuOpen(false)}>Features</a>
            <a href="/#planner" className={styles.link} onClick={() => setIsMobileMenuOpen(false)}>Plan a Trip</a>
            <a href="/#explore" className={styles.link} onClick={() => setIsMobileMenuOpen(false)}>Explore</a>
            <a href="/#community" className={styles.link} onClick={() => setIsMobileMenuOpen(false)}>Community</a>
            <a href="/#pricing" className={styles.link} onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
            {user && (
              <a href="/dashboard" className={`${styles.link} ${styles.linkHighlight}`} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</a>
            )}
            
            {/* Mobile-only actions */}
            <div className={styles.mobileActions}>
              {user ? (
                <>
                  <a href="/dashboard" className={styles.ctaBtnMobile} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</a>
                  <button className={styles.loginBtnMobile} onClick={handleLogout}>Sair</button>
                </>
              ) : (
                <>
                  <button className={styles.loginBtnMobile} onClick={openLogin}>Log in</button>
                  <button className={styles.ctaBtnMobile} onClick={openLogin}>Get Started</button>
                </>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            {user ? (
              <div className={styles.userArea}>
                <a href="/dashboard" className={styles.dashboardBtn}>
                  Dashboard
                </a>
                <div className={styles.userAvatar} onClick={() => setShowUserMenu(!showUserMenu)}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                {showUserMenu && (
                  <div className={styles.userMenu}>
                    <div className={styles.userMenuHeader}>
                      <div className={styles.userMenuName}>{user.name}</div>
                      <div className={styles.userMenuEmail}>{user.email}</div>
                    </div>
                    <div className={styles.userMenuDivider}></div>
                    <a href="/dashboard" className={styles.userMenuItem}>🗺️ Dashboard</a>
                    <a href="/dashboard#trips" className={styles.userMenuItem}>✈️ As minhas viagens</a>
                    <a href="/dashboard#expenses" className={styles.userMenuItem}>💰 Despesas</a>
                    <div className={styles.userMenuDivider}></div>
                    <button className={styles.userMenuLogout} onClick={handleLogout}>Sair</button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className={styles.loginBtn} onClick={() => setIsLoginOpen(true)}>Log in</button>
                <button className={styles.ctaBtn} onClick={() => setIsLoginOpen(true)}>Get Started</button>
              </>
            )}
            <button 
              className={`${styles.mobileToggle} ${isMobileMenuOpen ? styles.toggleActive : ''}`} 
              aria-label="Menu"
              onClick={toggleMobileMenu}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>
      
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  );
}
