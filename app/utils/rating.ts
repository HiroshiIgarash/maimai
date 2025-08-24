/**
 * レーティング計算機能
 *
 * maimai DXのレーティング計算に関する機能を提供します。
 * スコアからランクへの変換、単曲レーティングの計算、
 * 目標スコアの算出、総合レーティングの計算を行います。
 *
 * 主な機能：
 * - スコアからランク係数・ランク名の算出
 * - 単曲レーティングの計算
 * - 目標スコア逆算機能
 * - でらっくすRATING総合値の計算
 */

import { MusicRatingInfo } from "./types/type";

const rankNeedScoreMap = {
  SSS_PLUS: 1.005,
  SSS: 1,
  SS_PLUS: 0.995,
  SS: 0.99,
  S_PLUS: 0.98,
  S: 0.97,
  AAA: 0.94,
  AA: 0.9,
} as const;

/**
 * 達成率からRank係数を算出する
 */
export const rateByScore = (
  /** 達成率 */
  score: number
) => {
  if (score >= rankNeedScoreMap.SSS_PLUS) return 22.4;
  if (score >= rankNeedScoreMap.SSS) return 21.6;
  if (score >= rankNeedScoreMap.SS_PLUS) return 21.1;
  if (score >= rankNeedScoreMap.SS) return 20.8;
  if (score >= rankNeedScoreMap.S_PLUS) return 20.3;
  if (score >= rankNeedScoreMap.S) return 20.0;
  if (score >= rankNeedScoreMap.AAA) return 16.8;
  if (score >= rankNeedScoreMap.AA) return 13.6;
  return 13;
};

/**
 * 達成率からランク（SSSなど）を算出する
 */
export const rankByScore = (
  /** 達成率 */
  score: number
) => {
  if (score >= rankNeedScoreMap.SSS_PLUS) return "SSS+";
  if (score >= rankNeedScoreMap.SSS) return "SSS";
  if (score >= rankNeedScoreMap.SS_PLUS) return "SS+";
  if (score >= rankNeedScoreMap.SS) return "SS";
  if (score >= rankNeedScoreMap.S_PLUS) return "S+";
  if (score >= rankNeedScoreMap.S) return "S";
  if (score >= rankNeedScoreMap.AAA) return "AAA";
  if (score >= rankNeedScoreMap.AA) return "AA";
  if (score >= 0.8) return "A";
  return "B";
};

/**
 * ランクから係数を算出する
 */
export const rateByRank = (
  /** ランク */
  rank: keyof typeof rankNeedScoreMap
) => {
  return rateByScore(rankNeedScoreMap[rank]);
};

/**
 * 単曲レーティングを算出する
 */
export const calculateSingleRating = (
  /** 譜面定数 */
  level: number,
  /** 達成率 */
  score: number
) => {
  const rate = rateByScore(score);
  const singleRating = Math.floor(level * Math.min(score, 1.005) * rate);

  return singleRating;
};

/**
 * 指定したランク内での最低スコア時の単曲レートを計算する
 *
 * 例) ランクSであればスコア100.0%時の単曲レートを計算
 */
const calculateMinRatingInRank = (
  /** ランク */
  rank: keyof typeof rankNeedScoreMap,
  /** 譜面定数 */
  level: number
): number => {
  return Math.floor(level * rankNeedScoreMap[rank] * rateByRank(rank));
};

/**
 * 90%のスコアで目標単曲レートを達成できるかチェック
 *
 * 90%スコア時の単曲レート: Math.floor(level * 0.9 * 13)
 * 90%でも目標レートに届くなら、それ以下のスコアでも達成可能だが、
 * 安全な値として90%（0.9）を返すことにしている
 */
const canAchieveWithNinetyPercent = (
  /** 目標単曲レート */
  goalMusicRating: number,
  /** 譜面定数 */
  level: number
): boolean => {
  return Math.floor(level * 0.9 * 13) >= goalMusicRating;
};

/**
 * 指定ランク範囲内での必要スコアを計算
 */
const calculateScoreForRankRange = (
  /** 目標単曲レート */
  goalMusicRating: number,
  /** 譜面定数 */
  level: number,
  /** 現在のランク */
  currentRank: keyof typeof rankNeedScoreMap,
  /** 次のランク */
  nextRank: keyof typeof rankNeedScoreMap
): number => {
  return Math.min(
    goalMusicRating / (rateByRank(currentRank) * level),
    rankNeedScoreMap[nextRank]
  );
};

/**
 * ランク範囲の条件チェック
 */
const checkRankRange = (
  /** 目標単曲レート */
  goalMusicRating: number,
  /** 譜面定数 */
  level: number,
  /** 現在のランク */
  currentRank: keyof typeof rankNeedScoreMap,
  /** 次のランク */
  nextRank: keyof typeof rankNeedScoreMap
): boolean => {
  const minCurrentRating = calculateMinRatingInRank(currentRank, level);
  const minNextRating = calculateMinRatingInRank(nextRank, level);
  return minCurrentRating >= goalMusicRating && minNextRating < goalMusicRating;
};

/**
 * 目標単曲レートに達するのに必要な楽曲スコアを算出する
 * 90.0%でも達成可能な場合は0.9を返す
 */
export const calculateGoalScore = (
  /** 目標単曲レート */
  goalMusicRating: number,
  /** 譜面定数 */
  level: number
): number => {
  // 90%のスコアで既に目標レートに到達する場合、安全値として90%を返す
  if (canAchieveWithNinetyPercent(goalMusicRating, level)) {
    return 0.9;
  }

  // ランクAA範囲内、もしくはランクAAA到達で達成する場合
  if (checkRankRange(goalMusicRating, level, "AAA", "AA")) {
    return calculateScoreForRankRange(goalMusicRating, level, "AA", "AAA");
  }

  // ランクAAA範囲内、もしくはランクS到達で達成する場合
  if (checkRankRange(goalMusicRating, level, "S", "AAA")) {
    return calculateScoreForRankRange(goalMusicRating, level, "AAA", "S");
  }

  // ランクS範囲内、もしくはランクS+到達で達成する場合
  if (checkRankRange(goalMusicRating, level, "S_PLUS", "S")) {
    return calculateScoreForRankRange(goalMusicRating, level, "S", "S_PLUS");
  }

  // ランクS+範囲内、もしくはランクSS到達で達成する場合
  if (checkRankRange(goalMusicRating, level, "SS", "S_PLUS")) {
    return calculateScoreForRankRange(goalMusicRating, level, "S_PLUS", "SS");
  }

  // ランクSS範囲内、もしくはランクSS+到達で達成する場合
  if (checkRankRange(goalMusicRating, level, "SS_PLUS", "SS")) {
    return calculateScoreForRankRange(goalMusicRating, level, "SS", "SS_PLUS");
  }

  // ランクSS+範囲内、もしくはランクSSS到達で達成する場合
  if (checkRankRange(goalMusicRating, level, "SSS", "SS_PLUS")) {
    return calculateScoreForRankRange(goalMusicRating, level, "SS_PLUS", "SSS");
  }

  // ランクSSS範囲内、もしくはランクSSS+到達で達成する場合
  if (checkRankRange(goalMusicRating, level, "SSS_PLUS", "SSS")) {
    return calculateScoreForRankRange(
      goalMusicRating,
      level,
      "SSS",
      "SSS_PLUS"
    );
  }

  // ランクSSS+到達でも達成しない場合、理論楽曲スコアを返す
  return goalMusicRating / (rateByRank("SSS") * level);
};

/**
 * 楽曲レーティング情報からでらっくすRATINGを算出する
 */
export const calculateMaimaiRating = (
  /** 楽曲レーティング情報 */
  musicRatingInfoList: MusicRatingInfo[]
) => {
  const targetMusicRatingInfoList = [
    ...musicRatingInfoList
      .filter((musicRatingInfo) => musicRatingInfo.isNew)
      .slice(0, 15),
    ...musicRatingInfoList
      .filter((musicRatingInfo) => !musicRatingInfo.isNew)
      .slice(0, 35),
  ];

  const rating = targetMusicRatingInfoList.reduce(
    (prev, currentMusicRatingInfo) => {
      return prev + currentMusicRatingInfo.rating;
    },
    0
  );

  return rating;
};
