import React from 'react';
import { Link } from 'react-router-dom';
import { Droplets, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavItem } from '@/types/navigation';
import styles from './DesktopSidebar.module.css';

interface DesktopSidebarProps {
  navigation: NavItem[];
  currentPath: string;
  isCollapsed: boolean;
  onCollapse: () => void;
  onSignOut: () => void;
  isSigningOut: boolean;
}

export function DesktopSidebar({
  navigation,
  currentPath,
  isCollapsed,
  onCollapse,
  onSignOut,
  isSigningOut,
}: DesktopSidebarProps) {
  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded}`}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Droplets className={styles.logoIcon} />
          {!isCollapsed && <span className={styles.logoText}>CrystalClear</span>}
        </div>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li>
              <ul className="space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`${styles.navLink} ${
                        currentPath === item.href ? styles.navLinkActive : styles.navLinkInactive
                      }`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon
                        className={`${styles.navIcon} ${
                          currentPath === item.href ? styles.navIconActive : styles.navIconInactive
                        }`}
                      />
                      {!isCollapsed && <span className="ml-3">{item.name}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
        <div className={styles.footer}>
          <Button
            variant="ghost"
            className={`w-full ${isCollapsed ? 'justify-center' : 'justify-start'}`}
            onClick={onSignOut}
            isLoading={isSigningOut}
            title={isCollapsed ? 'Sign out' : undefined}
          >
            {!isCollapsed && <span className="ml-3">Sign out</span>}
          </Button>
        </div>
        <button
          onClick={onCollapse}
          className={styles.collapseButton}
        >
          {isCollapsed ? (
            <ChevronRight className={styles.collapseIcon} />
          ) : (
            <ChevronLeft className={styles.collapseIcon} />
          )}
        </button>
      </div>
    </div>
  );
}