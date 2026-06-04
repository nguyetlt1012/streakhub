"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  generateTelegramLinkAction,
  unlinkTelegramAction,
} from "@/server/actions/telegram";

type TelegramSettingsProps = {
  linked: boolean;
  linkedAt: Date | null;
  configured: boolean;
};

export function TelegramSettings({
  linked,
  linkedAt,
  configured,
}: TelegramSettingsProps) {
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generateTelegramLinkAction();
      if (result.error) {
        setError(result.error);
        setLinkUrl(null);
        return;
      }
      setLinkUrl(result.linkUrl ?? null);
    });
  }

  function handleUnlink() {
    setError(null);
    startTransition(async () => {
      const result = await unlinkTelegramAction();
      if (result.error) {
        setError(result.error);
        return;
      }
      setLinkUrl(null);
      window.location.reload();
    });
  }

  if (!configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Telegram</CardTitle>
          <CardDescription>
            Set TELEGRAM_BOT_TOKEN and TELEGRAM_BOT_USERNAME on the server to
            enable linking.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Telegram</CardTitle>
        <CardDescription>
          Get daily reminders and streak alerts. Check-ins stay on the web app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {linked ? (
          <div className="space-y-3">
            <p className="text-sm text-primary">Telegram is linked.</p>
            {linkedAt ? (
              <p className="text-xs text-muted-foreground">
                Linked {linkedAt.toLocaleString()}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={handleUnlink}
              disabled={pending}
            >
              Unlink Telegram
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Not linked yet.</p>
            <Button type="button" onClick={handleGenerate} disabled={pending}>
              {pending ? "Generating..." : "Generate link"}
            </Button>
            {linkUrl ? (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="font-medium">Open this link in Telegram:</p>
                <a
                  href={linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-primary underline-offset-4 hover:underline"
                >
                  {linkUrl}
                </a>
                <p className="text-xs text-muted-foreground">
                  Expires in 15 minutes. Tap Start in the bot to connect.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
