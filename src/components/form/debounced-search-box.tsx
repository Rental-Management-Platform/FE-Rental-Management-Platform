"use client";

import { SearchIcon } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** How long the search box waits after the last key before it changes the address. */
const SEARCH_DELAY_MS = 400;

/**
 * The search box of an admin list whose search text lives in the address (the users and the listing
 * moderation pages). It owns its text while the person types: it never takes the address text back
 * because of its own echo, or a trailing space would vanish under the finger. It takes the address
 * text again only when the address changes from outside (the "Xóa bộ lọc" button, Back). `pushed`
 * is the text this box last wrote to the address, so an address equal to it is its own echo. The
 * text goes to `onSearch` after 400 ms without a key, and Enter does not wait. There is no text
 * under the box: the placeholder shows what can be typed (design.md, "Forms").
 */
export function DebouncedSearchBox({
  value,
  onSearch,
  clean,
  label,
  placeholder,
}: {
  /** The search text the address holds now, already cleaned. */
  value: string;
  onSearch: (q: string) => void;
  /** The one rule for a search text (trim and cut), so a typed text and an address text agree. */
  clean: (text: string) => string;
  label: string;
  placeholder: string;
}) {
  const id = useId();
  const [text, setText] = useState(value);
  const [pushed, setPushed] = useState(value);
  const [seen, setSeen] = useState(value);

  // An address that is not what this box wrote is an outside change: take its text.
  if (value !== seen) {
    setSeen(value);
    if (value !== pushed) {
      setPushed(value);
      setText(value);
    }
  }

  useEffect(() => {
    const next = clean(text);
    if (next === pushed) return;
    const timer = setTimeout(() => {
      setPushed(next);
      onSearch(next);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [text, pushed, onSearch, clean]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = clean(text);
    if (next === pushed) return;
    setPushed(next);
    onSearch(next);
  };

  return (
    <form onSubmit={submit}>
      <Field>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={id}
            type="search"
            size="lg"
            autoComplete="off"
            placeholder={placeholder}
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="pl-9"
          />
        </div>
      </Field>
    </form>
  );
}
