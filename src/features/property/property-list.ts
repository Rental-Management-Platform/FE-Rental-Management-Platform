import { formatCount } from "@/lib/format";

// Where the pages of the landlord's properties are, and how the list words itself (spec 0019,
// AC-11). Pure: no React, no router.

export const MY_PROPERTIES_PATH = "/landlord/properties";
export const NEW_PROPERTY_PATH = "/landlord/properties/new";

export const editPropertyHref = (id: string) =>
  `${MY_PROPERTIES_PATH}/${encodeURIComponent(id)}/edit`;

/** The post a listing form with this property already chosen (spec 0006, AC-14). */
export const postListingHref = (propertyId: string) =>
  `/landlord/listings/new?propertyId=${encodeURIComponent(propertyId)}`;

/** The address of one page. Page 1 has no query, so it is the clean address. */
export const myPropertiesHref = (page: number) =>
  page <= 1 ? MY_PROPERTIES_PATH : `${MY_PROPERTIES_PATH}?page=${page}`;

/** The words of the list heading, which a screen reader hears again when the count changes. */
export const propertiesHeading = (total: number) =>
  `${formatCount(total)} nhà trọ`;
