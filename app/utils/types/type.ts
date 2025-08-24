export const MusicDifficultyMap = {
  e: "EX",
  m: "Master",
  r: "Re",
} as const;

export type MusicDifficulty = keyof typeof MusicDifficultyMap;

/**
 * maimaiでらっくすNETから取得できるプレイ情報の型
 */
export interface PlayInfo {
  name: string;
  score: number;
  displayLevel: number;
  isDx: boolean;
  count?: number;
  isPlayedRecently?: boolean;
}

/**
 * 楽曲の基本情報
 */
export interface MusicInfo {
  title: string;
  level: number;
  isDx: boolean;
  isNew: boolean;
}

/**
 * 難易度別楽曲データ
 */
export interface MusicDataByDifficulty {
  r: MusicInfo[];
  m: MusicInfo[];
  e: MusicInfo[];
}

/**
 * HTMLパース結果の楽曲情報
 */
export interface ParsedMusicItem {
  title: string;
  difficulty: string;
  isNew: boolean;
  isDx: boolean;
}

/**
 * レベル・新曲フラグ検索結果
 */
export interface LevelSearchResult {
  level: number | undefined;
  isNew: boolean | undefined;
}

/**
 * レベル設定情報
 */
export interface LevelConfig {
  variable: string;
  baseLevel: number;
}

export interface MusicRatingInfo {
  name: string;
  difficulty: MusicDifficulty;
  isDx: boolean;
  isNew: boolean | undefined;
  score: number;
  rating: number;
  realLevel: number | undefined;
  displayLevel: number;
  levelUsingRatingCalculate: number;
  count?: number;
  isPlayedRecently?: boolean;
}
