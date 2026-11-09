"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Uuid } from "@/lib/api/types";
import { useComposer } from "../hooks/use-composer";
import { useOpenConversation } from "../hooks/use-open-conversation";
import { Composer } from "./composer";

interface FirstMessageDialogProps {
  listingId: Uuid;
  listingTitle: string;
  /** The name from the listing, or "Chủ trọ" when the landlord has none. */
  landlordName: string;
  /** The inbox of the sender, where the new conversation lives (`<basePath>/<id>`). */
  basePath: string;
}

/**
 * The button "Nhắn cho chủ trọ" and the dialog for the first message (spec 0012, AC-4). The
 * button is the dialog's own trigger, so closing the dialog gives focus back to it.
 *
 * The message box state is kept here, around `Dialog`, and not inside `DialogContent`: Radix
 * removes the content when the dialog closes, which would throw the draft away.
 */
export function FirstMessageDialog({
  listingId,
  listingTitle,
  landlordName,
  basePath,
}: FirstMessageDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const composer = useComposer();
  const opening = useOpenConversation(listingId);

  // The cache is already written when this resolves. Then the dialog closes and the page moves
  // to the conversation. A failure rejects, and the composer shows it with the draft kept.
  const send = async (body: string) => {
    const { conversation } = await opening.mutateAsync(body);
    setOpen(false);
    router.push(`${basePath}/${conversation.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="lg">
          Nhắn cho chủ trọ
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nhắn cho chủ trọ</DialogTitle>
          <DialogDescription>
            Gửi tin cho {landlordName} về “{listingTitle}”.
          </DialogDescription>
        </DialogHeader>
        <Composer
          composer={composer}
          onSend={send}
          placeholder="Phòng còn trống không ạ?"
        />
      </DialogContent>
    </Dialog>
  );
}
