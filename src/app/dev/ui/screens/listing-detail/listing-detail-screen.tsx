"use client";

import { CheckIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ImagePlaceholder } from "@/components/states/image-placeholder";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SITE_NAME } from "@/lib/site";
import { LISTING_DETAIL } from "../sample-data";
import {
  feeKindLabel,
  formatArea,
  formatCount,
  formatDateOnly,
  formatDateTime,
  formatFee,
  formatMoney,
  formatPhone,
} from "../sample-format";
import { ChoiceGroup, SampleControls } from "../sample-state";
import { SCREENS_HOME } from "../screens";

type Viewer = "guest" | "user";

const VIEWERS: readonly { value: Viewer; label: string }[] = [
  { value: "guest", label: "Khách" },
  { value: "user", label: "Đã đăng nhập" },
];

const LISTINGS_HREF = `${SCREENS_HOME}/listings`;
const SIGN_IN_HREF = `${SCREENS_HOME}/sign-in`;

// What `GET /listings/:slugCode` answers: a guest gets `landlord.phone` as null (api-for-frontend.md,
// 6.20), and the page swaps the number for a sign in button.
const detailFor = (viewer: Viewer) =>
  viewer === "user"
    ? LISTING_DETAIL
    : {
        ...LISTING_DETAIL,
        landlord: { ...LISTING_DETAIL.landlord, phone: null },
      };

const NOT_SET = "Chưa ghi";

// Public screen: a listing in full. On a phone the contact card comes right after the headline,
// so the call to action is near the top; from `lg` it moves to a sticky column on the right.
export function ListingDetailScreen() {
  const [viewer, setViewer] = useState<Viewer>("guest");
  const listing = detailFor(viewer);
  const { landlord, property } = listing;
  const landlordName = landlord.name ?? "Chủ trọ";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:px-6">
      <SampleControls>
        <ChoiceGroup
          label="Người xem"
          options={VIEWERS}
          value={viewer}
          onChange={setViewer}
        />
      </SampleControls>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={LISTINGS_HREF}>Tìm trọ</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>{listing.ward.name}</BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <BreadcrumbPage className="truncate">
              {listing.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-2 lg:col-start-1">
          <ImagePlaceholder ratio="16:9" className="[&_svg]:size-16" />
          <p className="text-sm text-muted-foreground">
            Tin này chưa có ảnh. Chủ trọ có thể thêm ảnh sau khi đăng.
          </p>
        </div>

        <section
          aria-labelledby="listing-title"
          className="flex flex-col gap-4 lg:col-start-1"
        >
          <div className="flex flex-col gap-2">
            <h1 id="listing-title">{listing.title}</h1>
            <p className="flex items-start gap-1.5 text-muted-foreground">
              <MapPinIcon aria-hidden="true" className="mt-1 size-4 shrink-0" />
              {listing.fullAddress}
            </p>
          </div>
          <p className="text-2xl font-semibold text-primary">
            {formatMoney(listing.price)}
            <span className="text-base font-normal text-muted-foreground">
              {" "}
              mỗi tháng
            </span>
          </p>
          <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-4 sm:grid-cols-4">
            <Fact label="Diện tích" value={formatArea(listing.areaM2)} />
            <Fact
              label="Tiền cọc"
              value={
                listing.deposit === null
                  ? NOT_SET
                  : formatMoney(listing.deposit)
              }
            />
            <Fact
              label="Vào ở từ"
              value={
                listing.availableFrom === null
                  ? NOT_SET
                  : formatDateOnly(listing.availableFrom)
              }
            />
            <Fact label="Lượt xem" value={formatCount(listing.viewCount)} />
          </dl>
        </section>

        <aside
          aria-label="Liên hệ chủ trọ"
          className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:self-start"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarFallback>
                    {landlordName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <CardTitle>
                    <h2 className="truncate text-lg">{landlordName}</h2>
                  </CardTitle>
                  <CardDescription>
                    Đăng tin ngày {formatDateTime(listing.createdAt)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {landlord.phone === null ? (
                <>
                  <Button asChild size="lg">
                    <Link href={SIGN_IN_HREF}>
                      Đăng nhập để xem số điện thoại
                    </Link>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Số điện thoại của chủ trọ chỉ hiện với người đã đăng nhập.
                  </p>
                </>
              ) : (
                <>
                  <Button asChild size="lg">
                    <a href={`tel:${landlord.phone}`}>
                      <PhoneIcon data-icon="inline-start" />
                      {formatPhone(landlord.phone)}
                    </a>
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Khi gọi, bạn hãy nói đã thấy tin này trên {SITE_NAME}.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </aside>

        <section
          aria-labelledby="description-title"
          className="flex flex-col gap-3 lg:col-start-1"
        >
          <h2 id="description-title" className="text-xl md:text-2xl">
            Mô tả
          </h2>
          {/* Plain text from the API: shown as text, with its line breaks, never as HTML. */}
          <p className="max-w-prose whitespace-pre-line">
            {listing.description}
          </p>
        </section>

        <section
          aria-labelledby="property-title"
          className="flex flex-col gap-5 lg:col-start-1"
        >
          <h2 id="property-title" className="text-xl md:text-2xl">
            Nhà trọ
          </h2>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg md:text-lg">{property.name}</h3>
            <p className="text-sm text-muted-foreground">
              {property.fullAddress}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-base md:text-base">
              Các khoản phí ngoài tiền thuê
            </h3>
            <dl className="divide-y rounded-xl border bg-card">
              {property.fees.map((fee) => (
                <div
                  key={fee.kind}
                  className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <dt className="font-medium">{feeKindLabel(fee.kind)}</dt>
                  <dd className="text-sm sm:text-right">
                    {formatFee(fee)}
                    {fee.note !== null && (
                      <span className="block text-muted-foreground">
                        {fee.note}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-base md:text-base">Tiện ích</h3>
            <ul className="flex flex-wrap gap-2">
              {property.amenities.map((amenity) => (
                <li key={amenity.key}>
                  <Badge variant="secondary">
                    <CheckIcon data-icon="inline-start" />
                    {amenity.name}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
