'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Navbar.module.css';
import LoginModal from './LoginModal';
import AndorLogo from './AndorLogo';

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

  const handleLinkClick = (e, targetId) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    const element = document.getElementById(targetId);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update hash without jump
      window.history.pushState(null, null, `#${targetId}`);
    } else if (window.location.pathname !== '/') {
      window.location.href = `/#${targetId}`;
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const openLogin = () => {
    setIsLoginOpen(true);
    setIsMobileMenuOpen(false);
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
              <AndorLogo size={36} />
            </span>
            Andor
          </a>

          <div className={`${styles.links} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}>
            <a href="/#features" className={styles.link} onClick={(e) => handleLinkClick(e, 'features')}>Features</a>
            <a href="/#planner" className={styles.link} onClick={(e) => handleLinkClick(e, 'planner')}>Plan a Trip</a>
            <a href="/#explore" className={styles.link} onClick={(e) => handleLinkClick(e, 'explore')}>Explore</a>
            <a href="/community" className={styles.link} onClick={() => setIsMobileMenuOpen(false)}>Community</a>
            <a href="/#pricing" className={styles.link} onClick={(e) => handleLinkClick(e, 'pricing')}>Pricing</a>
            <a href="/my-trips" className={`${styles.link} ${styles.linkHighlight}`} onClick={() => setIsMobileMenuOpen(false)}>
              Explorer Hub
              <span className={styles.liveBadge}>LIVE</span>
            </a>
            
            {/* Mobile-only menu items when open */}
            {isMobileMenuOpen && (
              <div className={styles.mobileActions}>
                {user ? (
                  <>
                    <a href="/my-trips" className={styles.ctaBtnMobile} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</a>
                    <button className={styles.loginBtnMobile} onClick={handleLogout}>Log out</button>
                  </>
                ) : (
                  <>
                    <button className={styles.loginBtnMobile} onClick={openLogin}>Log in</button>
                    <button className={styles.ctaBtnMobile} onClick={openLogin}>Get Started</button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className={styles.actions}>
            {user ? (
              <div className={styles.userArea}>
                <a href="/my-trips" className={styles.dashboardBtn}>
                  Hub
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
                    <a href="/my-trips" className={styles.userMenuItem}>🗺️ Hub</a>
                    <a href="/my-trips#trips" className={styles.userMenuItem}>✈️ My Trips</a>
                    <a href="/my-trips#expenses" className={styles.userMenuItem}>💰 Expenses</a>
                    <div className={styles.userMenuDivider}></div>
                    <button className={styles.userMenuLogout} onClick={handleLogout}>Log out</button>
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
