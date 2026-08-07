import { Seo } from '@/lib/seo/Seo';
import { Eyebrow } from '@/components/ui/Eyebrow';
import { Note } from '@/components/ui/Note';

interface RecordModulePageProps {
  eyebrow: string;
  title: string;
  intro: string;
  /** The record types this module will manage, grouped as the CMS spec defines. */
  groups: { name: string; records: string[] }[];
}

/**
 * Shared shell for the CMS record modules.
 *
 * Each module's record types are declared here so the information architecture
 * is reviewable and agreed before any CRUD screens get built. The list is taken
 * from the Content & Record Management section of the guide.
 */
export function RecordModulePage({ eyebrow, title, intro, groups }: RecordModulePageProps) {
  return (
    <>
      <Seo title={title} description={intro} noIndex />
      <Eyebrow reveal={false}>{eyebrow}</Eyebrow>
      <h1 className="h-md">{title}</h1>
      <p className="body" style={{ maxWidth: '60ch' }}>
        {intro}
      </p>

      <div style={{ maxWidth: 900, marginTop: 'clamp(24px,3vw,38px)' }}>
        <Note label="Scaffolded">
          The record types below are agreed and typed. CRUD screens are built module by module
          against the same types the public site already consumes.
        </Note>

        <div className="g2" style={{ marginTop: 'clamp(24px,3vw,38px)' }}>
          {groups.map((group) => (
            <section key={group.name}>
              <h2 className="h-xs">{group.name}</h2>
              <ul className="bens">
                {group.records.map((record) => (
                  <li key={record}>
                    <span>{record}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
