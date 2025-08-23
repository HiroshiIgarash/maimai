// titleMapの楽曲名が実際に存在するかチェックするスクリプト
const https = require('https');

// 現在のtitleMap（functions.tsから抽出）
const titleMap = {
  "バラバラ〜仮初レインボーローズ〜": "バラバラ",
  "アノーイング！さんさんウィーク！": "アノーイング！",
  "ようこそジャパリパークへ": "ジャパリパーク",
  "にっこり^^調査隊のテーマ": "にっこり調査隊",
  "みくみくにしてあげる♪【してやんよ】": "みくみくにしてあげる",
  "Link": "Link (nico)",
  "Bad Apple!! feat nomico": "Bad Apple!!",
  "星界ちゃんと可不ちゃんのおつかい合騒曲": "おつかい合騒曲",
  "ギリギリ最強あいまいみー！": "あいまいみー",
  "偉大なる悪魔は実は大天使パトラちゃん様なのだ！": "偉大なる悪魔は大天使パトラ",
  "チュルリラ・チュルリラ・ダッダッダ！": "チュルリラ",
  "メイトなやつら（FEAT. 天開司, 佐藤ホームズ, あっくん大魔王 & 歌衣メイカ）": "メイトなやつら",
  "FREEDOM DiVE (tpz Overcute Remix)": "FREEDOME Dive(tpz)",
  "エンドマークに希望と涙を添えて": "エンドマーク",
  "若い力 -SEGA HARD GIRLS MIX-": "若い力(セハガール)",
  "セハガガガンバッちゃう！！": "セハガール",
  "ガチャガチャきゅ～と・ふぃぎゅ@メイト": "ガチャガチャきゅ～と",
  "トリドリ⇒モリモリ！Lovely fruits☆": "Lovely fruits",
  "単一指向性オーバーブルーム": "オーバーブルーム",
  "撩乱乙女†無双劇": "撩乱乙女無双劇",
  "魔理沙は大変なものを盗んでいきました": "魔理沙",
  "キャプテン・ムラサのケツアンカー": "ケツアンカー",
  "Bad Apple!! feat.nomico ～五十嵐 撫子 Ver.～": "Bad Apple(撫子)",
  "Help me, ERINNNNNN!!": "Help me, ERIN!!(new)",
};

function extractArrayFromScript(scriptText, variableName) {
  try {
    const regex = new RegExp(`const\\s+${variableName}\\s*=\\s*(\\[[\\s\\S]*?\\]);`, 'i');
    const match = scriptText.match(regex);
    
    if (!match || !match[1]) {
      return [];
    }
    
    return eval(match[1]);
  } catch (error) {
    console.error(`Error extracting ${variableName}:`, error);
    return [];
  }
}

function parseMusicTitle(item) {
  try {
    const textMatch = item.match(/>([^<]+)</);
    const text = textMatch?.[1];
    if (!text) return null;

    // [dx]を除去してタイトルを取得
    const title = text.endsWith("[dx]") ? text.slice(0, -4) : text;
    return title;
  } catch (error) {
    return null;
  }
}

function fetchMusicTitles() {
  return new Promise((resolve, reject) => {
    https.get('https://sgimera.github.io/mai_RatingAnalyzer/scripts_maimai/maidx_in_lv_data_prismplus.js', (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const allTitles = new Set();

        const levelConfigs = [
          'lv15_rslt', 'lv14_rslt', 'lv13_rslt', 'lv12_rslt', 'lv11_rslt',
          'lv10_rslt', 'lv9_rslt', 'lv8_rslt', 'lv7_rslt', 'lv6_rslt', 'lv5_rslt'
        ];

        levelConfigs.forEach(variable => {
          const levelArray = extractArrayFromScript(data, variable);
          levelArray.forEach(subArray => {
            subArray.forEach(item => {
              const title = parseMusicTitle(item);
              if (title) {
                allTitles.add(title);
              }
            });
          });
        });

        resolve(Array.from(allTitles));
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function checkTitleMap() {
  try {
    console.log("外部データから楽曲リストを取得中...");
    const actualTitles = await fetchMusicTitles();
    
    console.log("\n=== titleMapの検証結果 ===");
    
    const missingTitles = [];
    const foundTitles = [];
    
    Object.keys(titleMap).forEach(originalTitle => {
      const mappedTitle = titleMap[originalTitle];
      
      // 元のタイトルが存在するかチェック
      const originalFound = actualTitles.includes(originalTitle);
      // マップされたタイトルが存在するかチェック  
      const mappedFound = actualTitles.includes(mappedTitle);
      
      if (!originalFound && !mappedFound) {
        missingTitles.push({ original: originalTitle, mapped: mappedTitle });
        console.log(`❌ 見つからない: "${originalTitle}" -> "${mappedTitle}"`);
      } else {
        foundTitles.push({ original: originalTitle, mapped: mappedTitle });
        console.log(`✅ 存在: "${originalTitle}" -> "${mappedTitle}"`);
      }
    });
    
    if (missingTitles.length > 0) {
      console.log("\n=== 存在しないタイトルの候補検索 ===");
      
      missingTitles.forEach(({ original, mapped }) => {
        console.log(`\n--- "${original}" の候補 ---`);
        
        // 部分一致で候補を検索
        const candidates = actualTitles.filter(title => {
          const originalLower = original.toLowerCase();
          const mappedLower = mapped.toLowerCase();
          const titleLower = title.toLowerCase();
          
          return titleLower.includes(mappedLower) || 
                 originalLower.includes(titleLower) ||
                 titleLower.includes(originalLower.substring(0, 5)) ||
                 mappedLower.includes(titleLower);
        });
        
        if (candidates.length > 0) {
          candidates.forEach(candidate => {
            console.log(`  候補: "${candidate}"`);
          });
        } else {
          console.log(`  候補が見つかりません`);
        }
      });
    }
    
    console.log(`\n=== 統計 ===`);
    console.log(`総タイトル数（外部データ）: ${actualTitles.length}`);
    console.log(`titleMapエントリ数: ${Object.keys(titleMap).length}`);
    console.log(`存在するマッピング: ${foundTitles.length}`);
    console.log(`存在しないマッピング: ${missingTitles.length}`);
    
  } catch (error) {
    console.error("エラー:", error);
  }
}

checkTitleMap();