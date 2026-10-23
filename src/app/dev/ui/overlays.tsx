"use client";

import {
  BellIcon,
  CopyIcon,
  EyeOffIcon,
  FilterIcon,
  LogOutIcon,
  MenuIcon,
  PencilIcon,
  SettingsIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Labeled, Section } from "./section";

function DialogDemo() {
  const [open, setOpen] = useState(false);
  const formId = useId();
  const nameId = useId();
  const noteId = useId();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Đổi tên nhà trọ</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi tên nhà trọ</DialogTitle>
          <DialogDescription>
            Tên mới hiện trên mọi tin đăng của nhà trọ này.
          </DialogDescription>
        </DialogHeader>
        <form
          id={formId}
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
            toast.success("Đã lưu tên nhà trọ");
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={nameId}>Tên nhà trọ</FieldLabel>
              <Input id={nameId} defaultValue="Nhà trọ Hồng Nhung" />
            </Field>
            <Field>
              <FieldLabel htmlFor={noteId}>Ghi chú</FieldLabel>
              <Textarea id={noteId} rows={3} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Hủy</Button>
          </DialogClose>
          <Button type="submit" form={formId}>
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// More lines than a short window holds: the dialog scrolls inside itself, the page behind
// stays put, and the close button stays reachable with Esc.
function LongDialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Điều khoản đăng tin</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Điều khoản đăng tin</DialogTitle>
          <DialogDescription>
            Đọc kỹ trước khi đăng tin đầu tiên.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i}>
              {i + 1}. Nội dung tin phải đúng sự thật: giá thuê, diện tích, địa
              chỉ và tình trạng phòng. Tin sai lệch có thể bị quản trị viên ẩn.
            </p>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Tôi đã đọc</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2Icon data-icon="inline-start" />
          Xóa tin
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa tin “Phòng trọ gần trường”?</AlertDialogTitle>
          <AlertDialogDescription>
            Tin sẽ biến mất khỏi trang tìm trọ. Bạn không thể hoàn tác thao tác
            này.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Giữ lại</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => toast.success("Đã xóa tin")}
          >
            Xóa tin
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SmallAlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <EyeOffIcon data-icon="inline-start" />
          Ẩn tin
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Ẩn tin này?</AlertDialogTitle>
          <AlertDialogDescription>
            Khách sẽ không thấy tin cho đến khi bạn hiện lại.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={() => toast("Đã ẩn tin")}>
            Ẩn tin
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SheetDemo({ side }: { side: "left" | "right" | "bottom" }) {
  const label = {
    left: "Menu bên trái",
    right: "Bộ lọc bên phải",
    bottom: "Sắp xếp từ dưới lên",
  }[side];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          {side === "left" ? (
            <MenuIcon data-icon="inline-start" />
          ) : (
            <FilterIcon data-icon="inline-start" />
          )}
          {label}
        </Button>
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>{label}</SheetTitle>
          <SheetDescription>
            Ngăn trượt giữ tiêu điểm bên trong, đóng bằng Esc hoặc nút Đóng.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2 px-4 text-sm text-muted-foreground">
          <p>Nội dung của ngăn nằm ở đây.</p>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button size="lg">Xong</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function MenuDemo() {
  const [showHidden, setShowHidden] = useState(true);
  const [sort, setSort] = useState("newest");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Menu đầy đủ</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Tin “Phòng trọ gần trường”</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <PencilIcon />
            Sửa tin
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CopyIcon />
            Sao chép liên kết
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <EyeOffIcon />
            Ẩn tin (đang tải)
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={showHidden}
          onCheckedChange={setShowHidden}
        >
          Hiện tin đã ẩn
        </DropdownMenuCheckboxItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Sắp xếp</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
              <DropdownMenuRadioItem value="newest">
                Mới nhất
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="cheapest">
                Giá thấp nhất
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive">
            <Trash2Icon />
            Xóa tin
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// The shape of the account menu that milestone M4 puts in the headers.
function AccountMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-lg" aria-label="Mở menu tài khoản">
          <Avatar>
            <AvatarFallback>N</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="truncate text-base font-medium text-foreground">
            Nguyễn Thị Hồng Nhung
          </span>
          <span className="truncate">nhung.nguyen@example.com</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon />
            Tài khoản
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BellIcon />
            Thông báo
          </DropdownMenuItem>
          <DropdownMenuItem>
            <SettingsIcon />
            Cài đặt
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOutIcon />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TooltipDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Sao chép liên kết"
          >
            <CopyIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Sao chép liên kết</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Có chú thích dài</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Chú thích chỉ nhắc lại điều đã rõ. Thông tin quan trọng luôn nằm ngay
          trên trang, vì màn hình cảm ứng không có chú thích khi rê chuột.
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function OverlaysSection() {
  return (
    <>
      <Section
        title="Hộp thoại"
        description="Việc cần một khung riêng để nhập hoặc đọc. Tiêu điểm vào trong hộp, Esc đóng và trả tiêu điểm về nút mở. Hộp dài thì cuộn bên trong."
      >
        <div className="flex flex-wrap gap-3">
          <DialogDemo />
          <LongDialogDemo />
        </div>
      </Section>

      <Section
        title="Hộp xác nhận"
        description="Chỉ dùng để xác nhận một việc không hoàn tác được. Tiêu điểm đầu tiên rơi vào nút an toàn “Hủy”, không đóng khi bấm ra ngoài."
      >
        <div className="flex flex-wrap gap-3">
          <AlertDialogDemo />
          <SmallAlertDialogDemo />
        </div>
      </Section>

      <Section
        title="Ngăn trượt"
        description="Menu của điện thoại, bộ lọc, chi tiết phụ. Dưới lg, menu bên của khu chủ trọ và admin cũng là một ngăn trượt."
      >
        <div className="flex flex-wrap gap-3">
          <SheetDemo side="left" />
          <SheetDemo side="right" />
          <SheetDemo side="bottom" />
        </div>
      </Section>

      <Section
        title="Menu thả xuống"
        description="Mũi tên di chuyển giữa các dòng, chữ cái đầu nhảy tới dòng khớp. Dòng nguy hiểm có chữ đỏ và vẫn có lời nhắn rõ."
      >
        <div className="flex flex-wrap items-center gap-3">
          <MenuDemo />
          <Labeled label="Menu tài khoản">
            <AccountMenuDemo />
          </Labeled>
        </div>
      </Section>

      <Section
        title="Chú thích"
        description="Chỉ là phần bổ sung cho người dùng chuột và bàn phím. Mọi nút chỉ có biểu tượng vẫn có nhãn đọc màn hình riêng."
      >
        <TooltipDemo />
      </Section>
    </>
  );
}
