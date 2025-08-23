"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function RevalidateButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>("");

  const handleRevalidate = async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/revalidate-music-data", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        setMessage("✅ 譜面定数データを更新しました");
        // 1.5秒後にページをリロード
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage("❌ 更新に失敗しました");
      }
    } catch (error) {
      console.error("Revalidation error:", error);
      setMessage("❌ 更新に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleRevalidate}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="w-fit"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
        {isLoading ? "更新中..." : "譜面定数データを更新"}
      </Button>
      {message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}