"use client";

import { useQuery } from "@tanstack/react-query";
import { CircleAlertIcon, ImagePlusIcon } from "lucide-react";
import { useId, useRef } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { mediaUrl } from "@/lib/media";
import { useApi } from "@/lib/session/auth-provider";
import { savedImages } from "../api/listing-images";
import { ownerListingQuery } from "../api/owner-listing";
import { usePhotoUploads } from "../hooks/use-photo-uploads";
import {
  ACCEPT_ATTRIBUTE,
  MAX_PHOTOS,
  skippedText,
} from "../schemas/photo-rules";
import { PhotoTile } from "./photo-tile";

// The photo zone of a listing (spec 0007). It sits outside the listing form and saves each photo
// the moment it is uploaded, so it never changes the form's dirty state. The saved photos are
// read from the same cache entry as the page (`["listing","mine",id]`), which the page has
// already loaded: this reader never asks the server on its own.
export function ListingPhotos({ listingId }: { listingId: string }) {
  const api = useApi();
  const titleId = useId();
  const helpId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: images = [] } = useQuery({
    ...ownerListingQuery(api, listingId),
    staleTime: Infinity,
    select: savedImages,
  });
  const { items, skipped, notice, enqueue } = usePhotoUploads(
    listingId,
    images.length,
  );
  const isFull = images.length >= MAX_PHOTOS;

  return (
    <Card role="group" aria-labelledby={titleId}>
      <CardHeader className="border-b">
        {/* The count shares the title row, so the line below keeps the full width on a phone. */}
        <CardTitle className="flex items-baseline justify-between gap-3">
          <h2 id={titleId} className="text-base">
            Ảnh của tin
          </h2>
          <span className="text-sm font-normal text-muted-foreground">
            {images.length} trên {MAX_PHOTOS} ảnh
          </span>
        </CardTitle>
        <CardDescription>
          Ảnh được lưu ngay khi tải lên, bạn không cần bấm Lưu.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {notice !== null && (
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}
        {images.length + items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tin chưa có ảnh. Hãy thêm ảnh để người thuê thấy phòng.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {images.map((image, index) => (
              <PhotoTile
                key={image.id}
                kind="saved"
                src={mediaUrl(image.url)}
                alt={`Ảnh ${index + 1} của tin`}
                isCover={index === 0}
                label={index === 0 ? "Ảnh bìa" : `Ảnh ${index + 1}`}
              />
            ))}
            {items.map((item, index) => (
              <PhotoTile
                key={item.localId}
                kind="pending"
                src={item.previewUrl}
                // The place it will take once it is saved.
                alt={`Ảnh ${images.length + index + 1} của tin`}
                status={item.status}
                fileName={item.file.name}
              />
            ))}
          </ul>
        )}
        {isFull ? (
          <p className="text-sm text-muted-foreground">
            Đã đủ {MAX_PHOTOS} ảnh. Hãy xóa bớt một ảnh trước nếu muốn thêm.
          </p>
        ) : (
          <div className="flex flex-col items-start gap-2">
            {/* Kept in the DOM and out of the tab order: the button below is the control. */}
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT_ATTRIBUTE}
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
              onChange={(event) => {
                // The list is copied first, because clearing the value empties it.
                enqueue(Array.from(event.target.files ?? []));
                // So the same file can be picked again.
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="lg"
              aria-describedby={helpId}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlusIcon aria-hidden="true" />
              Thêm ảnh
            </Button>
            <p id={helpId} className="text-sm text-muted-foreground">
              JPEG, PNG hoặc WebP, mỗi ảnh tối đa 5 MiB, tối đa {MAX_PHOTOS}{" "}
              ảnh. Ảnh được giữ nguyên thông tin kèm theo, như vị trí chụp nếu
              máy có ghi.
            </p>
          </div>
        )}
        <div aria-live="polite">
          {skipped.length > 0 && (
            <div className="flex flex-col gap-1 text-sm">
              <p className="font-medium">Một số ảnh chưa được thêm:</p>
              <ul className="list-disc pl-5">
                {skipped.map((file, index) => (
                  <li key={`${file.name}-${index}`}>{skippedText(file)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
