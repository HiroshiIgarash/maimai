"use client";
import { Button } from "@/components/ui/button";
import Script from "next/script";

function parseMaimaiData() {
  const result: {
    r: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    m: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    e: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
  } = { r: [], m: [], e: [] };

  [
    lv15_rslt,
    lv14_rslt,
    lv13_rslt,
    lv12_rslt,
    lv11_rslt,
    lv10_rslt,
    lv9_rslt,
    lv8_rslt,
    lv7_rslt,
    lv6_rslt,
    lv5_rslt,
  ].forEach((lv_rslt, index) => {
    const mainLevel = 15 - index;
    lv_rslt.forEach((subLslt, index) => {
      const level = (mainLevel * 10 - index) / 10;
      subLslt.forEach((item) => {
        const textMatch = item.match(/'>((.|\n)*?)<\/span>/);
        const text = textMatch?.[1];
        if (!text) return;
        const title = text.endsWith("[dx]") ? text.slice(0, -4) : text;
        const isDx = text.endsWith("[dx]");

        const classMatch = item.match(/<span class='(.*?)'>/);
        const className = classMatch?.[1];
        if (!className) return;
        const diff = className[3] as keyof typeof result;
        const isNew = className.endsWith("_n");

        if (diff === "r" || diff === "m" || diff === "e") {
          result[diff].push({
            title,
            level,
            isDx,
            isNew,
          });
        }
      });
    });
  });

  return result;
}
const Page = () => {
  const handleClick = async () => {
    console.log(lv15_rslt);
    const parsedData = parseMaimaiData();
    console.log(parsedData);
  };
  return (
    <>
      <Script src="https://sgimera.github.io/mai_RatingAnalyzer/scripts_maimai/maidx_in_lv_data_prismplus.js" />
      <Button onClick={handleClick}>かいせき</Button>
    </>
  );
};

export default Page;
