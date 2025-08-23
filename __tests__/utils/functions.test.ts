import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { extractArrayFromScript, parseMusicItem, fetchMusicData } from '@/app/utils/functions';
import { 
  mockMaimaiScriptText, 
  expectedMusicData, 
  mockEdgeCaseScriptText, 
  expectedEdgeCaseData 
} from '../__mocks__/mockJsData';

// Global fetch mock
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('Music Data Parser Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractArrayFromScript', () => {
    it('lv15_rsltの配列を正しく抽出する', () => {
      const result = extractArrayFromScript(mockMaimaiScriptText, 'lv15_rslt');
      
      expect(result).toHaveLength(1); // lv15_rsltは1つの配列
      expect(result[0]).toHaveLength(7);
      expect(result[0][0]).toBe("<span class='wk_r'>PANDORA PARADOXXX</span>");
    });

    it('lv14_rsltの配列を正しく抽出する', () => {
      const result = extractArrayFromScript(mockMaimaiScriptText, 'lv14_rslt');
      
      expect(result).toHaveLength(10); // lv14_rsltは10個の配列
      expect(result[0]).toContain("<span class='wk_r'>Level 14.9 Song</span>");
      expect(result[9]).toContain("<span class='wk_e_n'>Level 14.0 Song[dx]</span>");
    });

    it('存在しない変数名でundefinedを返す', () => {
      const result = extractArrayFromScript(mockMaimaiScriptText, 'nonexistent');
      
      expect(result).toEqual([]);
    });

    it('空の配列を正しく処理する', () => {
      const result = extractArrayFromScript(mockMaimaiScriptText, 'lv12_rslt');
      
      expect(result).toEqual([]);
    });

    it('不正なスクリプトでエラーハンドリング', () => {
      const invalidScript = 'invalid javascript code {[}';
      const result = extractArrayFromScript(invalidScript, 'lv15_rslt');
      
      expect(result).toEqual([]);
    });
  });

  describe('parseMusicItem', () => {
    it('基本的なHTMLスパンタグをパースする', () => {
      const item = "<span class='wk_r'>PANDORA PARADOXXX</span>";
      const result = parseMusicItem(item);
      
      expect(result).toEqual({
        title: "PANDORA PARADOXXX",
        difficulty: "r",
        isNew: false,
        isDx: false
      });
    });

    it('DX楽曲を正しくパースする', () => {
      const item = "<span class='wk_m'>系ぎて[dx]</span>";
      const result = parseMusicItem(item);
      
      expect(result).toEqual({
        title: "系ぎて",
        difficulty: "m", 
        isNew: false,
        isDx: true
      });
    });

    it('新曲フラグを正しく判定する', () => {
      const item = "<span class='wk_e_n'>Sample Song[dx]</span>";
      const result = parseMusicItem(item);
      
      expect(result).toEqual({
        title: "Sample Song",
        difficulty: "e",
        isNew: true,
        isDx: true
      });
    });

    it('無効なHTMLタグでnullを返す', () => {
      const item = "<div class='invalid'>No span tag</div>";
      const result = parseMusicItem(item);
      
      expect(result).toBeNull();
    });

    it('クラス名がないタグでnullを返す', () => {
      const item = "<span>No class attribute</span>";
      const result = parseMusicItem(item);
      
      expect(result).toBeNull();
    });

    it('空文字列でnullを返す', () => {
      const result = parseMusicItem("");
      
      expect(result).toBeNull();
    });

    it('特殊文字を含む楽曲名を正しく処理する', () => {
      const item = "<span class='wk_r'>楽曲名に◆記号が入る楽曲</span>";
      const result = parseMusicItem(item);
      
      expect(result).toEqual({
        title: "楽曲名に◆記号が入る楽曲",
        difficulty: "r",
        isNew: false,
        isDx: false
      });
    });

    it('複数の[dx]を含む楽曲名を正しく処理する', () => {
      const item = "<span class='wk_m'>楽曲名に[dx]が含まれる楽曲[dx][dx]</span>";
      const result = parseMusicItem(item);
      
      expect(result).toEqual({
        title: "楽曲名に[dx]が含まれる楽曲[dx]",
        difficulty: "m",
        isNew: false,
        isDx: true
      });
    });
  });

  describe('fetchMusicData - Integration Tests', () => {
    it('正常なスクリプトから楽曲データを生成する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockMaimaiScriptText),
      } as Response);

      const result = await fetchMusicData();

      expect(result.r).toHaveLength(7);
      expect(result.m).toHaveLength(7);
      expect(result.e).toHaveLength(6);

      // Re:MASTER楽曲の検証
      expect(result.r).toContainEqual(
        expect.objectContaining({
          title: "PANDORA PARADOXXX",
          level: 15.0,
          isDx: false,
          isNew: false
        })
      );

      // DX楽曲の検証
      expect(result.r).toContainEqual(
        expect.objectContaining({
          title: "系ぎて",
          level: 15.0,
          isDx: true,
          isNew: false
        })
      );

      // 新曲の検証
      expect(result.r).toContainEqual(
        expect.objectContaining({
          title: "Xaleid◆scopiX",
          level: 15.0,
          isDx: true,
          isNew: true
        })
      );
    });

    it('レベル計算が正しく動作する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockMaimaiScriptText),
      } as Response);

      const result = await fetchMusicData();

      // ユーザー指定のレベル計算ロジック:
      // lv15_rslt[0] -> 15.0
      // lv14_rslt[0] -> 14.9
      // lv14_rslt[1] -> 14.8
      // lv13_rslt[0] -> 13.0

      const level15Songs = result.r.filter(song => song.level === 15.0);
      const level149Songs = result.r.filter(song => song.level === 14.9);
      const level148Songs = result.r.filter(song => song.level === 14.8);

      // 実際の結果をチェック
      expect(result.r).toHaveLength(7);
      expect(result.m).toHaveLength(7);
      expect(result.e).toHaveLength(6);
      
      expect(level15Songs.length).toBe(3); // lv15_rslt[0]のr楽曲
      expect(level149Songs.length).toBe(1); // lv14_rslt[0]のr楽曲
      expect(level148Songs.length).toBe(1); // lv14_rslt[1]のr楽曲
    });

    it('エッジケースを適切に処理する', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockEdgeCaseScriptText),
      } as Response);

      const result = await fetchMusicData();

      expect(result.r).toHaveLength(1);
      expect(result.m).toHaveLength(1);
      expect(result.e).toHaveLength(1);

      expect(result.r[0]).toEqual({
        title: "楽曲名に◆記号が入る楽曲",
        level: 15.0,
        isDx: false,
        isNew: false
      });
    });

    it('fetchエラー時の処理', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchMusicData()).rejects.toThrow('Network error');
    });

    it('空のレスポンス時の処理', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      } as Response);

      const result = await fetchMusicData();

      expect(result.r).toEqual([]);
      expect(result.m).toEqual([]);
      expect(result.e).toEqual([]);
    });
  });
});