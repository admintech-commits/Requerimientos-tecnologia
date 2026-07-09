import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  loading = false,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn--${variant}`}
      disabled={loading || props.disabled}
      aria-busy={loading}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}
