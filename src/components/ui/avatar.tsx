import React from 'react';
import { cn } from '@/lib/utils';
import styles from './avatar.module.css';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  src?: string;
  alt?: string;
}

export function Avatar({
  className,
  size = 'md',
  src,
  alt,
  ...props
}: AvatarProps) {
  return (
    <div
      className={cn(
        styles.base,
        styles[size],
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={styles.image}
        />
      ) : (
        <span className={styles.initials}>
          {alt?.split(' ').map(word => word[0]).join('').toUpperCase()}
        </span>
      )}
    </div>
  );
}