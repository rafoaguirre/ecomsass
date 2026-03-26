import { describe, expect, it } from 'vitest';
import { getButtonClassName } from './buttonStyles';

describe('getButtonClassName', () => {
  it('should include size and variant classes', () => {
    const result = getButtonClassName('primary', 'md');

    expect(result).toContain('ui-btn');
    expect(result).toContain('ui-btn-primary');
    expect(result).toContain('ui-btn-md');
  });
});
