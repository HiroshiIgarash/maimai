/**
 * calculateGoalScore ランク境界・level多様性テスト
 *
 * ランク境界（S, S+, SS, SS+, SSS, SSS+）ごとに、
 * level=13.0~15.0の間でランダムに10個選び、
 * 境界値の最小・最大レート、境界間のレートで検証する
 */

import { describe, test, expect } from "@jest/globals";
import { calculateGoalScore, calculateSingleRating } from "../rating";

const rankInfo = [
  // [ランク名, 境界スコア, 係数]
  { name: "S", score: 0.97, rate: 20.0 },
  { name: "S+", score: 0.98, rate: 20.3 },
  { name: "SS", score: 0.99, rate: 20.8 },
  { name: "SS+", score: 0.995, rate: 21.1 },
  { name: "SSS", score: 1.0, rate: 21.6 },
  { name: "SSS+", score: 1.005, rate: 22.4 },
];

function getAllLevels(min: number, max: number, step: number): number[] {
  const arr: number[] = [];
  for (let v = min; v <= max + 1e-8; v += step) {
    arr.push(Number(v.toFixed(1)));
  }
  return arr;
}

function verifyMinimumScore(
  targetRating: number,
  level: number,
  calculatedScore: number
) {
  const actualRating = calculateSingleRating(level, calculatedScore);
  expect(actualRating).toBeGreaterThanOrEqual(targetRating);
  if (calculatedScore !== 0.9) {
    const reducedScore = calculatedScore - 0.000001;
    const reducedRating = calculateSingleRating(level, reducedScore);
    expect(reducedRating).toBeLessThan(targetRating);
  }
}

describe("calculateGoalScore ランク境界・level全パターンテスト", () => {
  const levels = getAllLevels(13.0, 15.0, 0.1);
  // 隣接ランクペア
  const pairs = [
    ["S", "S+"],
    ["S+", "SS"],
    ["SS", "SS+"],
    ["SS+", "SSS"],
    ["SSS", "SSS+"],
  ];

  pairs.forEach(([lower, upper]) => {
    const lowerRank = rankInfo.find((r) => r.name === lower)!;
    const upperRank = rankInfo.find((r) => r.name === upper)!;
    describe(`${lower}～${upper} 境界`, () => {
      levels.forEach((level) => {
        // 最小レート
        const minRating = Math.floor(level * lowerRank.score * lowerRank.rate);
        // 最大レート（このランクの最大スコア）
        const maxRating = Math.floor(
          level * (upperRank.score - 0.000001) * lowerRank.rate
        );
        // 上位ランクの最小レート
        const upperMinRating = Math.floor(
          level * upperRank.score * upperRank.rate
        );
        // 境界間の中間レート
        const midScore = (lowerRank.score + upperRank.score) / 2;
        const midRating = Math.floor(level * midScore * lowerRank.rate);

        test(`level=${level} 目標:最小レート`, () => {
          const result = calculateGoalScore(minRating, level);
          verifyMinimumScore(minRating, level, result);
        });
        test(`level=${level} 目標:最大レート`, () => {
          const result = calculateGoalScore(maxRating, level);
          verifyMinimumScore(maxRating, level, result);
        });
        test(`level=${level} 目標:中間レート`, () => {
          const result = calculateGoalScore(midRating, level);
          verifyMinimumScore(midRating, level, result);
        });
        test(`level=${level} 目標:上位ランク最小レート`, () => {
          const result = calculateGoalScore(upperMinRating, level);
          verifyMinimumScore(upperMinRating, level, result);
        });
      });
    });
  });
});
