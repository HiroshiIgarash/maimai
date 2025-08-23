"use client";
import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  // eslint-disable-next-line no-var
  var lv15_rslt: string[][];
  // eslint-disable-next-line no-var
  var lv14_rslt: string[][];
  // eslint-disable-next-line no-var
  var lv13_rslt: string[][];
  // eslint-disable-next-line no-var
  var lv12_rslt: string[][];
  // eslint-disable-next-line no-var
  var lv11_rslt: string[][];
  // eslint-disable-next-line no-var
  var lv10_rslt: string[][];
  // eslint-disable-next-line no-var
  var lv9_rslt: string[][];
  // eslint-disable-next-line no-var
  var lv8_rslt: string[][];
  // eslint-disable-next-line no-var
  var lv7_rslt: string[][];
  // eslint-disable-next-line no-var
  var lv6_rslt: string[][];
  // eslint-disable-next-line no-var
  var lv5_rslt: string[][];
}

interface MusicData {
  title: string;
  level: number;
  isDx: boolean;
  isNew: boolean;
  difficulty: "r" | "m" | "e";
}

function parseMaimaiData(): { r: MusicData[]; m: MusicData[]; e: MusicData[] } {
  const result: { r: MusicData[]; m: MusicData[]; e: MusicData[] } = { 
    r: [], 
    m: [], 
    e: [] 
  };

  const levelArrays = [
    lv15_rslt, lv14_rslt, lv13_rslt, lv12_rslt, lv11_rslt,
    lv10_rslt, lv9_rslt, lv8_rslt, lv7_rslt, lv6_rslt, lv5_rslt
  ];

  levelArrays.forEach((lv_rslt, index) => {
    const mainLevel = 15 - index;
    lv_rslt.forEach((subList, subIndex) => {
      const level = (mainLevel * 10 - subIndex) / 10;
      subList.forEach((item) => {
        const textMatch = item.match(/'>((.|\n)*?)<\/span>/);
        const text = textMatch?.[1];
        if (!text) return;

        const title = text.endsWith("[dx]") ? text.slice(0, -4) : text;
        const isDx = text.endsWith("[dx]");

        const classMatch = item.match(/<span class='(.*?)'>/);
        const className = classMatch?.[1];
        if (!className) return;

        const diff = className[3] as "r" | "m" | "e";
        const isNew = className.endsWith("_n");

        if (diff === "r" || diff === "m" || diff === "e") {
          result[diff].push({
            title,
            level,
            isDx,
            isNew,
            difficulty: diff,
          });
        }
      });
    });
  });

  return result;
}

const RealLevelData = () => {
  const [musicData, setMusicData] = useState<{ r: MusicData[]; m: MusicData[]; e: MusicData[] } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isLoaded && window.lv15_rslt) {
      try {
        const parsed = parseMaimaiData();
        setMusicData(parsed);
      } catch (error) {
        console.error("Failed to parse maimai data:", error);
      }
    }
  }, [isLoaded]);

  const handleScriptLoad = () => {
    setIsLoaded(true);
  };

  if (!musicData) {
    return (
      <>
        <Script 
          src="https://sgimera.github.io/mai_RatingAnalyzer/scripts_maimai/maidx_in_lv_data_prismplus.js" 
          onLoad={handleScriptLoad}
        />
        <div>Loading music data...</div>
      </>
    );
  }

  return (
    <>
      <Script 
        src="https://sgimera.github.io/mai_RatingAnalyzer/scripts_maimai/maidx_in_lv_data_prismplus.js" 
        onLoad={handleScriptLoad}
      />
      <div id="music-data" style={{ display: 'none' }}>
        {JSON.stringify(musicData)}
      </div>
    </>
  );
};

export default RealLevelData;
