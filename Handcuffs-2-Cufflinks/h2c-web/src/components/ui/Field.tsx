import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-bone">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}

const fieldBase =
  'w-full rounded-xl border border-faint/50 bg-onyx px-4 py-3 text-sm text-bone ' +
  'placeholder:text-faint transition-colors focus:border-gold';

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, 'h-12', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldBase, 'resize-y', className)} {...props} />;
}
