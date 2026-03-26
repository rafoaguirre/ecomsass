import type { ReactNode } from 'react';
import { cx } from '../core';
import type { BaseComponentProps } from '../core';

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function Card({ title, subtitle, children, action, className, testId }: CardProps) {
  return (
    <section className={cx('ui-card', className)} data-testid={testId}>
      {title || subtitle || action ? (
        <header className="ui-card-header">
          <div>
            {title ? <h3 className="ui-card-title">{title}</h3> : null}
            {subtitle ? <p className="ui-card-subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="ui-card-action">{action}</div> : null}
        </header>
      ) : null}
      <div className="ui-card-content">{children}</div>
    </section>
  );
}
