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
