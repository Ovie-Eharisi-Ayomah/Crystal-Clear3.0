import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import styles from './DashboardPage.module.css';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userType = user?.user_metadata?.user_type;
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    const fetchJobCount = async () => {
      if (!user) return;
      
      try {
        console.log('Fetching job count for user:', user.id, 'type:', userType);
        
        // First, get a count of all jobs to verify there are any
        const { count: totalCount, error: totalError } = await supabase
          .from('job_requests')
          .select('*', { count: 'exact', head: true });
          
        console.log('Total jobs in database:', totalCount);
        
        if (totalError) {
          console.error('Error counting all jobs:', totalError);
        }
        
        // Now try the filtered query
        const { data, count, error } = await supabase
          .from('job_requests')
          .select('*', { count: 'exact' });
          
        console.log('All jobs data:', data ? data.length : 0);
        
        // Log all the jobs to see what's available
        if (data) {
          console.log('Jobs:', data.map(job => ({
            id: job.id,
            owner_id: job.owner_id,
            status: job.status
          })));
        }
        
        // Now apply the filter manually to debug
        let filteredCount = 0;
        
        if (data) {
          if (userType === 'homeowner') {
            filteredCount = data.filter(job => job.owner_id === user.id).length;
            console.log('Filtered homeowner jobs:', filteredCount);
          } else if (userType === 'cleaner') {
            filteredCount = data.filter(job => 
              job.status === 'new' || job.cleaner_id === user.id
            ).length;
            console.log('Filtered cleaner jobs:', filteredCount);
          }
        }
        
        if (error) {
          throw error;
        }
        
        console.log('DB count:', count, 'Filtered count:', filteredCount);
        // Use the manually filtered count since it's more reliable
        setJobCount(filteredCount);
      } catch (error) {
        console.error('Error fetching job count:', error);
        setJobCount(0);
      }
    };

    if (user?.id) {
      fetchJobCount();
    }
  }, [user?.id, userType]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Welcome back, {user?.user_metadata?.full_name}!
      </h1>
      <div className="mt-6">
        {userType === 'homeowner' ? (
          <div className={styles.cardGrid}>
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
                        {jobCount}
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
          <div className={styles.cardGrid}>
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
                        {jobCount}
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