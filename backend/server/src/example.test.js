import { describe, expect, it } from 'vitest';

describe('Backend Example Test', () => {
  it('should pass a basic sanity check', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle string concatenation', () => {
    expect('Mahbub' + ' Shop').toBe('Mahbub Shop');
  });
});
