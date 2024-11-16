import fs from "fs";
import PlayInfoInputArea from "./features/PlayInfoInputArea";
import PlayInfoTable from "./features/PlayInfoTable";
import { fetchHTMLDocument } from "./utils/functions";
import { join } from "path";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { headers } from "next/headers";



export default async function Home() {
  const domain = headers().get('x-url') || "";
  const REAL_LEVEL_TABLE_URL = `${domain}browser/table/`
  const tableDocument = await fetchHTMLDocument(REAL_LEVEL_TABLE_URL)


  const scriptString = fs.readFileSync(join(__dirname, "../../../app/browser/script.js")).toString()

  return (
    <>
      <div className="container mx-auto px-4 space-y-4 py-16">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          maimaiスコア計測
        </h1>
        譜面定数の参考ページは
        <Button asChild variant={"link"}>
          <Link href="https://sgimera.github.io/mai_RatingAnalyzer/maidx_inner_level_23_prism.html" target="_blank">
            こちら
          </Link>
        </Button>
        <div>
          <PlayInfoInputArea>{scriptString}</PlayInfoInputArea>
        </div>
        <div>
          <PlayInfoTable tableDocument={tableDocument} />
        </div>
      </div>
    </>
  );
}
