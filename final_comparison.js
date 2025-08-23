// fetchMusicDataと同じ抽出方法でplayInfoと比較するスクリプト
const https = require('https');
const fs = require('fs');

function extractArrayFromScript(scriptText, variableName) {
  try {
    // functions.tsと同じ正規表現を使用
    const regex = new RegExp(`const\\\\s+${variableName}\\\\s*=\\\\s*(\\\\[[\\\\s\\\\S]*?\\\\]);`, 'i');
    const match = scriptText.match(regex);
    
    if (!match || !match[1]) {
      console.warn(`Variable ${variableName} not found in script`);
      return [];
    }
    
    // 配列文字列をJavaScriptとして評価
    const arrayStr = match[1];
    return eval(arrayStr);
  } catch (error) {
    console.error(`Error extracting ${variableName}:`, error);
    return [];
  }
}

function parseMusicItem(item) {
  try {
    // functions.tsと同じ処理
    const textMatch = item.match(/>([^<]+)</);
    const text = textMatch?.[1];
    if (!text) return null;

    // [dx]がついているかチェック
    const title = text.endsWith("[dx]") ? text.slice(0, -4) : text;
    const isDx = text.endsWith("[dx]");

    // クラス名から難易度と新曲フラグを抽出
    const classMatch = item.match(/class='([^']+)'/);
    const className = classMatch?.[1];
    if (!className) return null;

    // wk_r, wk_m, wk_e から難易度を抽出
    const difficulty = className.split('_')[1]; // wk_r -> r, wk_m -> m, wk_e -> e
    const isNew = className.endsWith("_n");

    // 有効な難易度でない場合はnullを返す
    if (!difficulty || !["r", "m", "e"].includes(difficulty)) {
      return null;
    }

    return {
      title,
      difficulty,
      isNew,
      isDx,
    };
  } catch (error) {
    console.error('Error parsing music item:', error, item);
    return null;
  }
}

async function fetchMusicDataAndCompare() {
  try {
    console.log("外部データを取得中...");
    const response = await new Promise((resolve, reject) => {
      https.get('https://sgimera.github.io/mai_RatingAnalyzer/scripts_maimai/maidx_in_lv_data_prismplus.js', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });

    const result = { r: [], m: [], e: [] };

    // レベル別の配列変数名とその基準レベル（functions.tsと同じ）
    const levelConfigs = [
      { variable: 'lv15_rslt', baseLevel: 15 },
      { variable: 'lv14_rslt', baseLevel: 14 },
      { variable: 'lv13_rslt', baseLevel: 13 },
      { variable: 'lv12_rslt', baseLevel: 12 },
      { variable: 'lv11_rslt', baseLevel: 11 },
      { variable: 'lv10_rslt', baseLevel: 10 },
      { variable: 'lv9_rslt', baseLevel: 9 },
      { variable: 'lv8_rslt', baseLevel: 8 },
      { variable: 'lv7_rslt', baseLevel: 7 },
      { variable: 'lv6_rslt', baseLevel: 6 },
      { variable: 'lv5_rslt', baseLevel: 5 },
    ];

    // 各レベル配列を処理
    for (const config of levelConfigs) {
      const levelArray = extractArrayFromScript(response, config.variable);
      
      levelArray.forEach((subArray, subIndex) => {
        // functions.tsと同じレベル計算
        const level = config.baseLevel === 15 
          ? 15.0 
          : Math.round((config.baseLevel + 0.9 - 0.1 * subIndex) * 10) / 10;
        
        subArray.forEach((item) => {
          const musicInfo = parseMusicItem(item);
          if (!musicInfo) return;

          const { title, difficulty, isNew, isDx } = musicInfo;

          // 難易度別にデータを振り分け
          if (difficulty === "r" || difficulty === "m" || difficulty === "e") {
            result[difficulty].push({
              title,
              level,
              isDx,
              isNew,
            });
          }
        });
      });
    }

    // 外部データから取得したすべての楽曲タイトルを収集
    const externalTitles = new Set();
    ['r', 'm', 'e'].forEach(difficulty => {
      result[difficulty].forEach(music => {
        externalTitles.add(music.title);
      });
    });

    console.log(`外部データ楽曲数: ${externalTitles.size}`);

    // playInfo.jsonを読み込み
    console.log("playInfo.jsonを読み込み中...");
    const playInfoData = JSON.parse(fs.readFileSync('./app/utils/playInfo.json', 'utf8'));
    
    const playInfoTitles = new Set();
    ['r', 'm', 'e'].forEach(difficulty => {
      if (playInfoData[difficulty]) {
        playInfoData[difficulty].forEach(song => {
          if (song.name) {
            playInfoTitles.add(song.name);
          }
        });
      }
    });
    
    console.log(`playInfo.json楽曲数: ${playInfoTitles.size}`);

    // 存在しない楽曲を特定
    const missingInExternal = [];
    const foundInExternal = [];
    
    Array.from(playInfoTitles).forEach(playInfoTitle => {
      if (!externalTitles.has(playInfoTitle)) {
        missingInExternal.push(playInfoTitle);
      } else {
        foundInExternal.push(playInfoTitle);
      }
    });

    console.log(`\n=== fetchMusicDataベース比較結果 ===`);
    console.log(`一致する楽曲: ${foundInExternal.length}`);
    console.log(`存在しない楽曲: ${missingInExternal.length}`);
    console.log(`一致率: ${((foundInExternal.length / playInfoTitles.size) * 100).toFixed(1)}%`);

    console.log(`\n=== 存在しない楽曲一覧 ===`);
    missingInExternal.forEach(title => {
      console.log(`❌ "${title}"`);
    });

    // より良い候補をを検索
    console.log(`\n=== 候補検索 ===`);
    const externalTitlesArray = Array.from(externalTitles);
    
    missingInExternal.forEach(missingTitle => {
      console.log(`\n"${missingTitle}" の候補:`);
      
      // 部分一致検索
      const candidates = externalTitlesArray.filter(externalTitle => {
        const missing = missingTitle.toLowerCase();
        const external = externalTitle.toLowerCase();
        
        // より良いマッチング条件
        return external.includes(missing) || 
               missing.includes(external) ||
               external.includes(missing.substring(0, Math.min(5, missing.length))) ||
               missing.includes(external.substring(0, Math.min(5, external.length)));
      });
      
      if (candidates.length > 0) {
        candidates.slice(0, 3).forEach((candidate, index) => {
          console.log(`  ${index + 1}. "${candidate}"`);
        });
      } else {
        console.log(`  候補が見つかりません`);
      }
    });

  } catch (error) {
    console.error("エラー:", error);
  }
}

fetchMusicDataAndCompare();