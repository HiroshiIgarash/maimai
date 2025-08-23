// 修正されたデータ抽出スクリプト
const https = require('https');
const fs = require('fs');

function extractArrayFromScript(scriptText, variableName) {
  try {
    // より堅牢な正規表現：複数行にまたがる配列を捕捉
    const regex = new RegExp(`const\\s+${variableName}\\s*=\\s*(\\[[\\s\\S]*?\\n\\];)`, 'gm');
    const match = scriptText.match(regex);
    
    if (!match || !match[0]) {
      console.log(`Variable ${variableName} not found in script`);
      return [];
    }
    
    // 配列部分だけを抽出
    const arrayMatch = match[0].match(/\[([\s\S]*?)\];/);
    if (!arrayMatch) {
      console.log(`Array content for ${variableName} not found`);
      return [];
    }
    
    const arrayContent = '[' + arrayMatch[1] + ']';
    return eval(arrayContent);
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

async function extractAndCompare() {
  try {
    console.log("外部データから楽曲リストを取得中...");
    const response = await new Promise((resolve, reject) => {
      https.get('https://sgimera.github.io/mai_RatingAnalyzer/scripts_maimai/maidx_in_lv_data_prismplus.js', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
    
    console.log("=== 修正された抽出結果 ===");
    const levelConfigs = [
      'lv15_rslt', 'lv14_rslt', 'lv13_rslt', 'lv12_rslt', 'lv11_rslt',
      'lv10_rslt', 'lv9_rslt', 'lv8_rslt', 'lv7_rslt', 'lv6_rslt', 'lv5_rslt'
    ];

    const allTitles = new Set();

    levelConfigs.forEach(variable => {
      const levelArray = extractArrayFromScript(response, variable);
      console.log(`${variable}: ${levelArray.length} sub-arrays`);
      
      levelArray.forEach(subArray => {
        subArray.forEach(item => {
          const title = parseMusicTitle(item);
          if (title) {
            allTitles.add(title);
          }
        });
      });
    });

    console.log(`\n抽出されたタイトル総数: ${allTitles.size}`);
    const titlesArray = Array.from(allTitles);
    
    if (titlesArray.length > 0) {
      console.log("最初の20個のタイトル:");
      titlesArray.slice(0, 20).forEach((title, index) => {
        console.log(`${index + 1}. "${title}"`);
      });
    }

    // playInfo.jsonと比較
    console.log("\nplayInfo.jsonを読み込み中...");
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
    
    const playInfoTitlesArray = Array.from(playInfoTitles);
    console.log(`\nplayInfo.json楽曲数: ${playInfoTitlesArray.length}`);
    console.log(`外部データ楽曲数: ${titlesArray.length}`);
    
    // 存在しない楽曲を特定
    const missingInExternal = [];
    playInfoTitlesArray.forEach(playInfoTitle => {
      if (!titlesArray.includes(playInfoTitle)) {
        missingInExternal.push(playInfoTitle);
      }
    });
    
    console.log(`\n存在しない楽曲数: ${missingInExternal.length}`);
    console.log("存在しない楽曲の最初の10個:");
    missingInExternal.slice(0, 10).forEach(title => {
      console.log(`❌ "${title}"`);
    });
    
  } catch (error) {
    console.error("エラー:", error);
  }
}

extractAndCompare();