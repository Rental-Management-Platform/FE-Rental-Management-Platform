/**
 * The address every "Mua gói" button and "Xem bảng giá" link points to (spec 0020, AC-11). One
 * constant in one file, so the pricing page (#18) creates its route with this same value and
 * nothing has to be rewired. Until that page exists the link leads to the 404 page, which is
 * accepted.
 */
export const PRICING_PATH = "/bang-gia";
