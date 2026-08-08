import { forwardRef, useId, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

/**
 * Password input with a reveal control.
 *
 * Worth having rather than assuming careful typing: this platform asks for
 * twelve characters and encourages passphrases, and a long phrase typed blind
 * on a phone keyboard is where a large share of failed sign-ins come from.
 * Being able to check what you typed is the difference between one attempt and
 * eight — and eight is a fifteen-minute lockout.
 *
 * Revealing is a per-field, per-session choice that always starts hidden. It is
 * never remembered: the next person at a shared desk should not inherit a
 * decision made by someone who was alone at the time.
 *
 * `forwardRef` so react-hook-form's `register()` can be spread onto it exactly
 * as it is onto a plain input — a field that needs special handling at the call
 * site is a field that gets used inconsistently.
 */

type PasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(props, ref) {
    const [revealed, setRevealed] = useState(false);
    const describedBy = useId();

    return (
      <span className="pwfield">
        <input
          {...props}
          ref={ref}
          type={revealed ? 'text' : 'password'}
          aria-describedby={describedBy}
        />
        <button
          type="button"
          onClick={() => setRevealed(!revealed)}
          /**
           * Deliberately outside the tab order. Between a password field and
           * the submit button, a control that only changes what is on screen is
           * an obstacle for someone signing in from the keyboard — and password
           * managers, which are how most people fill this field, never need it.
           * It stays reachable by pointer, and by screen readers browsing
           * controls.
           */
          tabIndex={-1}
          aria-label={revealed ? 'Hide password' : 'Show password'}
          aria-pressed={revealed}
        >
          <Icon name={revealed ? 'eye-off' : 'eye'} />
        </button>
        <span id={describedBy} className="sr">
          {revealed ? 'Password is visible on screen.' : 'Password is hidden.'}
        </span>
      </span>
    );
  }
);
