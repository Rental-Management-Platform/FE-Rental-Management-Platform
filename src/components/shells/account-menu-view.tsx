"use client";

import { ChevronDownIcon, LogOutIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/lib/api/types";
import { authHref } from "@/lib/next-path";
import type { SessionState } from "@/lib/session/create-session";
import {
  RETRY_LABEL,
  UNAVAILABLE_MESSAGE,
  UNAVAILABLE_TITLE,
} from "@/lib/session/messages";
import { ACCOUNT_LINKS, type NavItem } from "./nav-config";
import { MenuLink } from "./nav-link";

export interface AccountMenuViewProps {
  state: SessionState;
  onSignOut: () => void;
  /** The session could not be checked: tries again (`restore()`). */
  onRetry: () => void;
  /** `bar` is the header menu; `list` is the same content laid out inside a sheet. */
  variant?: "bar" | "list";
  /** Public pages use `lg` (44 px); the dense workspace top bar uses `default`. */
  size?: "default" | "lg";
  /** Called after a link or a sign out is chosen, so a sheet around it can close. */
  onNavigate?: () => void;
  /** Replaces the links taken from `ACCOUNT_LINKS`, so the gallery can show a full menu. */
  links?: readonly NavItem[];
}

// Draws one state and nothing else, so `/dev/ui` can show all of them without a backend.
// `AccountMenu` reads the session and hands the state down.
export function AccountMenuView({
  state,
  onSignOut,
  onRetry,
  variant = "bar",
  size = "lg",
  onNavigate,
  links,
}: AccountMenuViewProps) {
  if (state.status === "loading") return <AccountLoading variant={variant} />;
  if (state.status === "guest") {
    // The session may still be valid, so the sign in buttons give way to a retry (spec 0005).
    return state.endedReason === "unavailable" ? (
      <AccountUnavailable variant={variant} size={size} onRetry={onRetry} />
    ) : (
      <GuestActions variant={variant} size={size} onNavigate={onNavigate} />
    );
  }

  const items = links ?? linksFor(state.user);
  return variant === "list" ? (
    <UserList
      user={state.user}
      links={items}
      onSignOut={onSignOut}
      onNavigate={onNavigate}
    />
  ) : (
    <UserMenu
      user={state.user}
      links={items}
      size={size}
      onSignOut={onSignOut}
    />
  );
}

const linksFor = (user: User): readonly NavItem[] => [
  ...ACCOUNT_LINKS.all,
  ...ACCOUNT_LINKS[user.accountType],
];

// The name, else the email (spec 0003, "Value sourcing").
const displayNameOf = (user: User) => user.name?.trim() || user.email;

// The first letter of the name, else of the email.
const initialOf = (text: string) =>
  (Array.from(text.trim())[0] ?? "?").toLocaleUpperCase("vi-VN");

// A fixed size, so the bar does not jump when the answer arrives.
function AccountLoading({ variant }: { variant: "bar" | "list" }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={variant === "list" ? "flex flex-col gap-3" : "flex"}
    >
      {variant === "list" ? (
        <>
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </>
      ) : (
        <Skeleton className="h-8 w-24" />
      )}
      <span className="sr-only">Đang tải tài khoản</span>
    </div>
  );
}

interface GuestActionsProps {
  variant: "bar" | "list";
  size: "default" | "lg";
  onNavigate?: () => void;
}

// The sign in and sign up buttons carry the page the person is on, so they come back to it
// (spec 0005, AC-13). Reading the path needs <Suspense> on a route with dynamic parts, so the
// buttons are a small leaf with the loading skeleton as its fallback.
function GuestActions(props: GuestActionsProps) {
  return (
    <Suspense fallback={<AccountLoading variant={props.variant} />}>
      <GuestLinks {...props} />
    </Suspense>
  );
}

function GuestLinks({ variant, size, onNavigate }: GuestActionsProps) {
  const pathname = usePathname();
  // The home page has nothing to come back to, and `authHref` drops the auth pages itself.
  const next = pathname === "/" ? null : pathname;
  const loginHref = authHref("/login", next);
  const registerHref = authHref("/register", next);

  if (variant === "list") {
    return (
      <div className="flex flex-col gap-3">
        <Button asChild variant="outline" size="lg">
          <Link href={loginHref} onClick={onNavigate}>
            Đăng nhập
          </Link>
        </Button>
        <Button asChild size="lg">
          <Link href={registerHref} onClick={onNavigate}>
            Đăng ký
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" size={size}>
        <Link href={loginHref}>Đăng nhập</Link>
      </Button>
      <Button asChild size={size}>
        <Link href={registerHref}>Đăng ký</Link>
      </Button>
    </div>
  );
}

// `guest('unavailable')`: the server did not answer, so the person may still be signed in.
function AccountUnavailable({
  variant,
  size,
  onRetry,
}: {
  variant: "bar" | "list";
  size: "default" | "lg";
  onRetry: () => void;
}) {
  if (variant === "list") {
    return (
      <div role="status" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-base font-medium">{UNAVAILABLE_TITLE}</span>
          <span className="text-sm text-muted-foreground">
            {UNAVAILABLE_MESSAGE}
          </span>
        </div>
        <Button variant="outline" size="lg" onClick={onRetry}>
          {RETRY_LABEL}
        </Button>
      </div>
    );
  }
  return (
    <div role="status" className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{UNAVAILABLE_TITLE}</span>
      <Button variant="outline" size={size} onClick={onRetry}>
        {RETRY_LABEL}
      </Button>
    </div>
  );
}

interface UserViewProps {
  user: User;
  links: readonly NavItem[];
  onSignOut: () => void;
}

function UserMenu({
  user,
  links,
  size,
  onSignOut,
}: UserViewProps & { size: "default" | "lg" }) {
  const name = displayNameOf(user);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className="max-w-56 gap-2 px-2"
          aria-label={`Tài khoản của ${name}`}
        >
          <Avatar>
            <AvatarFallback>{initialOf(name)}</AvatarFallback>
          </Avatar>
          <span className="hidden min-w-0 truncate lg:inline">{name}</span>
          <ChevronDownIcon aria-hidden="true" className="hidden lg:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="truncate text-base font-medium text-foreground">
            {name}
          </span>
          {name !== user.email && (
            <span className="truncate text-sm">{user.email}</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.length > 0 && (
          <>
            <DropdownMenuGroup>
              {links.map((link) => (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href}>
                    <link.icon aria-hidden="true" />
                    {link.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onSignOut}>
            <LogOutIcon aria-hidden="true" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserList({
  user,
  links,
  onSignOut,
  onNavigate,
}: UserViewProps & { onNavigate?: () => void }) {
  const name = displayNameOf(user);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar size="lg">
          <AvatarFallback>{initialOf(name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-base font-medium">{name}</span>
          {name !== user.email && (
            <span className="truncate text-sm text-muted-foreground">
              {user.email}
            </span>
          )}
        </div>
      </div>
      {links.length > 0 && (
        <ul className="flex flex-col gap-1">
          {links.map((link) => (
            <li key={link.href}>
              <MenuLink
                href={link.href}
                icon={link.icon}
                onNavigate={onNavigate}
              >
                {link.label}
              </MenuLink>
            </li>
          ))}
        </ul>
      )}
      <Button
        variant="outline"
        size="lg"
        onClick={() => {
          onSignOut();
          onNavigate?.();
        }}
      >
        <LogOutIcon data-icon="inline-start" aria-hidden="true" />
        Đăng xuất
      </Button>
    </div>
  );
}
