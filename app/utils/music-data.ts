/**
 * 楽曲データ取得・パース機能
 *
 * 外部のJavaScriptファイルから楽曲の譜面定数データを取得し、
 * HTMLパースを行って構造化されたデータに変換する機能を提供します。
 *
 * 主な機能：
 * - 外部スクリプトからの配列データ抽出
 * - HTMLスパンタグからの楽曲情報パース
 * - 楽曲データの取得とキャッシュ機能
 */

import { unstable_cache, revalidateTag } from "next/cache";
import { MusicDataByDifficulty, ParsedMusicItem, LevelConfig, MusicInfo } from "./types/type";

/**
 * JSファイル内の配列データを文字列として抽出する
 */
export const extractArrayFromScript = (
  /** JSファイルの内容 */
  scriptText: string,
  /** 抽出したい変数名（例：'lv15_rslt'） */
  variableName: string
): string[][] => {
  try {
    // const lv15_rslt = [...]; の形式で配列データを抽出
    const regex = new RegExp(
      `const\\s+${variableName}\\s*=\\s*(\\[[\\s\\S]*?\\n\\];)`,
      "gm"
    );
    const match = scriptText.match(regex);

    if (!match || !match[0]) {
      console.warn(`Variable ${variableName} not found in script`);
      return [];
    }

    // 配列部分だけを抽出
    const arrayMatch = match[0].match(/\[([\s\S]*?)\];/);
    if (!arrayMatch) {
      console.warn(`Array content for ${variableName} not found`);
      return [];
    }

    const arrayContent = "[" + arrayMatch[1] + "]";
    return eval(arrayContent);
  } catch (error) {
    console.error(`Error extracting ${variableName}:`, error);
    return [];
  }
};

/**
 * HTMLスパンタグから楽曲情報を抽出する
 */
export const parseMusicItem = (
  /** HTMLスパンタグの文字列 */
  item: string
): ParsedMusicItem | null => {
  try {
    // HTMLタグから楽曲名を抽出: <span class='...'>楽曲名</span>
    const textMatch = item.match(/>([^<]+)</);
    const text = textMatch?.[1];
    if (!text) return null;

    // [dx]がついているかチェック
    const title = text.endsWith("[dx]") ? text.slice(0, -4) : text;
    const isDx = text.endsWith("[dx]");

    // クラス名から難易度と新曲フラグを抽出
    const classMatch = item.match(/class='([^']+)'/);
    const className = classMatch?.[1];
    if (!className) return null;

    // wk_r, wk_m, wk_e から難易度を抽出
    const difficulty = className.split("_")[1]; // wk_r -> r, wk_m -> m, wk_e -> e
    const isNew = className.endsWith("_n");

    // 有効な難易度でない場合はnullを返す
    if (!difficulty || !["r", "m", "e"].includes(difficulty)) {
      return null;
    }

    return {
      title,
      difficulty,
      isNew,
      isDx,
    };
  } catch (error) {
    console.error("Error parsing music item:", error, item);
    return null;
  }
};

/**
 * キャッシュをクリアする関数
 */
export const revalidateMusicDataCache = async (): Promise<void> => {
  revalidateTag("music-data");
};

/**
 * レベル設定情報の一覧を取得
 */
const getLevelConfigs = (): LevelConfig[] => [
  { variable: "lv15_rslt", baseLevel: 15 },
  { variable: "lv14_rslt", baseLevel: 14 },
  { variable: "lv13_rslt", baseLevel: 13 },
  { variable: "lv12_rslt", baseLevel: 12 },
  { variable: "lv11_rslt", baseLevel: 11 },
  { variable: "lv10_rslt", baseLevel: 10 },
  { variable: "lv9_rslt", baseLevel: 9 },
  { variable: "lv8_rslt", baseLevel: 8 },
  { variable: "lv7_rslt", baseLevel: 7 },
  { variable: "lv6_rslt", baseLevel: 6 },
  { variable: "lv5_rslt", baseLevel: 5 },
];

/**
 * サブインデックスから実際のレベル値を計算
 */
const calculateLevel = (
  /** レベル設定 */
  config: LevelConfig,
  /** サブインデックス */
  subIndex: number
): number => {
  if (config.baseLevel === 15) {
    return 15.0;
  }
  return Math.round((config.baseLevel + 0.9 - 0.1 * subIndex) * 10) / 10;
};

/**
 * パースした楽曲情報からMusicInfoを作成
 */
const createMusicInfo = (
  /** パースした楽曲情報 */
  musicInfo: ParsedMusicItem,
  /** レベル値 */
  level: number
): MusicInfo => ({
  title: musicInfo.title,
  level,
  isDx: musicInfo.isDx,
  isNew: musicInfo.isNew,
});

/**
 * 単一レベルの配列データを処理
 */
const processLevelArray = (
  /** スクリプトテキスト */
  scriptText: string,
  /** レベル設定 */
  config: LevelConfig,
  /** 結果格納用オブジェクト */
  result: MusicDataByDifficulty
): void => {
  const levelArray = extractArrayFromScript(scriptText, config.variable);

  levelArray.forEach((subArray, subIndex) => {
    const level = calculateLevel(config, subIndex);

    subArray.forEach((item) => {
      const musicInfo = parseMusicItem(item);
      if (!musicInfo) return;

      const { difficulty } = musicInfo;
      if (difficulty === "r" || difficulty === "m" || difficulty === "e") {
        const musicData = createMusicInfo(musicInfo, level);
        result[difficulty].push(musicData);
      }
    });
  });
};

/**
 * 内部の楽曲データ取得関数（キャッシュなし）
 */
export const fetchMusicDataInternal = async (): Promise<MusicDataByDifficulty> => {
  console.log("Fetching fresh music data from external source");
  const response = await fetch(
    "https://sgimera.github.io/mai_RatingAnalyzer/scripts_maimai/maidx_in_lv_data_prismplus.js"
  );
  const scriptText = await response.text();

  const result: MusicDataByDifficulty = { r: [], m: [], e: [] };
  const levelConfigs = getLevelConfigs();

  for (const config of levelConfigs) {
    processLevelArray(scriptText, config, result);
  }

  return result;
};

/**
 * JSファイルから楽曲データを文字列処理で取得してパースする（キャッシュ付き）
 */
export const fetchMusicData = unstable_cache(
  fetchMusicDataInternal,
  ["music-data"],
  {
    tags: ["music-data"],
    revalidate: false, // 手動でrevalidateするまでキャッシュを保持
  }
);
