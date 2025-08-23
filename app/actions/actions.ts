"use server";

import { writeFileSync } from "fs";
import { revalidatePath } from "next/cache";
import { join } from "path";
import { z } from "zod";

const PlayInfoSchema = z.object({
  name: z.string(),
  score: z.number(),
  displayLevel: z.number(),
  isDx: z.boolean(),
});
const AllDifficultyPlayInfoSchema = z.object({
  e: z.array(PlayInfoSchema),
  m: z.array(PlayInfoSchema),
  r: z.array(PlayInfoSchema),
});

export const updatePlayInfo = async (formData: FormData) => {
  const rawPlayData = formData.get("rawPlayData");

  if (rawPlayData === null) throw new Error("Internal Server Error");

  try {
    JSON.parse(rawPlayData.toString());
  } catch {
    console.log("JSONにフォーマットできませんでした");
    throw new Error("JSONにフォーマットできませんでした");
  }
  const parsedPlayDataToJSON = JSON.parse(rawPlayData.toString());
  const data = AllDifficultyPlayInfoSchema.safeParse(parsedPlayDataToJSON);
  if (data.error) {
    console.log("フォーマット形式が不正です");
    throw new Error("フォーマット形式が不正です");
  }
  writeFileSync(
    join(__dirname, "../../../app/utils/playInfo.json"),
    rawPlayData.toString()
  );

  revalidatePath("/");

  return join(__dirname, "../../../app/utils/playInfo.json");
};
