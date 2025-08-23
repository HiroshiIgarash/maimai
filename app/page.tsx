import fs from "fs";
import PlayInfoInputArea from "./features/PlayInfoInputArea";
import PlayInfoTable from "./features/PlayInfoTable";
import { fetchMusicData } from "./utils/functions";
import { join } from "path";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const musicData = await fetchMusicData();

  const scriptString = fs
    .readFileSync(join(__dirname, "../../../app/browser/script.js"))
    .toString();

  return (
    <>
      <div className="container mx-auto px-4 space-y-4 py-16">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          maimaiスコア計測
        </h1>
        譜面定数の参考ページは
        <Button asChild variant={"link"}>
          <Link
            href="https://sgimera.github.io/mai_RatingAnalyzer/maidx_inner_level_24_prismplus.html"
            target="_blank"
          >
            こちら
          </Link>
        </Button>
        <div>
          <PlayInfoInputArea>{scriptString}</PlayInfoInputArea>
        </div>
        <div>
          <PlayInfoTable musicData={musicData} />
        </div>
      </div>
    </>
  );
}
