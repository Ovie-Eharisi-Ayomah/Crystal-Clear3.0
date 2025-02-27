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
  const [quoteCount, setQuoteCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;
      
      try {
        console.log('Fetching counts for user:', user.id, 'type:', userType);
        
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
          .select(`
            *,
            quotes (*)
          `);
          
        console.log('All jobs data:', data ? data.length : 0);
        
        // Now apply the filter manually to debug
        let filteredJobCount = 0;
        let filteredQuoteCount = 0;
        
        if (data) {
          if (userType === 'homeowner') {
            const userJobs = data.filter(job => job.owner_id === user.id);
            filteredJobCount = userJobs.length;
            
            // Count jobs with quotes for this homeowner
            filteredQuoteCount = userJobs.filter(job => 
              job.quotes && job.quotes.length > 0
            ).length;
            
            console.log('Filtered homeowner jobs:', filteredJobCount);
            console.log('Jobs with quotes:', filteredQuoteCount);
          } else if (userType === 'cleaner') {
            filteredJobCount = data.filter(job => 
              job.status === 'new' || job.cleaner_id === user.id
            ).length;
            console.log('Filtered cleaner jobs:', filteredJobCount);
          }
        }
        
        if (error) {
          throw error;
        }
        
        console.log('DB count:', count, 'Filtered count:', filteredJobCount);
        // Use the manually filtered counts
        setJobCount(filteredJobCount);
        setQuoteCount(filteredQuoteCount);
      } catch (error) {
        console.error('Error fetching counts:', error);
        setJobCount(0);
        setQuoteCount(0);
      }
    };

    if (user?.id) {
      fetchCounts();
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
            
            <div className={styles.card}>
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <div className="flex-shrink-0">
                    <ClipboardList className={styles.icon} />
                  </div>
                  <div className={styles.cardBody}>
                    <dl>
                      <dt className={styles.cardLabel}>
                        Quotes Received
                      </dt>
                      <dd className={styles.cardValue}>
                        {quoteCount}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <div className="text-sm">
                  <button
                    onClick={() => navigate('/dashboard/quotes')}
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