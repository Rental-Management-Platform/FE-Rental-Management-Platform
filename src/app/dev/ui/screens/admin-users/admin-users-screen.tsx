"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckIcon,
  LockIcon,
  LockOpenIcon,
  SearchIcon,
  UsersRoundIcon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { FormField } from "@/components/form/form-field";
import { PageHeader } from "@/components/layout/page-header";
import { ListPagination } from "@/components/list-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { LoadingState } from "@/components/states/loading-state";
import { WorkspaceShell } from "@/components/shells/workspace-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type {
  AccountType,
  AdminUserListItem,
  UserStatus,
} from "@/lib/api/types";
import { useReturnFocus } from "@/lib/use-return-focus";
import {
  CURRENT_ADMIN_ID,
  NO_USER_FILTERS,
  USERS,
  USER_PAGE_SIZE,
  paginate,
  queryUsers,
  type UserFilters,
} from "../sample-data";
import {
  ACCOUNT_TYPE_LABEL,
  formatCount,
  formatDateTime,
  formatPhone,
} from "../sample-format";
import {
  SampleControls,
  StateChoice,
  StateSwitch,
  useSampleState,
  type SampleState,
} from "../sample-state";
import { ADMIN_SCREENS_NAV } from "../screens";

const TYPE_OPTIONS: readonly { value: AccountType | "all"; label: string }[] = [
  { value: "all", label: "Mọi loại tài khoản" },
  { value: "admin", label: ACCOUNT_TYPE_LABEL.admin },
  { value: "landlord", label: ACCOUNT_TYPE_LABEL.landlord },
  { value: "tenant", label: ACCOUNT_TYPE_LABEL.tenant },
];

const STATUS_OPTIONS: readonly { value: UserStatus | "all"; label: string }[] =
  [
    { value: "all", label: "Mọi trạng thái" },
    { value: "active", label: "Đang hoạt động" },
    { value: "locked", label: "Đã khóa" },
  ];

// The reason is required for a lock and for an unlock, at most 500 characters
// (api-for-frontend.md, 6.10 and 6.11). Built once, outside the component.
const reasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Nhập lý do.")
    .max(500, "Lý do tối đa 500 ký tự."),
});

type ReasonValues = z.infer<typeof reasonSchema>;

const displayName = (user: AdminUserListItem) => user.name ?? "Chưa đặt tên";

function StatusCell({ user }: { user: AdminUserListItem }) {
  if (user.status === "active") {
    return (
      <Badge variant="success">
        <CheckIcon data-icon="inline-start" />
        Đang hoạt động
      </Badge>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant="destructive">
        <LockIcon data-icon="inline-start" />
        Đã khóa
      </Badge>
      {user.lockedReason !== null && (
        <p className="max-w-56 text-xs whitespace-normal">
          Lý do: {user.lockedReason}
        </p>
      )}
    </div>
  );
}

function UsersTable({
  rows,
  onAskLock,
}: {
  rows: readonly AdminUserListItem[];
  onAskLock: (user: AdminUserListItem) => void;
}) {
  return (
    <Table>
      <TableCaption className="sr-only">Danh sách người dùng</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Người dùng</TableHead>
          <TableHead>Số điện thoại</TableHead>
          <TableHead>Loại tài khoản</TableHead>
          <TableHead>Ngày đăng ký</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead>Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="max-w-xs">
              <div className="flex min-w-56 items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {(user.name ?? user.email).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <span
                    className="truncate font-medium"
                    title={displayName(user)}
                  >
                    {displayName(user)}
                  </span>
                  <span
                    className="truncate text-sm text-muted-foreground"
                    title={user.email}
                  >
                    {user.email}
                  </span>
                </div>
              </div>
            </TableCell>
            <TableCell className="tabular-nums">
              {user.phone === null ? "Chưa có" : formatPhone(user.phone)}
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {ACCOUNT_TYPE_LABEL[user.accountType]}
              </Badge>
            </TableCell>
            <TableCell>{formatDateTime(user.createdAt)}</TableCell>
            <TableCell>
              <StatusCell user={user} />
            </TableCell>
            <TableCell>
              {user.id === CURRENT_ADMIN_ID ? (
                // Locking yourself is a 409 `CANNOT_LOCK_SELF`, so the button is not drawn.
                <span className="text-sm text-muted-foreground">
                  Tài khoản của bạn
                </span>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={`${user.status === "active" ? "Khóa" : "Mở khóa"} tài khoản ${user.email}`}
                  onClick={() => onAskLock(user)}
                >
                  {user.status === "active" ? (
                    <>
                      <LockIcon data-icon="inline-start" />
                      Khóa
                    </>
                  ) : (
                    <>
                      <LockOpenIcon data-icon="inline-start" />
                      Mở khóa
                    </>
                  )}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Inside `DialogContent`, which Radix unmounts when the dialog closes, so every opening starts
// with an empty reason.
function ReasonForm({
  locking,
  onConfirm,
  onCancel,
}: {
  locking: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const { control, handleSubmit } = useForm<ReasonValues>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: "" },
  });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(({ reason }) => onConfirm(reason))}
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <FormField
          control={control}
          name="reason"
          label="Lý do"
          description="Bắt buộc, tối đa 500 ký tự. Lý do được ghi lại cùng người thực hiện."
        >
          {({ field, aria }) => (
            <Textarea
              rows={4}
              placeholder={
                locking ? "Ví dụ: Đăng tin giả mạo" : "Ví dụ: Đã xác minh lại"
              }
              {...field}
              {...aria}
            />
          )}
        </FormField>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" variant={locking ? "destructive" : "default"}>
          {locking ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        </Button>
      </DialogFooter>
    </form>
  );
}

const resultsTitle = (state: SampleState, total: number) =>
  state === "data"
    ? `${formatCount(total)} người dùng`
    : state === "empty"
      ? "0 người dùng"
      : state === "loading"
        ? "Đang tải danh sách"
        : "Danh sách người dùng";

// Admin screen (desktop first, checked at 1440): a filters zone and a table zone, and a lock
// dialog that asks for a reason. The filters work on the sample rows the way `GET /users` would.
// Locking and unlocking change the row in state, as the screen does after the real call.
export function AdminUsersScreen() {
  const { state, select, reset, rateLimit } = useSampleState();
  const [users, setUsers] = useState<readonly AdminUserListItem[]>(USERS);
  const [filters, setFilters] = useState<UserFilters>(NO_USER_FILTERS);
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AdminUserListItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // One dialog serves every row, so it has no trigger of its own. The row stays after a lock or
  // an unlock, so focus goes back to its button.
  const { remember, onCloseAutoFocus } = useReturnFocus();

  const update = (patch: Partial<UserFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };
  const clearFilters = () => {
    setFilters(NO_USER_FILTERS);
    setPage(1);
  };
  const askLock = (user: AdminUserListItem) => {
    remember();
    setTarget(user);
    setDialogOpen(true);
  };
  const confirmLock = (reason: string) => {
    if (target === null) return;
    const locking = target.status === "active";
    // The lock and unlock answers have no `lockedReason`, so the screen sets it itself
    // (api-for-frontend.md, 6.34): the typed reason for a lock, null for an unlock.
    setUsers((current) =>
      current.map((user) =>
        user.id === target.id
          ? {
              ...user,
              status: locking ? "locked" : "active",
              lockedReason: locking ? reason : null,
            }
          : user,
      ),
    );
    setDialogOpen(false);
    toast.success(locking ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
  };

  const rows = queryUsers(users, filters);
  const result = paginate(rows, page, USER_PAGE_SIZE);
  const shown: SampleState =
    state === "data" && rows.length === 0 ? "empty" : state;
  const filtered =
    filters.q.trim() !== "" ||
    filters.accountType !== "all" ||
    filters.status !== "all";
  const locking = target?.status === "active";

  return (
    <WorkspaceShell title="Khu admin (mẫu)" items={ADMIN_SCREENS_NAV}>
      <div className="flex flex-col gap-6">
        <SampleControls>
          <StateChoice state={state} onChange={select} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setUsers(USERS)}
          >
            Đặt lại dữ liệu mẫu
          </Button>
        </SampleControls>

        <PageHeader
          title="Người dùng"
          description="Tìm người cần khóa hoặc mở khóa. Danh sách có mọi loại tài khoản, người mới đăng ký nằm trên cùng."
        />

        <Card>
          <CardContent>
            <form
              role="search"
              aria-label="Tìm người dùng"
              onSubmit={(event) => event.preventDefault()}
              className="flex flex-col gap-2"
            >
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem_14rem]">
                <div className="relative">
                  <SearchIcon
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    type="search"
                    aria-label="Tìm theo email, tên hoặc số điện thoại"
                    placeholder="Email, tên hoặc số điện thoại"
                    value={filters.q}
                    onChange={(event) => update({ q: event.target.value })}
                    className="pl-9"
                  />
                </div>
                <Select
                  value={filters.accountType}
                  onValueChange={(accountType) =>
                    update({
                      accountType: accountType as UserFilters["accountType"],
                    })
                  }
                >
                  <SelectTrigger aria-label="Loại tài khoản" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={(status) =>
                    update({ status: status as UserFilters["status"] })
                  }
                >
                  <SelectTrigger aria-label="Trạng thái" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Gõ tên đúng dấu: “nguyen” không tìm ra “Nguyễn”. Tìm theo email
                hoặc số điện thoại thì không bị ảnh hưởng.
              </p>
            </form>
          </CardContent>
        </Card>

        {/* The table zone: the count is its title row, the table below has no frame, and the
            pagination sits under a hairline. The states fill the same zone. */}
        <Card>
          <CardHeader className="border-b">
            <CardTitle>
              <h2 id="users-title" aria-live="polite" className="text-base">
                {resultsTitle(shown, rows.length)}
              </h2>
            </CardTitle>
          </CardHeader>
          <StateSwitch
            state={shown}
            rateLimit={rateLimit}
            onRetry={reset}
            loading={<LoadingState variant="table" />}
            empty={
              <EmptyState
                icon={UsersRoundIcon}
                title="Không có người dùng nào khớp"
                description="Thử đổi từ khóa hoặc bỏ bớt bộ lọc."
                action={
                  filtered ? (
                    <Button variant="outline" size="lg" onClick={clearFilters}>
                      Xóa bộ lọc
                    </Button>
                  ) : undefined
                }
              />
            }
          >
            <UsersTable rows={result.items} onAskLock={askLock} />
            <ListPagination
              page={result.page}
              pageSize={result.pageSize}
              total={result.total}
              itemLabel="người dùng"
              onPageChange={setPage}
              className="border-t px-(--card-spacing) py-4"
            />
          </StateSwitch>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
          <DialogHeader>
            <DialogTitle>
              {locking ? "Khóa tài khoản" : "Mở khóa tài khoản"}
            </DialogTitle>
            <DialogDescription>
              {locking
                ? `${target?.email} sẽ mất mọi phiên đăng nhập ngay và không đăng nhập lại được cho đến khi mở khóa.`
                : `${target?.email} sẽ phải đăng nhập lại, phiên cũ không được khôi phục.`}
            </DialogDescription>
          </DialogHeader>
          <ReasonForm
            locking={locking}
            onConfirm={confirmLock}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </WorkspaceShell>
  );
}
