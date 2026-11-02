import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/states/loading-state";
import { Results } from "@/features/listing-search/components/results";
import { ResultsBoundary } from "@/features/listing-search/components/results-boundary";

// The front door of the site (spec 0009). The header is the static shell. `searchParams` is
// passed down as a promise and read only inside the <Suspense> boundary, so the shell can be
// prerendered. The page reads no cookie, header or token: everyone sees the same list.
export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        title="Tìm phòng trọ"
        description="Phòng trọ, nhà cho thuê và căn hộ mini do chủ trọ đăng trực tiếp. Tìm theo tên đường, phường hoặc từ khóa."
      />
      <Suspense fallback={<LoadingState variant="cards" />}>
        <ResultsBoundary>
          <Results searchParams={searchParams} />
        </ResultsBoundary>
      </Suspense>
    </div>
  );
}
