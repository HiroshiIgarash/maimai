const titleMap = {
  "バラバラ〜仮初レインボーローズ〜": "バラバラ",
  "アノーイング！さんさんウィーク！": "アノーイング！",
  "ようこそジャパリパークへ": "ジャパリパーク",
  "にっこり^^調査隊のテーマ": "にっこり調査隊",
  "みくみくにしてあげる♪【してやんよ】": "みくみくにしてあげる",
  "Link": "Link (nico)",
  "Bad Apple!! feat nomico": "Bad Apple!!",
}

/**
 * 達成率からRank係数を算出する
 * @param {number} score 達成率
 * @returns Rank係数
 */
const rateByScore = (score) => {
  if (score > 1.05) return 22.4;
  if (score > 1) return 21.6;
  if (score > 0.995) return 21.1;
  if (score > 0.99) return 20.8;
  if (score > 0.98) return 20.3;
  if (score > 0.97) return 20.0;
  if (score > 0.94) return 16.8;
  if (score > 0.90) return 13.6;
}

/**
 * 
 * @param {Document} document table.htmlのドキュメント
 * @param {string} musicTitle 楽曲名
 * @param {'e' | 'm' | 'r'} rank 楽曲名
 * @returns 
 */
const searchRealLevel = (document, musicTitle, isDx, rank) => {
  const title = titleMap[musicTitle] || musicTitle
  const musics = document.querySelectorAll(`.wk_${rank},.wk_${rank}_n`); // rankに応じた全楽曲を取得

  const escapedMusicTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const reg = isDx ? new RegExp(`^${escapedMusicTitle}\\[dx`) : new RegExp(`^${escapedMusicTitle}$`)

  const targetMusicElm = Array.from(musics).filter(m => m.innerHTML.match(reg))

  if (!targetMusicElm.length) return

  const lvCell = targetMusicElm[0]?.closest("td").previousElementSibling
  const lv = Number(lvCell.innerText.replace(/\(.*/, ""))

  return {
    lv,
    isNew: targetMusicElm[0].classList.contains(`wk_${rank}_n`)
  }
}

/**
 * url先のdocumentを返す
 * @param {string} url 
 * @returns Document
 */
const fetchHTMLDocument = async (url) => {
  const res = await fetch(url)
  const text = await res.text()
  const document = new DOMParser().parseFromString(text, "text/html")

  return document
}

/**
 * プレイ情報を返却する
 * @param {Document} doc 
 * @returns 
 */
const generatePlayInfoFromDoc = (doc = window?.document) => {
  const musicInfoElms = doc.querySelectorAll(".w_450.m_15.p_r.f_0");

  const musicInfoObj = Array.from(musicInfoElms).map(infoElm => {
    const musicTitle = infoElm.querySelector(".music_name_block").innerHTML;
    const scorePercent = infoElm.querySelector(".music_score_block")?.innerHTML.replace("%", "");
    const scoreNum = scorePercent ? Number(scorePercent) / 100 : undefined;
    const displayedLevelStr = infoElm.querySelector(".music_lv_block").innerHTML;
    const displayedLevelNum = Number(displayedLevelStr.replace("+", ".5"))
    const isDx = infoElm.querySelector(".music_kind_icon").src === "https://maimaidx.jp/maimai-mobile/img/music_dx.png"


    return {
      name: musicTitle,
      score: scoreNum,
      displayLevel: displayedLevelNum,
      isDx
    }
  }).filter(info => info.score)

  return musicInfoObj
}

/**
 * プレイ情報から楽曲スコアのリストを返す
 * @param {*} playInfo 
 * @param {Document} tableDocument 
 */
const generateMusicScoreObjFromPlayInfo = (playInfo, tableDocument) => {
  playInfo.map(info => {
    const rate = rateByScore(info.score)
    const { lv: realLevel, isNew } = searchRealLevel(tableDocument, info.name, info.isDx, "m")
    const level = realLevel || info.displayLevel

    const musicScore = Math.floor(level * Math.min(info.score, 1.005) * rate)

    return {
      name: info.name,
      musicScore,
      score: info.score,
      level,
      realLevel: !!realLevel,
      isDx: info.isDx,
      isNew
    }
  })
}

const init = async () => {
  const levelTableDocument = await fetchHTMLDocument("http://192.168.68.84:5500/table.html")

  const playInfo = generatePlayInfoFromDoc();

  const musicScoreObj = generateMusicScoreObjFromPlayInfo(playInfo, levelTableDocument)

  musicScoreObj.sort((a, b) => b.musicScore - a.musicScore)

  console.log(musicScoreObj.filter(m => m.isNew))
  console.log(musicScoreObj.filter(m => !m.isNew))

}

window.addEventListener("DOMContentLoaded", init)