/**
 * 楽曲検索・処理機能
 * 
 * 楽曲データの検索とプレイ情報の処理機能を提供します。
 * 楽曲名のマッピング、譜面定数の検索、レーティング情報の生成を行います。
 * 
 * 主な機能：
 * - 楽曲名の正規化とマッピング
 * - 楽曲データからの譜面定数・新曲フラグ検索
 * - プレイ情報から楽曲レーティング情報リストの生成
 */

import { MusicDifficulty, MusicRatingInfo, PlayInfo } from "./types/type";
import { calculateSingleRating } from "./rating";
import titleMap from "../data/title-map.json";

/**
 * 新しい楽曲データから譜面定数および旧曲・新曲を検索する
 */
export const searchRealLevelAndIsNewFromMusicData = (
  /** 楽曲データ */
  musicData: {
    r: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    m: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    e: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
  },
  /** 楽曲名 */
  musicTitle: string,
  /** DX譜面かどうか */
  isDx: boolean,
  /** 難易度 */
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
 */
export const generateMusicRatingInfoListFromMusicData = (
  /** プレイ情報 */
  playInfo: PlayInfo[],
  /** 楽曲データ */
  musicData: {
    r: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    m: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    e: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
  },
  /** 難易度 */
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