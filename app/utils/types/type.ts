export const MusicDifficultyMap = {
  e: 'EX',
  m: 'Master',
  r: 'Re',
} as const

export type MusicDifficulty = keyof typeof MusicDifficultyMap

/**
 * maimaiでらっくすNETから取得できるプレイ情報の型
 */
export interface PlayInfo {
  name: string;
  score: number;
  displayLevel: number;
  isDx: boolean;
  count?: number
}

export interface MusicRatingInfo {
  name: string,
  difficulty: MusicDifficulty,
  isDx: boolean,
  isNew: boolean | undefined,
  score: number,
  rating: number,
  realLevel: number | undefined,
  displayLevel: number
  levelUsingRatingCalculate: number
  count?: number
}