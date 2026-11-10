import { FAVORITES_PATH } from "./access";

/** The address of one page of saved listings. Page 1 has no query, so it is the clean address. */
export const savedHref = (page: number) =>
  page <= 1 ? FAVORITES_PATH : `${FAVORITES_PATH}?page=${page}`;

/** The last page that can hold a row, never below 1 (a `total` of 0 still has page 1). */
export const lastSavedPage = (total: number, pageSize: number) =>
  Math.max(1, Math.ceil(total / pageSize));
