/**
 * calculateGoalScore関数のテストコード
 *
 * この関数は目標レートを達成するために必要な最小スコア（0.000001刻み）を返します。
 */

import { describe, test, expect } from "@jest/globals";
import { calculateGoalScore, calculateSingleRating } from "../rating";

/**
 * 最小スコアの厳密検証を行う
 */
function verifyMinimumScore(
  targetRating: number,
  level: number,
  calculatedScore: number
) {
  const actualRating = calculateSingleRating(level, calculatedScore);

  // 1. 算出されたスコアで目標レートを達成できるか
  expect(actualRating).toBeGreaterThanOrEqual(targetRating);

  // 2. -0.000001したスコアで目標レートに達しないか（0.9の場合は除く）
  if (calculatedScore !== 0.9) {
    const reducedScore = calculatedScore - 0.000001;
    const reducedRating = calculateSingleRating(level, reducedScore);
    expect(reducedRating).toBeLessThan(targetRating);
  }
}

describe("calculateGoalScore", () => {
  describe("基本機能", () => {
    test("90%で達成可能な場合は0.9を返す", () => {
      const result = calculateGoalScore(150, 15.0);
      expect(result).toBe(0.9);
      verifyMinimumScore(150, 15.0, result);
    });

    test("ユーザー報告ケース：目標293、レベル13.6", () => {
      const result = calculateGoalScore(293, 13.6);
      expect(result).toBe(1.0);
      verifyMinimumScore(293, 13.6, result);
    });
  });

  describe("ランク境界を軸にした体系的検証", () => {
    const level = 14.0;
    // レベル14.0での各ランク境界レート:
    // SS+ランクでの最小レート: 293 (スコア0.995、係数21.1)
    // SS+ランクでの最大レート: 295 (スコア0.999999、係数21.1)
    // SSSランクでの最小レート: 302 (スコア1.0、係数21.6)

    test("目標293 - SS+最小レートぴったり", () => {
      const result = calculateGoalScore(293, level);
      verifyMinimumScore(293, level, result);
    });

    test("目標294 - SS+最小レートと最大レートの間", () => {
      const result = calculateGoalScore(294, level);
      verifyMinimumScore(294, level, result);
    });

    test("目標295 - SS+最大レートぴったり", () => {
      const result = calculateGoalScore(295, level);
      verifyMinimumScore(295, level, result);
    });

    test("目標300 - SS+最大レートとSSS最小レートの間", () => {
      const result = calculateGoalScore(300, level);
      verifyMinimumScore(300, level, result);
    });
  });

  describe("エッジケースと包括的検証", () => {
    test("理論上不可能な高レートでは理論値を返す", () => {
      const result = calculateGoalScore(500, 14.0);
      expect(result).toBeGreaterThan(0);

      // 理論上不可能なレートの場合は厳密検証をスキップ
      const actualRating = calculateSingleRating(14.0, result);
      expect(actualRating).toBeLessThan(500); // 達成不可能であることを確認
    });

    test("ゼロレート目標では0.9を返す", () => {
      const result = calculateGoalScore(0, 14.0);
      expect(result).toBe(0.9);
      verifyMinimumScore(0, 14.0, result);
    });

  });
});
