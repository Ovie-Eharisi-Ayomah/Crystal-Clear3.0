import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavItem } from '@/types/navigation';
import styles from './MobileSidebar.module.css';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navigation: NavItem[];
  currentPath: string;
  onSignOut: () => void;
  isSigningOut: boolean;
}

export function MobileSidebar({
  isOpen,
  onClose,
  navigation,
  currentPath,
  onSignOut,
  isSigningOut,
}: MobileSidebarProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <div className={styles.closeButton}>
            <button
              type="button"
              className={styles.closeIcon}
              onClick={onClose}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className={styles.content}>
            <div className={styles.logo}>
              <Droplets className={styles.logoIcon} />
              <span className={styles.logoText}>CrystalClear</span>
            </div>
            <nav className={styles.nav}>
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${styles.navLink} ${
                    currentPath === item.href ? styles.navLinkActive : styles.navLinkInactive
                  }`}
                >
                  <item.icon
                    className={`${styles.navIcon} ${
                      currentPath === item.href ? styles.navIconActive : styles.navIconInactive
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className={styles.footer}>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={onSignOut}
              isLoading={isSigningOut}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}