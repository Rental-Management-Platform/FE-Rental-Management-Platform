"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { isAbortError } from "@/lib/api/abort";
import type { AccountTypeView } from "@/lib/api/types";
import { useApi } from "@/lib/session/auth-provider";
import { savedToast, TYPE_NAME } from "../admin-permissions-text";
import { accountTypesKey } from "../api/admin-permissions-keys";
import { updateAccountType } from "../api/permissions";
import { classifySaveError, type SaveFailure } from "../permission-failure";
import {
  EDITABLE_TYPES,
  baselineOf,
  countChanges,
  grantableKeys,
  orderedKeys,
  sameSet,
  toggled,
  type EditableType,
  type MatrixModule,
} from "../permission-model";

type PerType<T> = Record<EditableType, T>;

/**
 * The state of the permission matrix while an admin works on it (scope #24).
 *
 * What is on screen for a type is its edit, or the server's list when it has none, so a type nobody
 * touched follows the server and a touched one is left alone. Turning a box back to what the server
 * holds drops the edit, so "has changes" is never true for a type that equals the server. A save
 * sends, for each type that has an edit, the whole list it ended up with (the API replaces
 * everything), one type after the other. A type that saves leaves its edit and its answer goes
 * straight into the cache; a type that fails keeps its edit and its failure, so nothing typed is
 * lost and the other type is not held back by it. A 429 stops the loop, because every later request
 * would be refused too.
 */
export function usePermissionEditor(
  modules: readonly MatrixModule[],
  types: readonly AccountTypeView[],
) {
  const api = useApi();
  const queryClient = useQueryClient();
  const grantable = useMemo(() => grantableKeys(modules), [modules]);
  const baseline = useMemo<PerType<Set<string>>>(
    () => ({
      landlord: baselineOf(
        types.find((t) => t.key === "landlord"),
        grantable,
      ),
      tenant: baselineOf(
        types.find((t) => t.key === "tenant"),
        grantable,
      ),
    }),
    [types, grantable],
  );

  const [edits, setEdits] = useState<PerType<ReadonlySet<string> | null>>({
    landlord: null,
    tenant: null,
  });
  const [failures, setFailures] = useState<Partial<PerType<SaveFailure>>>({});
  const [saving, setSaving] = useState(false);
  // State lags a render behind a fast second press, so a ref guards the request itself.
  const inFlight = useRef(false);

  const current = (type: EditableType): ReadonlySet<string> =>
    edits[type] ?? baseline[type];

  const changes = {
    landlord: countChanges(baseline.landlord, current("landlord")),
    tenant: countChanges(baseline.tenant, current("tenant")),
  };
  const dirtyTypes = EDITABLE_TYPES.filter((type) => edits[type] !== null);

  const toggle = (type: EditableType, key: string) => {
    setFailures((f) => ({ ...f, [type]: undefined }));
    setEdits((e) => {
      const next = toggled(e[type] ?? baseline[type], key);
      return { ...e, [type]: sameSet(next, baseline[type]) ? null : next };
    });
  };

  const discard = () => {
    setEdits({ landlord: null, tenant: null });
    setFailures({});
  };

  const save = async () => {
    if (inFlight.current || dirtyTypes.length === 0) return;
    inFlight.current = true;
    setSaving(true);
    setFailures({});
    try {
      for (const type of dirtyTypes) {
        const wanted = edits[type];
        if (wanted === null) continue;
        try {
          const saved = await updateAccountType(
            api,
            type,
            orderedKeys(wanted, modules),
          );
          queryClient.setQueryData<AccountTypeView[]>(accountTypesKey, (old) =>
            old?.map((entry) => (entry.key === saved.key ? saved : entry)),
          );
          setEdits((e) => ({ ...e, [type]: null }));
          toast.success(savedToast(saved.name || TYPE_NAME[type]));
        } catch (error) {
          // The session changed under the request (a sign out in this tab): nothing to show.
          if (isAbortError(error)) return;
          const failure = classifySaveError(error);
          setFailures((f) => ({ ...f, [type]: failure }));
          if (failure.kind === "rate-limited") break;
        }
      }
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  return {
    baseline,
    current,
    changes,
    dirtyTypes,
    failures,
    saving,
    toggle,
    discard,
    save,
  };
}
