import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerUser } from '@/lib/auth';

const { signUp } = vi.hoisted(() => ({ signUp: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { auth: { signUp } } }));

beforeEach(() => {
  signUp.mockReset();
  signUp.mockResolvedValue({ data: {}, error: null });
});

describe.each(['member', 'coach'] as const)('privacy consent for %s registration', role => {
  const input = { name: 'Usuario Prueba', email: 'privacy-test@example.com', password: 'test-only-password', role };

  it('blocks signup without explicit acceptance', async () => {
    for (const privacyAccepted of [false, undefined, 'true', 1]) {
      const result = await registerUser({ ...input, privacyAccepted } as Parameters<typeof registerUser>[0]);
      expect(result.success).toBe(false);
    }
    expect(signUp).not.toHaveBeenCalled();
  });

  it('allows signup only after explicit acceptance', async () => {
    const result = await registerUser({ ...input, privacyAccepted: true });
    expect(result.success).toBe(true);
    expect(signUp).toHaveBeenCalledTimes(1);
    expect(signUp).toHaveBeenCalledWith(expect.objectContaining({ email: input.email, password: input.password }));
  });
});