import { MusicDifficulty, MusicRatingInfo, PlayInfo } from "./types/type";
import { calculateSingleRating } from "./rating";
import titleMap from "../data/title-map.json";

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
  const title = (titleMap as Record<string, string>)[musicTitle] || musicTitle;

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