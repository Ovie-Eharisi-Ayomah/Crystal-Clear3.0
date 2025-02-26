import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signUp, signInWithSocial, UserType } from '@/lib/auth';
import styles from './SignUp.module.css';

export function SignUpPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>('homeowner');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      await signUp({ email, password, fullName, userType });
      navigate('/complete-profile');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('user_already_exists') || err.message.includes('already registered')) {
          setError('An account with this email already exists. Please try logging in instead.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleSocialSignUp = async (provider: 'google' | 'facebook') => {
    setError(null);
    try {
      await signInWithSocial(provider, userType);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to sign up with social provider');
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Droplets className={styles.logoIcon} />
        </div>
        <h2 className={styles.title}>
          Create your account
        </h2>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.formWrapper}>
          <div className={styles.userTypeSection}>
            <label className={styles.userTypeLabel}>
              I am a...
            </label>
            <div className={styles.userTypeGrid}>
              <button
                type="button"
                onClick={() => setUserType('homeowner')}
                className={`${styles.userTypeButton} ${
                  userType === 'homeowner'
                    ? styles.userTypeButtonActive
                    : styles.userTypeButtonInactive
                }`}
              >
                Homeowner
              </button>
              <button
                type="button"
                onClick={() => setUserType('cleaner')}
                className={`${styles.userTypeButton} ${
                  userType === 'cleaner'
                    ? styles.userTypeButtonActive
                    : styles.userTypeButtonInactive
                }`}
              >
                Window Cleaner
              </button>
            </div>
          </div>

          <div className={styles.socialButtons}>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialSignUp('google')}
              className="w-full"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                alt="Google"
                className={styles.socialIcon}
              />
              Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialSignUp('facebook')}
              className="w-full"
            >
              <img
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/facebook.svg"
                alt="Facebook"
                className={styles.socialIcon}
              />
              Facebook
            </Button>
          </div>

          <div className={styles.divider}>
            <div className={styles.dividerLine}>
              <div className={styles.dividerBorder} />
            </div>
            <div className={styles.dividerText}>
              <span className={styles.dividerTextContent}>Or sign up with email</span>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="fullName" className={styles.label}>
                Full name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className={styles.input}
              />
              <p className={styles.helpText}>
                Must be at least 8 characters long
              </p>
            </div>

            {error && (
              <div className={styles.error}>
                <div className={styles.errorContent}>
                  <div className={styles.errorIcon}>
                    <svg className={styles.errorIconSvg} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className={styles.errorMessage}>
                    <div className={styles.errorText}>{error}</div>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign up
            </Button>

            <p className={styles.footer}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={styles.footerLink}
              >
                Log in
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}