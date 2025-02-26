import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import styles from './Header.module.css';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  userName: string;
}

export function Header({ onOpenMobileMenu, userName }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.header}>
      <button
        type="button"
        className={styles.menuButton}
        onClick={onOpenMobileMenu}
      >
        <Menu className={styles.menuIcon} />
      </button>

      <div className={styles.content} />
      <div className={styles.userSection}>
        <button
          onClick={() => navigate('/dashboard/settings')}
          className={styles.userButton}
        >
          <Avatar
            size="sm"
            alt={userName}
          />
          <span className={styles.userName}>{userName}</span>
        </button>
      </div>
    </div>
  );
}