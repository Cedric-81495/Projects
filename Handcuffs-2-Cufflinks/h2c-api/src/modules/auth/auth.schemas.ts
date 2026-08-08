import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

/**
 * Password policy.
 *
 * Length is the requirement that actually matters, so the floor is 12 rather
 * than the usual 8 with character-class rules. A single uppercase-and-symbol
 * rule mostly produces "Password1!", which is weaker than a long passphrase.
 */
export const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters — a short phrase works well.')
  .max(200, 'That password is too long.');

export const createUserSchema = z.object({
  fullName: z.string().min(2, 'Enter a full name.').max(120),
  email: z.string().email('Enter a valid email address.'),
  password: passwordSchema,
  role: z.enum(['super-admin', 'admin']).default('admin'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: passwordSchema,
});

/* ------------------------------------------------------------------ */
/* Password reset and verification                                     */
/* ------------------------------------------------------------------ */

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20, 'That reset link is not valid.').max(200),
  newPassword: passwordSchema,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(20, 'That confirmation link is not valid.').max(200),
});

/* ------------------------------------------------------------------ */
/* Multi-factor                                                        */
/* ------------------------------------------------------------------ */

/**
 * Accepts a six-digit TOTP code or a recovery code in `XXXXX-XXXXX` form.
 *
 * Deliberately one field rather than two. Someone locked out of their phone is
 * already having a bad day and should not also have to notice which box the
 * paper code goes in — the server can tell the two apart by shape.
 */
export const mfaCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(6, 'Enter the code from your app, or one of your recovery codes.')
    .max(20),
});

export const mfaChallengeSchema = mfaCodeSchema.extend({
  mfaToken: z.string().min(20, 'That verification step timed out. Sign in again.'),
});

export const mfaDisableSchema = mfaCodeSchema.extend({
  password: z.string().min(1, 'Enter your password to confirm.'),
});
