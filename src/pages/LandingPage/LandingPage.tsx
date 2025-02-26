import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import styles from './LandingPage.module.css';

export function LandingPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.navWrapper}>
            <div className="flex">
              <div className={styles.logo}>
                <Droplets className={styles.logoIcon} />
                <span className={styles.logoText}>CrystalClear</span>
              </div>
            </div>
            <div className={styles.navButtons}>
              <Button variant="ghost" onClick={() => window.location.href = '/login'}>
                Log in
              </Button>
              <Button onClick={() => window.location.href = '/signup'}>
                Sign up
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className={styles.mainContent}>
          <div className={styles.contentWrapper}>
            <div className={styles.textContent}>
              <h1 className={styles.title}>
                Professional Window Cleaning,
                <br />
                Made Simple
              </h1>
              <p className={styles.description}>
                Connect with trusted window cleaners in your area.
                Book appointments, manage services, and enjoy crystal clear views.
              </p>
              <div className={styles.buttons}>
                <Button size="lg" onClick={() => window.location.href = '/signup'}>
                  Get Started
                </Button>
                <Button variant="outline" size="lg">
                  Learn more
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}