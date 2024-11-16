
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
 * ドキュメントからプレイ情報を返却する
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
 * ランクに応じたプレイ情報を取得する
 * @param {'e' | 'm' | 'r'} difficulty 
 */
const generatePlayInfo = async (difficulty) => {
  console.log(`【${difficulty}】のプレイ情報を取得中・・・`)

  const difficultyNum = difficulty === 'e' ? 2 : difficulty === 'm' ? 3 : difficulty === 'r' ? 4 : 0
  const doc = await fetchHTMLDocument(`https://maimaidx.jp/maimai-mobile/record/musicGenre/search/?genre=99&diff=${difficultyNum}`)
  const playInfo = generatePlayInfoFromDoc(doc)

  return playInfo
}

const generateAllDifficultyPlayInfo = async () => {
  const data =
  {
    e: await generatePlayInfo('e'),
    m: await generatePlayInfo('m'),
    r: await generatePlayInfo('r')
  }

  return data
}

/**
 * ドキュメントからプレイ回数を返却する
 * @param {Document} doc 
 * @returns 
 */
const generatePlayCountFromDoc = (doc = window?.document) => {
  const musicInfoElms = doc.querySelectorAll(".w_450.m_15.p_3.f_0");

  const musicInfoObj = Array.from(musicInfoElms).map(infoElm => {
    const musicTitle = infoElm.querySelector(".music_name_block").innerHTML;
    const playCount = infoElm.querySelector(".music_score_block")?.innerText.match(/：(.*)回/)?.[1]
    if (!playCount) console.log(infoElm.querySelector(".music_score_block")?.innerText)
    const isDx = infoElm.querySelector(".music_kind_icon").src === "https://maimaidx.jp/maimai-mobile/img/music_dx.png"


    return {
      name: musicTitle,
      count: playCount && Number(playCount),
      isDx
    }
  })

  return musicInfoObj
}

/**
 * ランクに応じたプレイ回数を取得する
 * @param {'e' | 'm' | 'r'} difficulty 
 */
const generatePlayCount = async (difficulty) => {
  console.log(`【${difficulty}】のプレイ回数を取得中・・・`)

  const difficultyNum = difficulty === 'e' ? 2 : difficulty === 'm' ? 3 : difficulty === 'r' ? 4 : 0
  const doc = await fetchHTMLDocument(`https://maimaidx.jp/maimai-mobile/record/musicMybest/search/?diff=${difficultyNum}`)
  const playCount = generatePlayCountFromDoc(doc)

  return playCount
}

const generateAllDifficultyPlayCount = async () => {
  const data =
  {
    e: await generatePlayCount('e'),
    m: await generatePlayCount('m'),
    r: await generatePlayCount('r')
  }

  return data
}

const main = async () => {
  const playInfo = await generateAllDifficultyPlayInfo()
  const playCount = await generateAllDifficultyPlayCount()

  // プレイ回数をplayInfoにマージ
  playCount.e.forEach(playCountItem => {
    const { name, count, isDx } = playCountItem
    const playInfoIndex = playInfo.e.findIndex(item => item.name === name && item.isDx === isDx)
    if (playInfoIndex !== -1) {
      playInfo.e[playInfoIndex].count = count
    } else {
      console.log(`プレイ情報が見つかりません:e ${name} (${isDx ? 'DX' : 'N'})`)
    }
  })
  playCount.m.forEach(playCountItem => {
    const { name, count, isDx } = playCountItem
    const playInfoIndex = playInfo.m.findIndex(item => item.name === name && item.isDx === isDx)
    if (playInfoIndex !== -1) {
      playInfo.m[playInfoIndex].count = count
    } else {
      console.log(`プレイ情報が見つかりません:m ${name} (${isDx ? 'DX' : 'N'})`)
    }
  })
  playCount.r.forEach(playCountItem => {
    const { name, count, isDx } = playCountItem
    const playInfoIndex = playInfo.r.findIndex(item => item.name === name && item.isDx === isDx)
    if (playInfoIndex !== -1) {
      playInfo.r[playInfoIndex].count = count
    } else {
      console.log(`プレイ情報が見つかりません:r ${name} (${isDx ? 'DX' : 'N'})`)
    }
  })

  console.log(playInfo)
}

main();


