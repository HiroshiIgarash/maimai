import { describe, it, expect } from '@jest/globals';
import { generateMusicRatingInfoListFromMusicData } from '@/app/utils/functions';
import { PlayInfo, MusicDifficulty } from '@/app/utils/types/type';

// テスト用の楽曲データ
const mockMusicData = {
  r: [
    { title: "PANDORA PARADOXXX", level: 15.0, isDx: false, isNew: false },
    { title: "系ぎて", level: 15.0, isDx: true, isNew: false },
    { title: "Xaleid◆scopiX", level: 15.0, isDx: true, isNew: true },
  ],
  m: [
    { title: "World's end BLACKBOX", level: 14.0, isDx: false, isNew: false },
    { title: "宙天", level: 14.0, isDx: true, isNew: true },
  ],
  e: [
    { title: "QZKago Requiem", level: 13.0, isDx: false, isNew: false },
    { title: "Sample Song", level: 13.0, isDx: true, isNew: true },
  ],
};

// テスト用のプレイ情報
const mockPlayInfo: PlayInfo[] = [
  {
    name: "PANDORA PARADOXXX",
    score: 0.9950,
    displayLevel: 15.0,
    isDx: false,
  },
  {
    name: "系ぎて",
    score: 0.9980,
    displayLevel: 15.0,
    isDx: true,
  },
  {
    name: "Unknown Song", // 楽曲データにない楽曲
    score: 0.9900,
    displayLevel: 14.0,
    isDx: false,
  },
];

describe('Music Data Search Functions', () => {
  describe('generateMusicRatingInfoListFromMusicData', () => {
    it('プレイ情報と楽曲データから正しくレーティング情報を生成する', () => {
      const result = generateMusicRatingInfoListFromMusicData(
        mockPlayInfo, 
        mockMusicData, 
        "r" as MusicDifficulty
      );

      expect(result).toHaveLength(3);

      // PANDORA PARADOXXXのテスト
      const pandora = result.find(item => item.name === "PANDORA PARADOXXX");
      expect(pandora).toEqual(
        expect.objectContaining({
          name: "PANDORA PARADOXXX",
          difficulty: "r",
          isDx: false,
          isNew: false,
          score: 0.9950,
          realLevel: 15.0,
          displayLevel: 15.0,
          levelUsingRatingCalculate: 15.0,
        })
      );

      // 系ぎてのテスト
      const keikeite = result.find(item => item.name === "系ぎて");
      expect(keikeite).toEqual(
        expect.objectContaining({
          name: "系ぎて", 
          difficulty: "r",
          isDx: true,
          isNew: false,
          score: 0.9980,
          realLevel: 15.0,
          displayLevel: 15.0,
          levelUsingRatingCalculate: 15.0,
        })
      );

      // 未知の楽曲のテスト（realLevel: undefined）
      const unknown = result.find(item => item.name === "Unknown Song");
      expect(unknown).toEqual(
        expect.objectContaining({
          name: "Unknown Song",
          difficulty: "r", 
          isDx: false,
          isNew: undefined,
          score: 0.9900,
          realLevel: undefined,
          displayLevel: 14.0,
          levelUsingRatingCalculate: 14.0, // displayLevelを使用
        })
      );
    });

    it('MASTER難易度の楽曲を正しく処理する', () => {
      const masterPlayInfo: PlayInfo[] = [
        {
          name: "World's end BLACKBOX",
          score: 0.9960,
          displayLevel: 14.0,
          isDx: false,
        },
        {
          name: "宙天",
          score: 0.9970,
          displayLevel: 14.0,
          isDx: true,
        },
      ];

      const result = generateMusicRatingInfoListFromMusicData(
        masterPlayInfo,
        mockMusicData,
        "m" as MusicDifficulty
      );

      expect(result).toHaveLength(2);

      const blackbox = result.find(item => item.name === "World's end BLACKBOX");
      expect(blackbox?.isNew).toBe(false);

      const chuten = result.find(item => item.name === "宙天");
      expect(chuten?.isNew).toBe(true);
      expect(chuten?.isDx).toBe(true);
    });

    it('EXPERT難易度の楽曲を正しく処理する', () => {
      const expertPlayInfo: PlayInfo[] = [
        {
          name: "QZKago Requiem", 
          score: 0.9940,
          displayLevel: 13.0,
          isDx: false,
        },
      ];

      const result = generateMusicRatingInfoListFromMusicData(
        expertPlayInfo,
        mockMusicData, 
        "e" as MusicDifficulty
      );

      expect(result).toHaveLength(1);
      expect(result[0].realLevel).toBe(13.0);
      expect(result[0].isNew).toBe(false);
    });

    it('楽曲データが空の場合を適切に処理する', () => {
      const emptyMusicData = { r: [], m: [], e: [] };
      
      const result = generateMusicRatingInfoListFromMusicData(
        mockPlayInfo,
        emptyMusicData,
        "r" as MusicDifficulty
      );

      expect(result).toHaveLength(3);
      
      // すべての楽曲でrealLevel: undefined, isNew: undefinedになるはず
      result.forEach(item => {
        expect(item.realLevel).toBeUndefined();
        expect(item.isNew).toBeUndefined();
        expect(item.levelUsingRatingCalculate).toBe(item.displayLevel);
      });
    });

    it('プレイ情報が空の場合を適切に処理する', () => {
      const result = generateMusicRatingInfoListFromMusicData(
        [],
        mockMusicData,
        "r" as MusicDifficulty
      );

      expect(result).toHaveLength(0);
    });

    it('DX/ST判定が正しく動作する', () => {
      const dxTestPlayInfo: PlayInfo[] = [
        {
          name: "系ぎて",
          score: 0.9980,
          displayLevel: 15.0,
          isDx: true, // プレイ情報でDX
        },
        {
          name: "PANDORA PARADOXXX",
          score: 0.9950,
          displayLevel: 15.0,
          isDx: false, // プレイ情報でST
        },
      ];

      const result = generateMusicRatingInfoListFromMusicData(
        dxTestPlayInfo,
        mockMusicData,
        "r" as MusicDifficulty
      );

      const keikeite = result.find(item => item.name === "系ぎて");
      expect(keikeite?.isDx).toBe(true);
      expect(keikeite?.realLevel).toBe(15.0); // DX版のレベルを取得

      const pandora = result.find(item => item.name === "PANDORA PARADOXXX");
      expect(pandora?.isDx).toBe(false);
      expect(pandora?.realLevel).toBe(15.0); // ST版のレベルを取得
    });

    it('特殊文字を含む楽曲名を正しく処理する', () => {
      const specialMusicData = {
        r: [
          { title: "楽曲名に◆記号", level: 15.0, isDx: false, isNew: false },
        ],
        m: [],
        e: [],
      };

      const specialPlayInfo: PlayInfo[] = [
        {
          name: "楽曲名に◆記号",
          score: 0.9950,
          displayLevel: 15.0,
          isDx: false,
        },
      ];

      const result = generateMusicRatingInfoListFromMusicData(
        specialPlayInfo,
        specialMusicData,
        "r" as MusicDifficulty
      );

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("楽曲名に◆記号");
      expect(result[0].realLevel).toBe(15.0);
    });
  });
});