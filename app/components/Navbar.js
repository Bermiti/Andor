'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useLanguage, useTranslations } from '../context/LanguageContext';
import styles from './Navbar.module.css';
import LoginModal from './LoginModal';
import AndorLogo from './AndorLogo';

const languages = [
  { code: 'pt', label: 'Português', flag: '🇵🇹', display: 'PT' },
  { code: 'pt-BR', label: 'Português (BR)', flag: '🇧🇷', display: 'BR' },
  { code: 'en', label: 'English', flag: '🇬🇧', display: 'EN' },
  { code: 'es', label: 'Español', flag: '🇪🇸', display: 'ES' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', display: 'FR' }
];

export default function Navbar({ onOpenPreferences }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLanguage();
  const t = useTranslations('nav');
  
  const [scrolled, setScrolled] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [authErrorCode, setAuthErrorCode] = useState(null);
  
  const isMyTrips = pathname === '/my-trips';
  const forceDarkText = isMyTrips && !scrolled;
  
  const getLinkClass = (href) => {
    const isActive = href === '/'
      ? pathname === '/'
      : pathname === href || pathname?.startsWith(`${href}/`);
    const baseClass = forceDarkText ? `${styles.link} ${styles.linkDark}` : styles.link;
    return `${baseClass} ${isActive ? styles.linkActive : ''}`;
  };
  
  const langDropdownRef = useRef(null);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const callbackError = currentUrl.searchParams.get('authError');
    if (callbackError) {
      setAuthErrorCode(callbackError);
      setIsLoginOpen(true);
      currentUrl.searchParams.delete('authError');
      window.history.replaceState(
        window.history.state,
        '',
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
      );
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleOpenAuth = () => {
      setIsLoginOpen(true);
    };
    window.addEventListener('open-auth-modal', handleOpenAuth);

    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('open-auth-modal', handleOpenAuth);
      document.removeEventListener('mousedown', handleClickOutside);
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
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setIsMobileMenuOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  return (
    <>
      <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.inner}>
          {/* Logo "✦ Andor" */}
          <a href="/" className={styles.logo}>
            <span className={styles.logoIcon}>
              <AndorLogo size={32} />
            </span>
            <span>Andor</span>
          </a>

          {isMobileMenuOpen && (
            <button
              type="button"
              className={styles.mobileScrim}
              aria-label="Fechar menu"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Navigation Links */}
          <div
            id="primary-navigation"
            className={`${styles.links} ${isMobileMenuOpen ? styles.mobileOpen : ''}`}
          >
            <a href="/features" className={getLinkClass('/features')} onClick={() => setIsMobileMenuOpen(false)}>
              {t('features')}
            </a>
            <a href="/destinations" className={getLinkClass('/destinations')} onClick={() => setIsMobileMenuOpen(false)}>
              {t('destinations')}
            </a>
            <a href="/my-trips" className={getLinkClass('/my-trips')} onClick={() => setIsMobileMenuOpen(false)}>
              {t('myJourney')}
            </a>
            {onOpenPreferences && (
              <button
                type="button"
                className={styles.link}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenPreferences();
                }}
              >
                Preferências
              </button>
            )}
            <a href="/pricing" className={getLinkClass('/pricing')} onClick={() => setIsMobileMenuOpen(false)}>
              {t('pricing')}
            </a>
            
            {/* Mobile-only sections for Language */}
            <div className={styles.mobileDivider}></div>
            <div className={styles.mobileSectionTitle}>Idioma</div>
            <div className={styles.mobileLangList}>
              {languages.map((lang) => (
                <button 
                  key={lang.code}
                  className={`${styles.mobileLangItem} ${locale === lang.code ? styles.mobileLangActive : ''}`}
                  onClick={() => {
                    setLocale(lang.code);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <span className={styles.langFlag}>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
            
            {/* Mobile-only actions */}
            {/* Language Selector Dropdown */}
            <div className={styles.langDropdownWrapper} ref={langDropdownRef}>
              <button 
                className={styles.langPill} 
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                aria-label="Change language"
              >
                <span className={styles.langFlag}>{currentLanguage.flag}</span>
                <span className={styles.langCode}>{currentLanguage.display}</span>
                <svg className={`${styles.langArrow} ${isLangDropdownOpen ? styles.langArrowOpen : ''}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {isLangDropdownOpen && (
                <div className={styles.langDropdown}>
                  {languages.map((lang) => (
                    <button 
                      key={lang.code}
                      className={`${styles.langDropdownItem} ${locale === lang.code ? styles.langActiveItem : ''}`}
                      onClick={() => {
                        setLocale(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                    >
                      <span className={styles.langFlag}>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className={styles.userArea}>
                <a href="/profile" className={styles.dashboardBtn}>
                  Perfil
                </a>
                <div 
                  className={styles.userAvatar} 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setShowUserMenu(!showUserMenu);
                    }
                  }}
                  aria-label="User menu"
                  aria-expanded={showUserMenu}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                {showUserMenu && (
                  <div className={styles.userMenu}>
                    <div className={styles.userMenuHeader}>
                      <div className={styles.userMenuName}>{user.name}</div>
                      <div className={styles.userMenuEmail}>{user.email}</div>
                    </div>
                    <div className={styles.userMenuDivider}></div>
                    <a href="/profile" className={styles.userMenuItem}>👤 Perfil</a>
                    <a href="/dashboard" className={styles.userMenuItem}>🗺️ Dashboard</a>
                    <div className={styles.userMenuDivider}></div>
                    <button className={styles.userMenuLogout} onClick={handleLogout}>Sair</button>
                  </div>
                )}
              </div>
            ) : (
              <button className={styles.loginBtn} onClick={() => setIsLoginOpen(true)}>{t('login')}</button>
            )}
          </div>

          <button
            type="button"
            className={`${styles.mobileToggle} ${isMobileMenuOpen ? styles.toggleActive : ''}`}
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="primary-navigation"
            onClick={toggleMobileMenu}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>
      
      <LoginModal
        isOpen={isLoginOpen}
        initialErrorCode={authErrorCode}
        redirectPath={pathname?.startsWith('/invitations/') ? pathname : '/my-trips'}
        onClose={() => {
          setIsLoginOpen(false);
          setAuthErrorCode(null);
        }}
      />
    </>
  );
}
