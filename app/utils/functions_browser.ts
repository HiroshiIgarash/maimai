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
 * @param score 達成率
 * @returns Rank係数
 */
export const rateByScore = (score: number) => {
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
 * @param {number} score 達成率
 * @returns
 */
export const rankByScore = (score: number) => {
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

export const rateByRank = (rank: keyof typeof rankNeedScoreMap) => {
  return rateByScore(rankNeedScoreMap[rank]);
};

/**
 * 単曲レーティングを算出する
 * @param level
 * @param score
 */
export const calculateSingleRating = (level: number, score: number) => {
  const rate = rateByScore(score);
  const singleRating = Math.floor(level * Math.min(score, 1.005) * rate);

  return singleRating;
};

/**
 * 目標単曲レートに達するのに必要な楽曲スコアを算出する
 * @param goalMusicRating 目標単曲レート
 * @param level 譜面定数
 */
export const calculateGoalScore = (goalMusicRating: number, level: number) => {
  /** 指定したランクでの最低レーティング */
  const minRatingInRank = (rank: keyof typeof rankNeedScoreMap) => {
    return Math.floor(level * rankNeedScoreMap[rank] * rateByRank(rank));
  };

  // ランクA以下で達成する場合0.9を返す
  if (Math.floor(level * 0.9 * 13) >= goalMusicRating) return 0.9;

  // ランクAA範囲内、もしくはランクAAA到達で達成する場合
  if (
    minRatingInRank("AAA") >= goalMusicRating &&
    minRatingInRank("AA") < goalMusicRating
  ) {
    return Math.min(
      goalMusicRating / (rateByRank("AA") * level),
      rankNeedScoreMap["AAA"]
    );
  }

  // ランクAAA範囲内、もしくはランクS到達で達成する場合
  if (
    minRatingInRank("S") >= goalMusicRating &&
    minRatingInRank("AAA") < goalMusicRating
  ) {
    return Math.min(
      goalMusicRating / (rateByRank("AAA") * level),
      rankNeedScoreMap["S"]
    );
  }

  // ランクS範囲内、もしくはランクS+到達で達成する場合
  if (
    minRatingInRank("S_PLUS") >= goalMusicRating &&
    minRatingInRank("S") < goalMusicRating
  ) {
    return Math.min(
      goalMusicRating / (rateByRank("S") * level),
      rankNeedScoreMap["S_PLUS"]
    );
  }

  // ランクS+範囲内、もしくはランクSS到達で達成する場合
  if (
    minRatingInRank("SS") >= goalMusicRating &&
    minRatingInRank("S_PLUS") < goalMusicRating
  ) {
    return Math.min(
      goalMusicRating / (rateByRank("S_PLUS") * level),
      rankNeedScoreMap["SS"]
    );
  }

  // ランクSS範囲内、もしくはランクSS+到達で達成する場合
  if (
    minRatingInRank("SS_PLUS") >= goalMusicRating &&
    minRatingInRank("SS") < goalMusicRating
  ) {
    return Math.min(
      goalMusicRating / (rateByRank("SS") * level),
      rankNeedScoreMap["SS_PLUS"]
    );
  }

  // ランクSS+範囲内、もしくはランクSSS到達で達成する場合
  if (
    minRatingInRank("SSS") >= goalMusicRating &&
    minRatingInRank("SS_PLUS") < goalMusicRating
  ) {
    return Math.min(
      goalMusicRating / (rateByRank("SS_PLUS") * level),
      rankNeedScoreMap["SSS"]
    );
  }

  // ランクSSS範囲内、もしくはランクSSS+到達で達成する場合
  if (
    minRatingInRank("SSS_PLUS") >= goalMusicRating &&
    minRatingInRank("SSS") < goalMusicRating
  ) {
    return Math.min(
      goalMusicRating / (rateByRank("SSS") * level),
      rankNeedScoreMap["SSS_PLUS"]
    );
  }

  // ランクSSS+到達でも達成しない場合、理論楽曲スコアを返す
  return goalMusicRating / (rateByRank("SSS") * level);
};
