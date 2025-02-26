import { Droplets } from 'lucide-react';
import styles from './LoadingScreen.module.css';

export function LoadingScreen() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Droplets className={styles.icon} />
        <h2 className={styles.text}>Loading...</h2>
      </div>
    </div>
  );
}