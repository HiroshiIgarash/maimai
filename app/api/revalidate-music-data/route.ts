import { revalidateMusicDataCache } from "@/app/utils/functions";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // キャッシュをクリア
    await revalidateMusicDataCache();
    console.log("Music data cache revalidated");

    return NextResponse.json({
      success: true,
      message: "Music data cache has been revalidated successfully",
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to revalidate cache" },
      { status: 500 }
    );
  }
}
