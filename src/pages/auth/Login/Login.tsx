import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signIn, signInWithSocial } from '@/lib/auth';
import styles from './Login.module.css';

interface LocationState {
  from?: { pathname: string };
  message?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const state = location.state as LocationState;
  const from = state?.from?.pathname || '/dashboard';
  const message = state?.message;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signIn({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setError(null);
    try {
      await signInWithSocial(provider, 'homeowner');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign in');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.logo}>
          <Droplets className={styles.logoIcon} />
        </div>
        <h2 className={styles.title}>
          Sign in to your account
        </h2>
      </div>

      <div className={styles.formContainer}>
        <div className={styles.formWrapper}>
          {message && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800">{message}</p>
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
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
                autoComplete="current-password"
                required
                className={styles.input}
              />
            </div>

            {error && (
              <div className={styles.error}>
                <div className={styles.errorText}>{error}</div>
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign in
            </Button>
          </form>

          <div className={styles.divider}>
            <div className={styles.dividerLine}>
              <div className={styles.dividerBorder} />
            </div>
            <div className={styles.dividerText}>
              <span className={styles.dividerTextContent}>Or continue with</span>
            </div>
          </div>

          <div className={styles.socialButtons}>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('google')}
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
              onClick={() => handleSocialLogin('facebook')}
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

          <p className={styles.footer}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className={styles.footerLink}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}