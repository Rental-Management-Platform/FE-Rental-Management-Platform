// Structured data of the listing page (spec 0010, AC-16): one breadcrumb, nothing else. It holds
// no phone number and no personal field.

export type BreadcrumbInput = {
  /** `NEXT_PUBLIC_SITE_URL`, with no trailing slash. */
  siteUrl: string;
  /** The listing title, the last crumb. */
  title: string;
  /** The canonical path of the listing, such as `/phong-co-gac-k7m2xq9p`. */
  path: string;
};

/** "Tìm trọ", then the listing, each with an absolute address. */
export const breadcrumbJsonLd = ({
  siteUrl,
  title,
  path,
}: BreadcrumbInput) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Tìm trọ", item: `${siteUrl}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: title,
      item: `${siteUrl}${path}`,
    },
  ],
});

/**
 * The text of the script tag. Every less than sign becomes the six characters `<`, the
 * form the Next.js JSON-LD guide shows, so a title can never close the script tag.
 */
export const serializeJsonLd = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, "\\u003c");
