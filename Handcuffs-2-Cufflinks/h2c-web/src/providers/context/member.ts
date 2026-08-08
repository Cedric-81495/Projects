import { createContext, useContext } from 'react';

export interface PublicMember {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  location?: string;
  emailVerified: boolean;
  subscribedToMovement: boolean;
}

export interface RegisterInput {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
  location?: string;
  subscribeToMovement: boolean;
  acceptTerms: true;
}

export interface MemberContextValue {
  member: PublicMember | null;
  status: 'loading' | 'signed-in' | 'anonymous';
  register: (input: RegisterInput) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const MemberContext = createContext<MemberContextValue | null>(null);

export function useMember(): MemberContextValue {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error('useMember must be used within MemberProvider');
  return ctx;
}
