/**
 * The cache key all of the landlord's property data lives under. A new property drops the
 * cached lists below it (the picker must not start from a list that lacks it), and a new
 * listing marks them out of date (it moves the `listingCount` of its property).
 */
export const propertiesKey = ["properties"] as const;
