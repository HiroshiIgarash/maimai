// より精密なマッチング機能を持つスクリプト
const https = require('https');
const fs = require('fs');

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

// より高度なマッチング関数
function findBestMatches(targetTitle, candidateTitles, maxResults = 5) {
  const candidates = [];

  candidateTitles.forEach(candidate => {
    let score = 0;
    const targetLower = targetTitle.toLowerCase();
    const candidateLower = candidate.toLowerCase();

    // 1. 完全一致（最高スコア）
    if (targetLower === candidateLower) {
      score = 1000;
    }
    // 2. 部分一致（どちらかが他方を含む）
    else if (targetLower.includes(candidateLower) || candidateLower.includes(targetLower)) {
      score = 800;
    }
    // 3. 最初の5文字が一致
    else if (targetLower.substring(0, 5) === candidateLower.substring(0, 5) && targetLower.length >= 5) {
      score = 600;
    }
    // 4. 記号を除去して比較
    else {
      const targetClean = targetLower.replace(/[^\w\s]/g, '');
      const candidateClean = candidateLower.replace(/[^\w\s]/g, '');
      
      if (targetClean === candidateClean) {
        score = 700;
      }
      else if (targetClean.includes(candidateClean) || candidateClean.includes(targetClean)) {
        score = 500;
      }
      // 5. 最初の3文字が一致
      else if (targetClean.substring(0, 3) === candidateClean.substring(0, 3) && targetClean.length >= 3) {
        score = 300;
      }
      // 6. 単語の共通部分をチェック
      else {
        const targetWords = targetClean.split(/\s+/);
        const candidateWords = candidateClean.split(/\s+/);
        let commonWords = 0;
        
        targetWords.forEach(word => {
          if (word.length >= 2 && candidateWords.some(cword => cword.includes(word) || word.includes(cword))) {
            commonWords++;
          }
        });
        
        if (commonWords > 0) {
          score = commonWords * 100;
        }
      }
    }

    if (score > 0) {
      candidates.push({ title: candidate, score });
    }
  });

  // スコア順でソートして上位結果を返す
  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(c => c.title);
}

async function findBetterMatches() {
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
    
    // playInfo.jsonにあって外部データにない楽曲を検索
    const missingInExternal = [];
    
    playInfoTitlesArray.forEach(playInfoTitle => {
      if (!externalTitles.includes(playInfoTitle)) {
        missingInExternal.push(playInfoTitle);
      }
    });
    
    console.log(`\n=== 存在しない楽曲の詳細マッチング結果 (${missingInExternal.length}曲) ===`);
    
    const titleMapUpdates = {};
    
    missingInExternal.forEach(title => {
      console.log(`\n❌ "${title}"`);
      
      // より高精度なマッチング
      const bestMatches = findBestMatches(title, externalTitles, 3);
      
      if (bestMatches.length > 0) {
        console.log(`   推奨候補:`);
        bestMatches.forEach((candidate, index) => {
          console.log(`     ${index + 1}. "${candidate}"`);
        });
        
        // 最も良い候補があれば、titleMapの更新候補として記録
        if (bestMatches.length > 0) {
          titleMapUpdates[title] = bestMatches[0];
        }
      } else {
        console.log(`   適切な候補が見つかりません`);
      }
    });
    
    console.log(`\n=== titleMap更新候補 ===`);
    Object.keys(titleMapUpdates).forEach(originalTitle => {
      console.log(`"${originalTitle}": "${titleMapUpdates[originalTitle]}",`);
    });
    
  } catch (error) {
    console.error("エラー:", error);
  }
}

findBetterMatches();