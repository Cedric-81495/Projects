import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { useScrollLock } from '@/hooks/useScrollLock';
import { useAuth } from '@/providers/context/auth';
import { ROUTES } from '@/router/routes';
import { NAV_ITEMS, BRAND, PRIMARY_CTA, SOCIAL_LINKS } from '@/config/site';
import { cn } from '@/lib/utils/cn';
import type { IconName } from '@/components/ui/Icon';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  currentPath: string;
}

/**
 * Full-screen navigation. Items are set in the serif at reading size rather
 * than as a compact list — on a phone this is the primary way through the
 * site, so it gets the same care as a page.
 */
export function MobileNav({ open, onClose, currentPath }: MobileNavProps) {
  useScrollLock(open);
  /**
   * The desktop header carries a CMS link for signed-in staff, and below
   * 1280px that whole nav is replaced by this drawer. Without the same link
   * here, an administrator checking the site on a phone has no way back to
   * their work except typing the address.
   */
  const { user } = useAuth();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Any navigation closes the menu.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  return (
    <nav
      className={cn('mnav', open && 'is-open')}
      id="mnav"
      aria-label="Mobile"
      aria-hidden={!open}
    >
      <Link to="/" onClick={onClose} className="mnav-brand" aria-label={`${BRAND.name} — home`}>
        <img className="mnav-logo" src="/media/logo-wordmark.webp" alt="" />
      </Link>

      {[...NAV_ITEMS, { label: PRIMARY_CTA.label, to: PRIMARY_CTA.to }].map((item, i) => (
        <Link key={item.to} to={item.to} onClick={onClose} tabIndex={open ? 0 : -1}>
          {item.label}
          <span>{String(i + 1).padStart(2, '0')}</span>
        </Link>
      ))}

      {user && (
        <Link
          to={ROUTES.adminDashboard}
          onClick={onClose}
          tabIndex={open ? 0 : -1}
          className="mnav-cms"
        >
          Back to the CMS
          <span>Signed in as staff</span>
        </Link>
      )}

      {user && (
        <Link
          to={ROUTES.adminDashboard}
          onClick={onClose}
          tabIndex={open ? 0 : -1}
          className="mnav-cms"
        >
          Back to the CMS
          <span>Staff</span>
        </Link>
      )}

      <div className="mnav-social">
        {SOCIAL_LINKS.map((social) => (
          <a
            key={social.platform}
            className="iconbtn"
            href={social.url}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={social.platform}
            tabIndex={open ? 0 : -1}
          >
            <Icon name={social.platform.toLowerCase() as IconName} />
          </a>
        ))}
      </div>
    </nav>
  );
}
