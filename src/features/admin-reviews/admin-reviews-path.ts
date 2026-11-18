// Where the reviews of everyone live, for an admin (scope #36). Pure: no React, no router.

/**
 * The page that moderates reviews (`GET /moderation/reviews` and `GET /moderation/listing-reviews`,
 * permission `review:moderate`). The admin tool "Kiểm duyệt đánh giá" and every link back to the
 * clean list use this one constant.
 */
export const ADMIN_REVIEWS_PATH = "/admin/reviews";

/**
 * The id of the heading above the rows. A write that makes the row leave the list (a status filter
 * is set and the row no longer matches) sends focus here, because the button that opened the
 * dialog is gone.
 */
export const RESULTS_HEADING_ID = "admin-reviews-title";
