"use client";

import { SearchIcon } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MAX_KEYWORD_LENGTH,
  parseListingSearch,
} from "../schemas/search-params";

const FORM_LABEL = "Tìm phòng trọ";
const FORM_CLASS = "flex flex-1 flex-col gap-3 sm:flex-row";

// The field and its button, shared by the live form and the fallback so they look the same.
// `q` is only the starting text: the field is not controlled, the browser keeps what is typed.
function Fields({ q }: { q: string }) {
  return (
    <>
      <Input
        name="q"
        type="search"
        size="lg"
        maxLength={MAX_KEYWORD_LENGTH}
        enterKeyHint="search"
        aria-label="Từ khóa: tên đường, phường hoặc tiêu đề tin"
        placeholder="Tên đường, phường hoặc từ khóa"
        defaultValue={q}
        className="sm:flex-1"
      />
      <Button type="submit" size="lg">
        <SearchIcon data-icon="inline-start" />
        Tìm trọ
      </Button>
    </>
  );
}

/**
 * The form shown until the live one is ready: the first visit, and a page read without scripts.
 * A plain GET form with the same field, so a search still works (spec 0009, AC-4).
 */
export function SearchBoxFallback() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <form
        action="/"
        role="search"
        aria-label={FORM_LABEL}
        className={FORM_CLASS}
      >
        <Fields q="" />
      </form>
    </div>
  );
}

/**
 * The search box (spec 0009, AC-4). A `next/form` GET form: Enter or the button goes to
 * `/?q=…` by client navigation, and it works with scripts off. It has no `page` field, so a
 * search always starts at page 1, and it never searches while typing. The field starts from the
 * keyword in the address and is keyed on it, so the back and forward buttons put the right text
 * back. A link clears the keyword while one is set.
 */
export function SearchBox() {
  const params = useSearchParams();
  const { q } = parseListingSearch({
    q: params.get("q"),
    page: params.get("page"),
  });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Form
        action="/"
        role="search"
        aria-label={FORM_LABEL}
        className={FORM_CLASS}
      >
        <Fields key={q} q={q} />
      </Form>
      {q !== "" && (
        <Button asChild variant="ghost" size="lg">
          <Link href="/">Xóa tìm kiếm</Link>
        </Button>
      )}
    </div>
  );
}
