import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ParseSlugPipe } from './parse-slug.pipe';

describe('ParseSlugPipe', () => {
  const pipe = new ParseSlugPipe();

  it('accepts a valid slug', () => {
    expect(pipe.transform('demo-store')).toBe('demo-store');
  });

  it('throws for invalid slug', () => {
    expect(() => pipe.transform('Invalid Slug')).toThrow(BadRequestException);
  });
});
