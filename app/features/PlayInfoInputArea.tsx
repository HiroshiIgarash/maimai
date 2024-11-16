"use client"

import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { updatePlayInfo } from "../actions/actions"
import { Button } from "@/components/ui/button"
import React from "react"

const PlayInfoInputArea = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast()

  const handleCopyButtonClick = () => {
    const text = children?.toString()
    handleCopyText(text)
    toast({ description: "スクリプトをコピーしました" })
  }

  const handleCopyText = (text?: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p>maimai netにログインし、楽曲プレイデータを取得してください</p>
        <Button asChild variant="outline">
          <Link href="https://maimaidx.jp/maimai-mobile/" target="_blank">maimai netログイン</Link>
        </Button>
        <Button variant={"ghost"} onClick={handleCopyButtonClick}>スクリプトをコピーする</Button>
      </div>
      <form className="space-y-4" action={async (formData: FormData) => {
        try {
          const path = await updatePlayInfo(formData)
          toast({ description: "登録に成功しました" + path })
        } catch (e) {
          const message = e instanceof Error ? e.message : ""
          toast({
            description: `登録に失敗しました...${message}`,
            variant: "destructive"
          })
        }
      }}>
        <Textarea name="rawPlayData" className="h-56" />
        <Button>登録</Button>
      </form>
    </div>
  )
}

export default PlayInfoInputArea