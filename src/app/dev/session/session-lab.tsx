"use client";

import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { z } from "zod";
import { isApiError } from "@/lib/api/errors";
import type { MeResponse, Page, Plan, RegisterBody } from "@/lib/api/types";
import {
  useApi,
  useSession,
  useSessionActions,
} from "@/lib/session/auth-provider";
import type { SessionState } from "@/lib/session/create-session";

const describeCall = (error: unknown) =>
  isApiError(error)
    ? `${error.code} (status ${error.status}): ${error.message}`
    : "Unexpected error.";

function describeState(state: SessionState): string {
  switch (state.status) {
    case "loading":
      return "loading";
    case "guest":
      return `guest (endedReason: ${state.endedReason ?? "none"})`;
    case "user":
      return `user: ${state.user.email} · ${state.user.accountType} · ${state.permissions.length} permissions`;
  }
}

function SessionPanel() {
  const state = useSession();
  return (
    <section aria-labelledby="session-state" className="flex flex-col gap-2">
      <h2 id="session-state" className="font-medium">
        Session
      </h2>
      <output aria-live="polite" className="text-sm">
        {describeState(state)}
      </output>
    </section>
  );
}

interface CallSectionProps<T> {
  id: string;
  title: string;
  buttonLabel: string;
  query: UseQueryResult<T>;
  summarize: (data: T) => string;
}

function CallSection<T>({
  id,
  title,
  buttonLabel,
  query,
  summarize,
}: CallSectionProps<T>) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2">
      <h2 id={id} className="font-medium">
        {title}
      </h2>
      <div>
        <button
          type="button"
          onClick={() => void query.refetch()}
          disabled={query.isFetching}
          className="rounded border px-3 py-1 disabled:opacity-50"
        >
          {buttonLabel}
        </button>
      </div>
      <output aria-live="polite" className="text-sm">
        {query.isFetching
          ? "Calling…"
          : query.data
            ? summarize(query.data)
            : !query.error && "Not called yet."}
      </output>
      {query.error && (
        <p role="alert" className="text-sm text-red-700">
          {describeCall(query.error)}
        </p>
      )}
    </section>
  );
}

function PublicCall() {
  const api = useApi();
  const plans = useQuery({
    queryKey: ["dev", "plans"],
    queryFn: ({ signal }) =>
      api.get<Page<Plan>>("/plans", { auth: "none", signal }),
    enabled: false,
    retry: false,
  });
  return (
    <CallSection
      id="public-call"
      title="Public call: GET /plans (mode none)"
      buttonLabel="Call GET /plans"
      query={plans}
      summarize={(data) => `total: ${data.total}`}
    />
  );
}

function RequiredCall() {
  const api = useApi();
  const me = useQuery({
    queryKey: ["dev", "me"],
    queryFn: ({ signal }) => api.get<MeResponse>("/auth/me", { signal }),
    enabled: false,
    retry: false,
  });
  return (
    <CallSection
      id="required-call"
      title="Login call: GET /auth/me (mode required)"
      buttonLabel="Call GET /auth/me"
      query={me}
      summarize={(data) =>
        `${data.user.email} · ${data.permissions.length} permissions`
      }
    />
  );
}

interface TextFieldProps extends ComponentProps<"input"> {
  id: string;
  label: string;
  error?: string;
}

function TextField({ id, label, error, ...inputProps }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="rounded border px-2 py-1"
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

// The checks only ask for something, so the server answers with its real 400s.
const signInSchema = z.object({
  email: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});
type SignInValues = z.infer<typeof signInSchema>;

function SignInForm() {
  const { signIn } = useSessionActions();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInValues) => {
    clearErrors("root.server");
    try {
      await signIn(values);
    } catch (error) {
      setError("root.server", { type: "server", message: describeCall(error) });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-labelledby="sign-in-title"
      className="flex flex-col gap-3"
    >
      <h2 id="sign-in-title" className="font-medium">
        Sign in
      </h2>
      <TextField
        id="sign-in-email"
        label="Email"
        autoComplete="username"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        id="sign-in-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      {errors.root?.server && (
        <p role="alert" className="text-sm text-red-700">
          {errors.root.server.message}
        </p>
      )}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded border px-3 py-1 disabled:opacity-50"
        >
          Sign in
        </button>
      </div>
    </form>
  );
}

const signUpSchema = z.object({
  email: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
  name: z.string(),
  accountType: z.enum(["landlord", "tenant"]),
  phone: z.string(),
});
type SignUpValues = z.infer<typeof signUpSchema>;

function SignUpForm() {
  const { signUp } = useSessionActions();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      accountType: "tenant",
      phone: "",
    },
  });

  const onSubmit = async ({ name, phone, ...values }: SignUpValues) => {
    clearErrors("root.server");
    // An empty optional box is left out, not sent as an empty string.
    const body: RegisterBody = {
      ...values,
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
    };
    try {
      await signUp(body);
    } catch (error) {
      setError("root.server", { type: "server", message: describeCall(error) });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-labelledby="sign-up-title"
      className="flex flex-col gap-3"
    >
      <h2 id="sign-up-title" className="font-medium">
        Register
      </h2>
      <TextField
        id="sign-up-email"
        label="Email"
        autoComplete="username"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        id="sign-up-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <TextField
        id="sign-up-name"
        label="Name (optional)"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <div className="flex flex-col gap-1">
        <label htmlFor="sign-up-account-type" className="text-sm">
          Account type
        </label>
        <select
          id="sign-up-account-type"
          className="rounded border px-2 py-1"
          {...register("accountType")}
        >
          <option value="tenant">tenant</option>
          <option value="landlord">landlord</option>
        </select>
      </div>
      <TextField
        id="sign-up-phone"
        label="Phone (required for a landlord)"
        type="tel"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register("phone")}
      />
      {errors.root?.server && (
        <p role="alert" className="text-sm text-red-700">
          {errors.root.server.message}
        </p>
      )}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded border px-3 py-1 disabled:opacity-50"
        >
          Register
        </button>
      </div>
    </form>
  );
}

export function SessionLab() {
  const state = useSession();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <header>
        <h1 className="text-xl font-semibold">Session lab</h1>
        <p className="text-sm text-neutral-600">
          Temporary developer page for the API client and the session. It
          answers 404 in a production build.
        </p>
      </header>

      <SessionPanel />
      <PublicCall />
      <RequiredCall />

      {state.status !== "user" && (
        <>
          <SignInForm />
          <SignUpForm />
        </>
      )}
    </main>
  );
}
