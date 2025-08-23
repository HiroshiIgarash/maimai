// 外部データのデバッグ用スクリプト
const https = require('https');

function extractArrayFromScript(scriptText, variableName) {
  try {
    const regex = new RegExp(`const\\s+${variableName}\\s*=\\s*(\\[\\s\\S]*?\\]);`, 'i');
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

https.get('https://sgimera.github.io/mai_RatingAnalyzer/scripts_maimai/maidx_in_lv_data_prismplus.js', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log("=== スクリプトファイルの最初の500文字 ===");
    console.log(data.substring(0, 500));
    
    console.log("\n=== lv15_rsltの抽出結果 ===");
    const lv15Array = extractArrayFromScript(data, 'lv15_rslt');
    console.log(`lv15_rsltの配列数: ${lv15Array.length}`);
    
    if (lv15Array.length > 0) {
      console.log("最初のサブ配列:");
      console.log(lv15Array[0]);
      
      if (lv15Array[0] && lv15Array[0].length > 0) {
        console.log("\n最初のアイテム:");
        console.log(lv15Array[0][0]);
        
        console.log("\nパース結果:");
        const parsed = parseMusicTitle(lv15Array[0][0]);
        console.log(parsed);
      }
    }
    
    console.log("\n=== 全レベル配列の確認 ===");
    const levelConfigs = [
      'lv15_rslt', 'lv14_rslt', 'lv13_rslt', 'lv12_rslt', 'lv11_rslt',
      'lv10_rslt', 'lv9_rslt', 'lv8_rslt', 'lv7_rslt', 'lv6_rslt', 'lv5_rslt'
    ];

    levelConfigs.forEach(variable => {
      const levelArray = extractArrayFromScript(data, variable);
      console.log(`${variable}: ${levelArray.length} sub-arrays`);
    });
    
    // 全タイトルを抽出してサンプル表示
    const allTitles = new Set();
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

    console.log(`\n=== 抽出されたタイトル総数: ${allTitles.size} ===`);
    const titlesArray = Array.from(allTitles);
    console.log("最初の20個のタイトル:");
    titlesArray.slice(0, 20).forEach((title, index) => {
      console.log(`${index + 1}. "${title}"`);
    });
    
    // playInfo.jsonから一部のタイトルが存在するかチェック
    const testTitles = [
      "ビビデバ", 
      "はいよろこんで", 
      "アイドル",
      "Phantom Joke", 
      "アルケミィ", 
      "GOODBOUNCE"
    ];
    
    console.log("\n=== playInfo.jsonのタイトル存在チェック ===");
    testTitles.forEach(testTitle => {
      const exists = titlesArray.includes(testTitle);
      console.log(`"${testTitle}": ${exists ? '存在' : '存在しない'}`);
    });
  });
}).on('error', (err) => {
  console.error("エラー:", err);
});