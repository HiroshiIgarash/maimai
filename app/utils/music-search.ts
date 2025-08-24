import { MusicDifficulty, MusicRatingInfo, PlayInfo } from "./types/type";
import { calculateSingleRating } from "./rating";

const titleMap: { [key: string]: string } = {
  "バラバラ〜仮初レインボーローズ〜": "バラバラ",
  "アノーイング！さんさんウィーク！": "アノーイング！",
  ようこそジャパリパークへ: "ジャパリパーク",
  "にっこり^^調査隊のテーマ": "にっこり調査隊",
  "みくみくにしてあげる♪【してやんよ】": "みくみくにしてあげる",
  Link: "Link (nico)",
  "Bad Apple!! feat nomico": "Bad Apple!!",
  星界ちゃんと可不ちゃんのおつかい合騒曲: "おつかい合騒曲",
  "ギリギリ最強あいまいみー！": "あいまいみー",
  "偉大なる悪魔は実は大天使パトラちゃん様なのだ！":
    "偉大なる悪魔は大天使パトラ",
  "チュルリラ・チュルリラ・ダッダッダ！": "チュルリラ",
  "メイトなやつら（FEAT. 天開司, 佐藤ホームズ, あっくん大魔王 & 歌衣メイカ）":
    "メイトなやつら",
  "FREEDOM DiVE (tpz Overcute Remix)": "FREEDOME Dive(tpz)",
  エンドマークに希望と涙を添えて: "エンドマーク",
  "若い力 -SEGA HARD GIRLS MIX-": "若い力(セハガール)",
  "セハガガガンバッちゃう！！": "セハガール",
  "ガチャガチャきゅ～と・ふぃぎゅ@メイト": "ガチャガチャきゅ～と",
  "トリドリ⇒モリモリ！Lovely fruits☆": "Lovely fruits",
  単一指向性オーバーブルーム: "オーバーブルーム",
  "撩乱乙女†無双劇": "撩乱乙女無双劇",
  魔理沙は大変なものを盗んでいきました: "魔理沙",
  "キャプテン・ムラサのケツアンカー": "ケツアンカー",
  "Bad Apple!! feat.nomico ～五十嵐 撫子 Ver.～": "Bad Apple(撫子)",
  "Help me, ERINNNNNN!!": "Help me, ERIN!!(new)",
  "ウッーウッーウマウマ(ﾟ∀ﾟ)": "ウマウマ",
  "Bad Apple!! feat.nomico (Tetsuya Komuro Remix)": "Bad Apple!! (TK)",
  "Help me, ERINNNNNN!!（Band ver.）": "Help me, ERIN!!（Band）",
  スカーレット警察のゲットーパトロール24時: "スカーレット警察",
  "チルノのパーフェクトさんすう教室　⑨周年バージョン": "チルノ9周年",
  "Bad Apple!! feat.nomico": "Bad Apple!!",
  "東方スイーツ！～鬼畜姉妹と受難メイド～": "東方スイーツ",
  "ピポピポ -People People- feat. ななひら": "ピポピポ",
  アトロポスと最果の探究者: "アトロポス",
  "true my heart -Lovable mix-": "true my heart",
  Löschen: "Loschen",
  "U&iVERSE -銀河鸞翔-": "UNiVERSE 銀河鸞翔",
};

/**
 * 新しい楽曲データから譜面定数および旧曲・新曲を検索する
 * @param musicData 楽曲データ
 * @param musicTitle 楽曲名
 * @param isDx DX譜面かどうか
 * @param difficulty 難易度
 * @returns
 */
export const searchRealLevelAndIsNewFromMusicData = (
  musicData: {
    r: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    m: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    e: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
  },
  musicTitle: string,
  isDx: boolean,
  difficulty: MusicDifficulty
): {
  level: number | undefined;
  isNew: boolean | undefined;
} => {
  const title = titleMap[musicTitle] || musicTitle;

  const difficultyData = musicData[difficulty];
  if (!difficultyData) {
    return {
      level: undefined,
      isNew: undefined,
    };
  }

  const targetMusic = difficultyData.find(
    (music) => music.title === title && music.isDx === isDx
  );

  if (!targetMusic) {
    return {
      level: undefined,
      isNew: undefined,
    };
  }

  return {
    level: targetMusic.level,
    isNew: targetMusic.isNew,
  };
};

/**
 * プレイ情報から楽曲レーティング情報のリストを返す（楽曲データ版）
 * @param playInfo
 * @param musicData
 * @param difficulty
 * @returns
 */
export const generateMusicRatingInfoListFromMusicData = (
  playInfo: PlayInfo[],
  musicData: {
    r: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    m: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    e: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
  },
  difficulty: MusicDifficulty
): MusicRatingInfo[] => {
  const musicRatingInfoList = playInfo.map((info) => {
    const { name, score, isDx, displayLevel, count, isPlayedRecently } = info;
    const { level: realLevel, isNew } = searchRealLevelAndIsNewFromMusicData(
      musicData,
      info.name,
      info.isDx,
      difficulty
    );
    /** レーティング算出時に用いるレベル。レベル不明であれば表示されるレベルを用いる */
    const levelUsingRatingCalculate = realLevel || displayLevel;

    const rating = calculateSingleRating(levelUsingRatingCalculate, score);

    return {
      name,
      difficulty,
      isDx,
      isNew,
      score,
      rating,
      realLevel,
      displayLevel,
      levelUsingRatingCalculate,
      count,
      isPlayedRecently,
    };
  });

  return musicRatingInfoList;
};