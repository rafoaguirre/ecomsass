import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button, Card, Input, Modal } from './index';

describe('web components', () => {
  it('should render Button', () => {
    const html = renderToString(<Button variant="secondary">Buy</Button>);
    expect(html).toContain('ui-btn-secondary');
    expect(html).toContain('Buy');
  });

  it('should render Card with header', () => {
    const html = renderToString(
      <Card title="Featured" subtitle="Top picks">
        Content
      </Card>
    );

    expect(html).toContain('ui-card-title');
    expect(html).toContain('Featured');
  });

  it('should render Input with label', () => {
    const html = renderToString(<Input label="Email" placeholder="a@b.com" />);
    expect(html).toContain('ui-input-label');
    expect(html).toContain('Email');
  });

  it('should not render closed Modal', () => {
    const html = renderToString(
      <Modal open={false} title="X" onClose={() => {}}>
        Body
      </Modal>
    );

    expect(html).toBe('');
  });

  it('should render open Modal with overlay and actions', () => {
    const html = renderToString(
      <Modal open title="Confirm" onClose={() => {}} onConfirm={() => {}}>
        Are you sure?
      </Modal>
    );

    expect(html).toContain('ui-modal-overlay');
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Confirm');
    expect(html).toContain('Are you sure?');
    expect(html).toContain('Cancel');
  });
});
