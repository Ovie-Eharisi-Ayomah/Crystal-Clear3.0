import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Home, MessageSquare, Settings, Shield, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/auth';
import { NavItem, UserType } from '@/types/navigation';
import { MobileSidebar } from '../MobileSidebar/MobileSidebar';
import { DesktopSidebar } from '../DesktopSidebar/DesktopSidebar';
import { Header } from '../Header/Header';
import styles from './DashboardLayout.module.css';

const getNavigation = (userType: UserType): NavItem[] => {
  const homeownerNavigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Properties', href: '/dashboard/properties', icon: Home },
    { name: 'Cleaning Requests', href: '/dashboard/jobs', icon: ClipboardList },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Shield },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const cleanerNavigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Jobs', href: '/dashboard/jobs', icon: ClipboardList },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
    { name: 'Sessions', href: '/dashboard/sessions', icon: Shield },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return userType === 'homeowner' ? homeownerNavigation : cleanerNavigation;
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebarCollapsed');
    return stored ? JSON.parse(stored) : false;
  });
  const [isSigningOut, setIsSigningOut] = useState(false);

  const userType = (user?.user_metadata?.user_type || 'homeowner') as UserType;
  const navigation = getNavigation(userType);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  return (
    <div>
      <MobileSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigation={navigation}
        currentPath={location.pathname}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />

      <DesktopSidebar
        navigation={navigation}
        currentPath={location.pathname}
        isCollapsed={isCollapsed}
        onCollapse={() => setIsCollapsed(!isCollapsed)}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />

      <div className={`${styles.mainContent} ${isCollapsed ? styles.mainContentCollapsed : styles.mainContentExpanded}`}>
        <Header
          onOpenMobileMenu={() => setSidebarOpen(true)}
          userName={user?.user_metadata?.full_name}
        />

        <main className={styles.contentWrapper}>
          <div className={styles.contentContainer}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}