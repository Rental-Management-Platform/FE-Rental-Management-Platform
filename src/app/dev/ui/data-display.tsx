"use client";

import { EllipsisIcon, EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ListPagination } from "@/components/list-pagination";
import { ImagePlaceholder } from "@/components/states/image-placeholder";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Labeled, Section } from "./section";

const VND = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

type SampleStatus = "visible" | "hidden_by_owner" | "hidden_by_admin" | "limit";

const STATUS_BADGE: Record<
  SampleStatus,
  {
    label: string;
    variant: "success" | "secondary" | "destructive" | "warning";
  }
> = {
  visible: { label: "Đang hiển thị", variant: "success" },
  hidden_by_owner: { label: "Chủ trọ đã ẩn", variant: "secondary" },
  hidden_by_admin: { label: "Admin đã ẩn", variant: "destructive" },
  limit: { label: "Chưa công khai", variant: "warning" },
};

// Fixed sample rows shaped like GET /me/listings; nothing here comes from the network.
const ROWS: {
  id: string;
  title: string;
  price: number;
  area: number;
  status: SampleStatus;
  views: number;
}[] = [
  {
    id: "1",
    title: "Phòng trọ gần Đại học Bách Khoa, có gác lửng, giờ giấc tự do",
    price: 2_500_000,
    area: 22,
    status: "visible",
    views: 1284,
  },
  {
    id: "2",
    title: "Căn hộ mini đường Lê Văn Việt, phường Hiệp Phú",
    price: 4_800_000,
    area: 35,
    status: "visible",
    views: 412,
  },
  {
    id: "3",
    title: "Giường ký túc xá Quận 1",
    price: 850_000,
    area: 8,
    status: "hidden_by_owner",
    views: 96,
  },
  {
    id: "4",
    title: "Nhà nguyên căn Thủ Đức, hẻm xe hơi",
    price: 9_000_000,
    area: 60,
    status: "hidden_by_admin",
    views: 33,
  },
  {
    id: "5",
    title: "Phòng có ban công, yên tĩnh, gần chợ",
    price: 3_200_000,
    area: 25,
    status: "limit",
    views: 0,
  },
];

function CardsSection() {
  return (
    <Section
      title="Thẻ"
      description="Bố cục đầy đủ: tiêu đề, mô tả, hành động ở góc, nội dung và chân thẻ. Viền mảnh và đổ bóng nhẹ, thẻ nhỏ dùng khi dày."
    >
      <div className="grid gap-6 md:grid-cols-3">
        <Labeled label="Thẻ đầy đủ">
          <Card>
            <CardHeader>
              <CardTitle>Nhà trọ Hồng Nhung</CardTitle>
              <CardDescription>
                Đường Lê Văn Việt, phường Hiệp Phú
              </CardDescription>
              <CardAction>
                <Badge variant="success">Đang hiển thị</Badge>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p>
                12 phòng, còn trống 3 phòng. Giá từ {VND.format(2_500_000)} mỗi
                tháng.
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">Xem tin</Button>
              <Button size="sm" variant="outline">
                Sửa
              </Button>
            </CardFooter>
          </Card>
        </Labeled>

        <Labeled label="Thẻ tin (khung ảnh trống)">
          <Card className="pt-0">
            <ImagePlaceholder ratio="16:9" className="rounded-none" />
            <CardHeader>
              <CardTitle className="line-clamp-2">
                Phòng trọ gần Đại học Bách Khoa, có gác lửng, giờ giấc tự do
              </CardTitle>
              <CardDescription>22 m² · Phường Hiệp Phú</CardDescription>
            </CardHeader>
            <CardFooter>
              <p className="text-lg font-semibold text-primary">
                {VND.format(2_500_000)}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / tháng
                </span>
              </p>
            </CardFooter>
          </Card>
        </Labeled>

        <Labeled label='size="sm"'>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Gói Cơ bản</CardTitle>
              <CardDescription>Tối đa 5 tin, 30 ngày</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{VND.format(99_000)}</p>
            </CardContent>
            <CardFooter>
              <Button size="sm" className="w-full">
                Mua
              </Button>
            </CardFooter>
          </Card>
        </Labeled>
      </div>
    </Section>
  );
}

function AvatarsSection() {
  return (
    <Section
      title="Ảnh đại diện"
      description="Luôn có chữ cái dự phòng (chữ đầu của tên, hoặc của email). Chấm trạng thái chỉ là điểm nhấn, không mang ý nghĩa một mình."
    >
      <div className="flex flex-wrap items-center gap-6">
        <Labeled label='size="sm"'>
          <Avatar size="sm">
            <AvatarFallback>N</AvatarFallback>
          </Avatar>
        </Labeled>
        <Labeled label="mặc định">
          <Avatar>
            <AvatarFallback>N</AvatarFallback>
          </Avatar>
        </Labeled>
        <Labeled label='size="lg"'>
          <Avatar size="lg">
            <AvatarFallback>H</AvatarFallback>
          </Avatar>
        </Labeled>
        <Labeled label="có chấm">
          <Avatar size="lg">
            <AvatarFallback>Đ</AvatarFallback>
            <AvatarBadge />
          </Avatar>
        </Labeled>
      </div>
    </Section>
  );
}

function BreadcrumbSection() {
  return (
    <Section title="Đường dẫn trang">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dev/ui">Trang chủ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dev/ui">Phường Hiệp Phú</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Phòng trọ gần Đại học Bách Khoa</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </Section>
  );
}

function TabsSection() {
  return (
    <Section
      title="Thẻ chuyển (tab)"
      description="Mũi tên trái phải chuyển giữa các thẻ, Tab nhảy vào nội dung. Ở màn hình hẹp, hàng thẻ tự cuộn ngang trong khung của nó."
    >
      <div className="flex flex-col gap-8">
        <Labeled label='variant="default"'>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="visible">Đang hiển thị</TabsTrigger>
              <TabsTrigger value="hidden">Đã ẩn</TabsTrigger>
              <TabsTrigger value="deleted" disabled>
                Đã xóa
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <p className="text-muted-foreground">Cả năm tin của bạn.</p>
            </TabsContent>
            <TabsContent value="visible">
              <p className="text-muted-foreground">Hai tin khách đang thấy.</p>
            </TabsContent>
            <TabsContent value="hidden">
              <p className="text-muted-foreground">
                Hai tin đã ẩn, một do admin.
              </p>
            </TabsContent>
          </Tabs>
        </Labeled>

        <Labeled label='variant="line"'>
          <Tabs defaultValue="all">
            <TabsList variant="line">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              <TabsTrigger value="visible">Đang hiển thị</TabsTrigger>
              <TabsTrigger value="hidden_by_owner">Chủ trọ đã ẩn</TabsTrigger>
              <TabsTrigger value="hidden_by_admin">Admin đã ẩn</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <p className="text-muted-foreground">Cả năm tin của bạn.</p>
            </TabsContent>
            <TabsContent value="visible">
              <p className="text-muted-foreground">Hai tin khách đang thấy.</p>
            </TabsContent>
            <TabsContent value="hidden_by_owner">
              <p className="text-muted-foreground">Một tin bạn đã ẩn.</p>
            </TabsContent>
            <TabsContent value="hidden_by_admin">
              <p className="text-muted-foreground">Một tin bị admin ẩn.</p>
            </TabsContent>
          </Tabs>
        </Labeled>
      </div>
    </Section>
  );
}

function RowActions({ title }: { title: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Thao tác với tin ${title}`}
        >
          <EllipsisIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <EyeIcon />
            Xem tin
          </DropdownMenuItem>
          <DropdownMenuItem>
            <PencilIcon />
            Sửa tin
          </DropdownMenuItem>
        </DropdownMenuGroup>
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

function TableSection() {
  return (
    <Section
      title="Bảng"
      description="Dòng cao khoảng 44 px, tiêu đề dòng nền xám nhạt. Dòng được chọn dùng màu accent. Bảng rộng hơn màn hình thì cuộn ngang trong khung của nó, trang không bị kéo ngang."
    >
      <Table>
        <TableCaption className="sr-only">
          Danh sách tin đăng mẫu của chủ trọ
        </TableCaption>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Tin đăng</TableHead>
            <TableHead className="text-right">Giá thuê</TableHead>
            <TableHead className="text-right">Diện tích</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Lượt xem</TableHead>
            <TableHead>
              <span className="sr-only">Thao tác</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row, index) => (
            <TableRow
              key={row.id}
              data-state={index === 1 ? "selected" : undefined}
            >
              <TableCell
                className="max-w-72 min-w-56 truncate font-medium"
                title={row.title}
              >
                {row.title}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {VND.format(row.price)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {row.area} m²
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_BADGE[row.status].variant}>
                  {STATUS_BADGE[row.status].label}
                </Badge>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {new Intl.NumberFormat("vi-VN").format(row.views)}
              </TableCell>
              <TableCell className="w-12 text-right">
                <RowActions title={row.title} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Section>
  );
}

function PaginationDemo() {
  const [page, setPage] = useState(3);
  const [largePage, setLargePage] = useState(1);

  return (
    <Section
      title="Phân trang"
      description="Nhận { page, pageSize, total } của danh sách. Dạng liên kết khi trang nằm trên địa chỉ, dạng nút khi trang nằm trong state. Dưới sm chỉ còn mũi tên và “Trang 3/10”."
    >
      <div className="flex flex-col gap-8">
        <Labeled label="hrefFor · 37 tin, 2 trang">
          <ListPagination
            page={1}
            pageSize={20}
            total={37}
            itemLabel="tin"
            hrefFor={(target) => `#trang-${target}`}
          />
        </Labeled>

        <Labeled label="onPageChange · 400 người dùng, 20 trang">
          <ListPagination
            page={page}
            pageSize={20}
            total={400}
            itemLabel="người dùng"
            onPageChange={setPage}
          />
        </Labeled>

        <Labeled label='size="lg" · cho trang công khai, 44 px'>
          <ListPagination
            page={largePage}
            pageSize={20}
            total={137}
            size="lg"
            onPageChange={setLargePage}
          />
        </Labeled>

        <Labeled label="trang quá cuối · API trả danh sách rỗng, vẫn có đường về trang cuối">
          <ListPagination
            page={5}
            pageSize={20}
            total={37}
            itemLabel="tin"
            hrefFor={(target) => `#trang-${target}`}
          />
        </Labeled>

        <Labeled label="một trang · không hiện gì">
          <ListPagination
            page={1}
            pageSize={20}
            total={12}
            hrefFor={(target) => `#trang-${target}`}
          />
        </Labeled>
      </div>
    </Section>
  );
}

// Cards, avatars, breadcrumb, tabs, table and pagination of milestone M3.
export function DataDisplaySection() {
  return (
    <>
      <CardsSection />
      <AvatarsSection />
      <BreadcrumbSection />
      <TabsSection />
      <TableSection />
      <PaginationDemo />
    </>
  );
}
