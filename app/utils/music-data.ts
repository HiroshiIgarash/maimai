import { unstable_cache, revalidateTag } from "next/cache";

/**
 * JSファイル内の配列データを文字列として抽出する
 * @param scriptText JSファイルの内容
 * @param variableName 抽出したい変数名（例：'lv15_rslt'）
 * @returns 抽出された配列データ
 */
export const extractArrayFromScript = (
  scriptText: string,
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
 * @param item HTMLスパンタグの文字列
 * @returns パースされた楽曲情報
 */
export const parseMusicItem = (
  item: string
): {
  title: string;
  difficulty: string;
  isNew: boolean;
  isDx: boolean;
} | null => {
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

// キャッシュをクリアする関数
export const revalidateMusicDataCache = async (): Promise<void> => {
  revalidateTag("music-data");
};

// 内部の楽曲データ取得関数（キャッシュなし）
export const fetchMusicDataInternal = async (): Promise<{
  r: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
  m: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
  e: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
}> => {
  console.log("Fetching fresh music data from external source");
  const response = await fetch(
    "https://sgimera.github.io/mai_RatingAnalyzer/scripts_maimai/maidx_in_lv_data_prismplus.js"
  );
  const scriptText = await response.text();

  const result: {
    r: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    m: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    e: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
  } = { r: [], m: [], e: [] };

  // レベル別の配列変数名とその基準レベル
  const levelConfigs = [
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

  // 各レベル配列を処理
  for (const config of levelConfigs) {
    const levelArray = extractArrayFromScript(scriptText, config.variable);

    levelArray.forEach((subArray, subIndex) => {
      // レベル計算: lv15_rsltは15.0、lv14_rsltは14.9,14.8,14.7...のようにサブインデックスで調整
      // lv15_rsltの場合: 15.0 (subIndex=0のみ)
      // lv14_rsltの場合: 14.9(subIndex=0), 14.8(subIndex=1), 14.7(subIndex=2)...
      // lv14_rslt[0] = 14.9, lv14_rslt[1] = 14.8 のように計算
      const level =
        config.baseLevel === 15
          ? 15.0
          : Math.round((config.baseLevel + 0.9 - 0.1 * subIndex) * 10) / 10;

      subArray.forEach((item) => {
        const musicInfo = parseMusicItem(item);
        if (!musicInfo) return;

        const { title, difficulty, isNew, isDx } = musicInfo;

        // 難易度別にデータを振り分け
        if (difficulty === "r" || difficulty === "m" || difficulty === "e") {
          result[difficulty].push({
            title,
            level,
            isDx,
            isNew,
          });
        }
      });
    });
  }

  return result;
};

/**
 * JSファイルから楽曲データを文字列処理で取得してパースする（キャッシュ付き）
 * @returns
 */
export const fetchMusicData = unstable_cache(
  fetchMusicDataInternal,
  ["music-data"],
  {
    tags: ["music-data"],
    revalidate: false, // 手動でrevalidateするまでキャッシュを保持
  }
);