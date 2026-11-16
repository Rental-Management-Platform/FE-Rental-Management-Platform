// Where the catalog of wards and amenities lives, for an admin (scope #23). Pure: no React, no
// router.

/**
 * The page of the catalog: the wards, communes and special zones, and the amenities, as the
 * landlord forms offer them (`GET /wards`, `GET /amenities`; writes need `catalog:create`,
 * `catalog:update` and `catalog:delete`). The admin tool "Danh mục" uses this one constant.
 */
export const ADMIN_CATALOG_PATH = "/admin/catalog";
