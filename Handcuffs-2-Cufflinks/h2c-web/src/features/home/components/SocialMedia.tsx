import { Section, Wrap } from '@/components/ui/Section';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { SOCIAL_LINKS } from '@/config/site';

/** Homepage section 13 — social platforms. */
export function SocialMedia() {
  const platforms = [
    ...SOCIAL_LINKS,
    { platform: 'Spotify', url: '#', handle: 'The H2C Podcast' },
  ];

  return (
    <Section surface="obsidian" tight>
      <Wrap>
        <Eyebrow>Follow the movement</Eyebrow>
        <h2 className="h-md rise d1">The story keeps going everywhere else too</h2>

        <div className="socials rise d2">
          {platforms.map((social) => (
            <a
              className="social"
              key={social.platform}
              href={social.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Icon name={social.platform.toLowerCase() as IconName} />
              <b>{social.platform}</b>
              <span>{social.handle}</span>
            </a>
          ))}
        </div>
      </Wrap>
    </Section>
  );
}
