import { z } from 'zod';

/**
 * Password policy — length over character classes.
 *
 * A single "must contain a symbol" rule mostly produces "Password1!", which is
 * weaker than a long passphrase. Twelve characters is the floor.
 */
const password = z
  .string()
  .min(12, 'Use at least 12 characters — a short phrase works well.')
  .max(200, 'That password is too long.');

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, 'Add your first name.').max(80),
  lastName: z.string().trim().max(80).optional(),
  email: z.string().email('Check the email address — it needs an @ and a domain.'),
  password,
  location: z.string().trim().max(160).optional(),
  /** Separate from the account: an account is not consent to be emailed. */
  subscribeToMovement: z.boolean().default(false),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Please accept the Terms of Use to continue.' }),
  }),
});

export const memberSignInSchema = z.object({
  email: z.string().email('Check the email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  location: z.string().trim().max(160).optional(),
  subscribedToMovement: z.boolean().optional(),
});

export const changeMemberPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: password,
});
