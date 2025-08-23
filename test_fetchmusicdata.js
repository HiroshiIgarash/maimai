// アプリケーションのfetchMusicData関数をテスト
const { fetchMusicData } = require('./app/utils/functions.ts');

async function testFetchMusicData() {
  try {
    console.log("fetchMusicData()を実行中...");
    const musicData = await fetchMusicData();
    
    console.log("=== 結果 ===");
    console.log(`Re:MASTER楽曲数: ${musicData.r.length}`);
    console.log(`MASTER楽曲数: ${musicData.m.length}`);
    console.log(`EXPERT楽曲数: ${musicData.e.length}`);
    
    const allTitles = new Set();
    ['r', 'm', 'e'].forEach(difficulty => {
      musicData[difficulty].forEach(music => {
        allTitles.add(music.title);
      });
    });
    
    console.log(`総楽曲数: ${allTitles.size}`);
    
    // いくつかのサンプルタイトルを表示
    const titlesArray = Array.from(allTitles);
    console.log("\n最初の20タイトル:");
    titlesArray.slice(0, 20).forEach((title, index) => {
      console.log(`${index + 1}. "${title}"`);
    });
    
  } catch (error) {
    console.error("エラー:", error);
  }
}

testFetchMusicData();