import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import { cx } from '../core';
import type { BaseComponentProps } from '../core';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, BaseComponentProps {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, testId, id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? `ui-input-${generatedId.replace(/:/g, '')}`;

  return (
    <div className="ui-input-wrap" data-testid={testId ? `${testId}-wrap` : undefined}>
      {label ? (
        <label className="ui-input-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cx('ui-input', error ? 'ui-input-error' : '', className)}
        data-testid={testId}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />
      {error ? <p className="ui-input-feedback ui-input-feedback-error">{error}</p> : null}
      {!error && hint ? <p className="ui-input-feedback">{hint}</p> : null}
    </div>
  );
}
