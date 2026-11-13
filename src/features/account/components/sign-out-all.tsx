"use client";

import { CircleAlertIcon, LogOutIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertTitle } from "@/components/ui/alert";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { isAbortError } from "@/lib/api/abort";
import { describeError } from "@/lib/api/errors";
import { useSessionActions } from "@/lib/session/auth-provider";

// Sign out of every device (api-for-frontend.md, 6.5). A zone of its own, with a confirm, because
// it ends the session in use as well and the person has to sign in again. When the call works the
// session becomes a guest and the gate of the page moves the person to the sign in page, so this
// does not navigate. When it fails the session is left as it is and the dialog says so: the other
// devices are still signed in, and saying otherwise would be wrong.
export function SignOutAll() {
  const { signOutAll } = useSessionActions();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // State lags a render behind a fast second click, so a ref guards the request itself.
  const inFlight = useRef(false);

  const confirm = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setMessage(null);
    try {
      await signOutAll();
      toast.success("Đã đăng xuất khỏi mọi thiết bị");
    } catch (error) {
      if (!isAbortError(error)) setMessage(describeError(error).message);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return (
    <Card role="group" aria-labelledby="sign-out-all-title">
      <CardHeader className="border-b">
        <CardTitle>
          <h2 id="sign-out-all-title" className="text-base">
            Thiết bị đang đăng nhập
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Dùng khi bạn mất thiết bị hoặc quên đăng xuất ở một máy lạ. Bạn sẽ bị
          đăng xuất ở mọi nơi, kể cả thiết bị này.
        </p>
        <AlertDialog
          open={open}
          // Escape and the backdrop must not close it while the request runs.
          onOpenChange={(next) => {
            if (pending && !next) return;
            if (next) setMessage(null);
            setOpen(next);
          }}
        >
          <div>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" size="lg">
                <LogOutIcon data-icon="inline-start" />
                Đăng xuất mọi thiết bị
              </Button>
            </AlertDialogTrigger>
          </div>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Đăng xuất khỏi mọi thiết bị?</AlertDialogTitle>
              <AlertDialogDescription>
                Mọi thiết bị đang dùng tài khoản này, kể cả thiết bị này, sẽ bị
                đăng xuất và phải đăng nhập lại.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {message !== null && (
              <Alert variant="destructive">
                <CircleAlertIcon />
                <AlertTitle>{message}</AlertTitle>
              </Alert>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel size="lg" disabled={pending}>
                Ở lại
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                size="lg"
                disabled={pending}
                onClick={(event) => {
                  // The default of the action is to close. The page moves on when the answer
                  // comes, and a failure keeps the dialog open to say so.
                  event.preventDefault();
                  void confirm();
                }}
              >
                {pending && <Spinner size="sm" aria-hidden="true" />}
                {pending ? "Đang đăng xuất" : "Đăng xuất mọi thiết bị"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
