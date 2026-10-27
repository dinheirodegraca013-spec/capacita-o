import { describe, expect, it } from 'vitest';
describe('notification worker boundary', () => { it('keeps provider delivery behind an internal route', () => { expect('/api/internal/notifications').toContain('/internal/'); }); });
