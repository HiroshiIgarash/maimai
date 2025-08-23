// playInfo.jsonと外部JSデータを比較するスクリプト
const https = require('https');
const fs = require('fs');

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

function fetchExternalMusicTitles() {
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

async function compareData() {
  try {
    console.log("外部データから楽曲リストを取得中...");
    const externalTitles = await fetchExternalMusicTitles();
    
    console.log("playInfo.jsonを読み込み中...");
    const playInfoData = JSON.parse(fs.readFileSync('./app/utils/playInfo.json', 'utf8'));
    
    // playInfo.jsonからすべての楽曲名を抽出
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
    
    const playInfoTitlesArray = Array.from(playInfoTitles);
    
    console.log("\n=== データ比較結果 ===");
    console.log(`外部データ楽曲数: ${externalTitles.length}`);
    console.log(`playInfo.json楽曲数: ${playInfoTitlesArray.length}`);
    
    // playInfo.jsonにあって外部データにない楽曲を検索
    const missingInExternal = [];
    const foundInExternal = [];
    
    playInfoTitlesArray.forEach(playInfoTitle => {
      if (!externalTitles.includes(playInfoTitle)) {
        missingInExternal.push(playInfoTitle);
      } else {
        foundInExternal.push(playInfoTitle);
      }
    });
    
    console.log(`\n=== playInfo.jsonにあるが外部データにない楽曲 (${missingInExternal.length}曲) ===`);
    missingInExternal.forEach(title => {
      console.log(`❌ "${title}"`);
      
      // 類似楽曲を検索
      const candidates = externalTitles.filter(externalTitle => {
        const titleLower = title.toLowerCase();
        const externalLower = externalTitle.toLowerCase();
        
        // より柔軟なマッチング条件
        return externalLower.includes(titleLower.substring(0, 5)) ||
               titleLower.includes(externalLower.substring(0, 5)) ||
               externalLower.includes(titleLower.replace(/[^\w\s]/g, '').substring(0, 5)) ||
               titleLower.includes(externalLower.replace(/[^\w\s]/g, '').substring(0, 5));
      });
      
      if (candidates.length > 0) {
        console.log(`   候補:`);
        candidates.slice(0, 5).forEach(candidate => { // 最大5個まで表示
          console.log(`     "${candidate}"`);
        });
      } else {
        console.log(`   候補が見つかりません`);
      }
      console.log('');
    });
    
    // 統計情報
    console.log(`=== 統計 ===`);
    console.log(`外部データにも存在する楽曲: ${foundInExternal.length}`);
    console.log(`外部データにない楽曲: ${missingInExternal.length}`);
    console.log(`一致率: ${((foundInExternal.length / playInfoTitlesArray.length) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error("エラー:", error);
  }
}

compareData();