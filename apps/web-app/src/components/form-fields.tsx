'use client';

import { forwardRef, InputHTMLAttributes, ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(({ label, error, id, className, ...props }, ref) => {
  const fieldId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-text-secondary">
        {label}
      </label>
      <input
        ref={ref}
        id={fieldId}
        className={clsx(
          'rounded-md border bg-surface px-3.5 py-2.5 text-text-primary outline-none transition-colors',
          'border-border focus:border-accent focus:ring-2 focus:ring-accent/20',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
TextField.displayName = 'TextField';

export function Button({
  className,
  variant = 'primary',
  isLoading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-md px-4 py-2.5 font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-accent text-white hover:opacity-90',
        variant === 'secondary' && 'border border-border bg-surface text-text-primary hover:bg-surface-2',
        className,
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? 'Un momento…' : children}
    </button>
  );
}
