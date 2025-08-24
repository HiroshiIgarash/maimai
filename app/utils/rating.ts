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
 * 90%のスコアで目標単曲レートを達成できるかチェック
 *
 * 90%スコア時の正確な単曲レートを計算して比較
 */
const canAchieveWithNinetyPercent = (
  /** 目標単曲レート */
  goalMusicRating: number,
  /** 譜面定数 */
  level: number
): boolean => {
  const ninetyPercentRating = calculateSingleRating(level, 0.9);
  return ninetyPercentRating >= goalMusicRating;
};

/**
 * 指定範囲内で目標レート以上の最小スコアを正確に見つける
 */
const findMinimumScore = (
  /** 目標単曲レート */
  goalMusicRating: number,
  /** 譜面定数 */
  level: number,
  /** 探索範囲の下限 */
  left: number,
  /** 探索範囲の上限 */
  right: number
): number => {
  // 非常に細かい刻みで線形探索して正確な最小値を見つける
  const step = 0.000001;
  
  for (let score = left; score <= right; score += step) {
    const actualRating = calculateSingleRating(level, score);
    if (actualRating >= goalMusicRating) {
      return score;
    }
  }
  
  return right; // 見つからない場合は上限を返す
};

/**
 * 目標単曲レートに達するのに必要な楽曲スコアを算出する
 */
export const calculateGoalScore = (
  /** 目標単曲レート */
  goalMusicRating: number,
  /** 譜面定数 */
  level: number
): number => {
  // 90%で達成可能な場合は90%を返す
  if (canAchieveWithNinetyPercent(goalMusicRating, level)) {
    return 0.9;
  }

  // まずランクの境界値を順番にチェック（下位から上位へ、最小スコアを見つけるため）
  const rankThresholds = [0.9, 0.94, 0.97, 0.98, 0.99, 0.995, 1.0, 1.005];

  for (let i = 0; i < rankThresholds.length; i++) {
    const threshold = rankThresholds[i];
    const rating = calculateSingleRating(level, threshold);

    if (rating >= goalMusicRating) {
      // この境界値で達成できる場合
      if (rating === goalMusicRating) {
        // 正確に一致する場合は境界値を返す
        return threshold;
      }

      // 境界値では過剰な場合、前の境界値から正確な最小値を探索
      const prevThreshold = i > 0 ? rankThresholds[i - 1] : 0.9;
      return findMinimumScore(
        goalMusicRating,
        level,
        prevThreshold,
        threshold
      );
    }
  }

  // ランク境界値で達成できない場合、全範囲で正確な最小値を探索
  const result = findMinimumScore(goalMusicRating, level, 0.9, 1.005);

  // 最終確認：resultで目標レート以上が達成できることを確認
  const finalRating = calculateSingleRating(level, result);
  if (finalRating >= goalMusicRating) {
    return result;
  }

  // 二分探索で見つからない場合、理論値を返す
  return goalMusicRating / (rateByRank("SSS_PLUS") * level);
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
