import { Link } from 'react-router-dom';
import { BRAND, NAV_ITEMS, SOCIAL_LINKS, ECOSYSTEM } from '@/config/site';
import { ROUTES } from '@/router/routes';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="ftr">
      <div className="ftr-grid">
        <div>
          <Link to="/" className="ftr-brand" aria-label={`${BRAND.name} — home`}>
            <img className="ftr-logo" src="/media/logo-wordmark.webp" alt="" />
          </Link>
          <p className="ftr-note">
            {BRAND.valueProposition}
          </p>
          <div className="ftr-crests">
            <img src="/media/crest-gwop-university.webp" alt="GWOP University crest" />
            <img src="/media/crest-founder.webp" alt="Founder crest" />
          </div>
        </div>

        <div>
          <h4>The movement</h4>
          <ul>
            {NAV_ITEMS.slice(1, 6).map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>The ecosystem</h4>
          <ul>
            <li>
              <Link to={ROUTES.gwop}>{ECOSYSTEM.gwop.name}</Link>
            </li>
            <li>
              <Link to={ROUTES.music}>{ECOSYSTEM.kitchen.name}</Link>
            </li>
            <li>
              <Link to={ROUTES.community}>Community</Link>
            </li>
            <li>
              <Link to={ROUTES.founder}>About the Founder</Link>
            </li>
            <li>
              <Link to={ROUTES.submitStory}>Share your story</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Follow</h4>
          <ul>
            {SOCIAL_LINKS.map((social) => (
              <li key={social.platform}>
                <a href={social.url} target="_blank" rel="noreferrer noopener">
                  {social.platform}
                </a>
              </li>
            ))}
            <li>
              <Link to={ROUTES.join}>Join the Movement</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="ftr-base">
        <span>
          © {year} {BRAND.name}. {BRAND.location}. {BRAND.purposeLine}
        </span>
        <nav aria-label="Legal">
          <Link to={`${ROUTES.legal}/privacy`}>Privacy Policy</Link>
          <Link to={`${ROUTES.legal}/terms`}>Terms of Use</Link>
          <Link to={`${ROUTES.legal}/cookies`}>Cookie Notice</Link>
          <Link to={`${ROUTES.legal}/consent`}>Story Consent</Link>
        </nav>
      </div>
    </footer>
  );
}
