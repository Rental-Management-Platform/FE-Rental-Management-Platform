import { SITE_NAME } from "@/lib/site";

// A placeholder until the home page (#16) is built. The shell owns <main>.
export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <h1>{SITE_NAME}</h1>
    </div>
  );
}
