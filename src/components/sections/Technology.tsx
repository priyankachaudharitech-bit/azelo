import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { technology } from "@/lib/content";

/**
 * Grouped labels, not a logo wall. Deliberately typographic, so the section
 * reads as an honest capability statement and costs no image requests.
 *
 * `onlyShowVerified` hides technologies the owner has not yet confirmed. Set it
 * to `true` in `content.ts` once OWNER_CONFIG.md has been reviewed.
 */
export function Technology() {
  const groups = technology.groups
    .map((group) => ({
      ...group,
      visible: technology.onlyShowVerified
        ? group.items.filter((item) => item.verified)
        : group.items,
    }))
    .filter((group) => group.visible.length > 0);

  return (
    <Section id="technology" divided>
      <SectionHeading
        eyebrow={technology.eyebrow}
        title={technology.title}
        description={technology.description}
      />

      <dl className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
        {groups.map((group) => (
          <div
            key={group.id}
            className="flex flex-col gap-3 border-t border-hairline pt-5"
          >
            <dt className="label-mono">{group.group}</dt>
            <dd>
              <ul className="flex flex-wrap gap-2">
                {group.visible.map((item) => (
                  <li
                    key={item.label}
                    className="rounded-full border border-hairline bg-surface px-3 py-1.5 font-mono text-[0.6875rem] text-text/90"
                  >
                    {item.label}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}