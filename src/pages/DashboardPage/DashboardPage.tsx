import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userType = user?.user_metadata?.user_type;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Welcome back, {user?.user_metadata?.full_name}!
      </h1>
      <div className="mt-6">
        {userType === 'homeowner' ? (
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <div className="flex-shrink-0">
                    <ClipboardList className={styles.icon} />
                  </div>
                  <div className={styles.cardBody}>
                    <dl>
                      <dt className={styles.cardLabel}>
                        Cleaning Requests
                      </dt>
                      <dd className={styles.cardValue}>
                        0
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <div className="text-sm">
                  <button
                    onClick={() => navigate('/dashboard/jobs')}
                    className={styles.footerLink}
                  >
                    View all
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <div className="flex-shrink-0">
                    <ClipboardList className={styles.icon} />
                  </div>
                  <div className={styles.cardBody}>
                    <dl>
                      <dt className={styles.cardLabel}>
                        Available Jobs
                      </dt>
                      <dd className={styles.cardValue}>
                        0
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <div className="text-sm">
                  <button
                    onClick={() => navigate('/dashboard/jobs')}
                    className={styles.footerLink}
                  >
                    View all
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}