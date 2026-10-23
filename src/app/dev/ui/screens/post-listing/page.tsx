import type { Metadata } from "next";
import { PostListingScreen } from "./post-listing-screen";

export const metadata: Metadata = { title: "Đăng tin (màn hình mẫu)" };

export default function PostListingScreenPage() {
  return <PostListingScreen />;
}
