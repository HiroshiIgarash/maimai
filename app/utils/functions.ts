import { JSDOM } from "jsdom";
import { MusicDifficulty, MusicRatingInfo, PlayInfo } from "./types/type";
import { calculateSingleRating } from "./functions_browser";

const titleMap: { [key: string]: string } = {
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
  "メイトなやつら（FEAT. 天開司, 佐藤ホームズ, あっくん大魔王 &amp; 歌衣メイカ）": "メイトなやつら"
}


/**
 * 譜面定数および旧曲・新曲を検索する
 * @param document table.htmlのドキュメント
 * @param musicTitle 楽曲名
 * @param difficulty 難易度
 * @returns 
 */

const searchRealLevelAndIsNew = (
  document: Document,
  musicTitle: string,
  isDx: boolean,
  difficulty: MusicDifficulty): {
    level: number | undefined,
    isNew: boolean | undefined
  } => {
  const title = titleMap[musicTitle] || musicTitle
  const musicElms = document.querySelectorAll<HTMLElement>(`.wk_${difficulty},.wk_${difficulty}_n`); // difficultyに応じた全楽曲を取得

  // 楽曲名にエスケープ必須の文字列が入っている場合の対策
  const escapedMusicTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // DXの場合は[dx]付きの楽曲名を、そうでない場合は[dx]がつかないものを探す正規表現
  const reg = isDx ? new RegExp(`^${escapedMusicTitle}\\[dx`) : new RegExp(`^${escapedMusicTitle}$`)

  const targetMusicElm = Array.from(musicElms).filter(m => m.textContent?.match(reg))

  // 該当の楽曲がなかったらlevel, isNewともにundefinedを返す
  if (!targetMusicElm.length) {
    return {
      level: undefined,
      isNew: undefined
    }
  }

  const isNew = targetMusicElm[0].classList.contains(`wk_${difficulty}_n`)

  const td = targetMusicElm.at(0)?.closest("td")

  if (td?.classList.contains("not_eval_music")) {
    // 未検証譜面

    return {
      level: undefined,
      isNew
    }
  } else {
    // 検証済

    const levelCell = targetMusicElm.at(0)?.closest("td")?.previousElementSibling
    const level = Number(levelCell?.textContent?.replace(/\(.*/, ""))
    return {
      level: level,
      isNew
    }
  }

}


/**
 * url先のDocumentを返す
 * @param url 
 * @returns 
 */
export const fetchHTMLDocument = async (url: string) => {
  const res = await fetch(url)
  const text = await res.text()
  const dom = new JSDOM(text)

  return dom.window.document
}




/**
 * プレイ情報から楽曲レーティング情報のリストを返す
 * @param playInfo 
 * @param tableDocument 
 * @param difficulty 
 * @returns 
 */
export const generateMusicRatingInfoListFromPlayInfo = (playInfo: PlayInfo[], tableDocument: Document, difficulty: MusicDifficulty): MusicRatingInfo[] => {
  const musicRatingInfoList = playInfo.map(info => {
    const { name, score, isDx, displayLevel, count } = info
    const { level: realLevel, isNew } = searchRealLevelAndIsNew(tableDocument, info.name, info.isDx, difficulty)
    /** レーティング算出時に用いるレベル。レベル不明であれば表示されるレベルを用いる */
    const levelUsingRatingCalculate = realLevel || displayLevel

    const rating = calculateSingleRating(levelUsingRatingCalculate, score)

    return {
      name,
      difficulty,
      isDx,
      isNew,
      score,
      rating,
      realLevel,
      displayLevel,
      levelUsingRatingCalculate,
      count
    }
  })

  return musicRatingInfoList
}


/**
 * 楽曲レーティング情報からでらっくすRATINGを算出する
 * @param musicRatingInfoList 楽曲レーティング情報
 * @returns 
 */
export const calculateMaimaiRating = async (musicRatingInfoList: MusicRatingInfo[]) => {
  const targetMusicRatingInfoList = [
    ...musicRatingInfoList.filter(musicRatingInfo => musicRatingInfo.isNew).slice(0, 15),
    ...musicRatingInfoList.filter(musicRatingInfo => !musicRatingInfo.isNew).slice(0, 35)
  ]

  const rating = targetMusicRatingInfoList.reduce((prev, currentMusicRatingInfo) => {
    return prev + currentMusicRatingInfo.rating
  }, 0)

  return rating
}

