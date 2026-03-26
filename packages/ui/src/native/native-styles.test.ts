import { describe, expect, it } from 'vitest';
import { getNativeButtonStyles } from './buttonStyles';
import { getNativeInputStyles } from './inputStyles';

describe('native style helpers', () => {
  it('returns primary button styles', () => {
    const styles = getNativeButtonStyles('primary', 'md');

    expect(styles.container.backgroundColor).toBe('#1b80f2');
    expect(styles.text.color).toBe('#ffffff');
    expect(styles.text.fontSize).toBe(14);
  });

  it('returns ghost button styles', () => {
    const styles = getNativeButtonStyles('ghost', 'sm');

    expect(styles.container.backgroundColor).toBe('transparent');
    expect(styles.text.fontSize).toBe(13);
  });

  it('returns input styles', () => {
    const styles = getNativeInputStyles();

    expect(styles.container.borderWidth).toBe(1);
    expect(styles.input.fontSize).toBe(14);
    expect(styles.error.color).toBe('#c0392b');
  });
});
