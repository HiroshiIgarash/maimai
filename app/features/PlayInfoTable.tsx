
import { calculateMaimaiRating, generateMusicRatingInfoListFromPlayInfo } from "../utils/functions";
import AllDifficultyPlayInfo from "../utils/playInfo.json";
import { MusicRatingInfo } from "../utils/types/type";
import PlayInfoTableView from "./PlayInfoTableView";

interface playInfoTableProps {
  tableDocument: Document,
  searchParams?: { goalRatingOffset: number }
}

const PlayInfoTable = ({ tableDocument }: playInfoTableProps) => {

  const e = AllDifficultyPlayInfo.e;
  const m = AllDifficultyPlayInfo.m;
  const r = AllDifficultyPlayInfo.r

  /** PlayInfoが変更された際に各テーブルのStateを初期化するためのKey */
  const AllDifficultyPlayInfoKey = JSON.stringify(AllDifficultyPlayInfo)

  const AllDifficultyMusicScore: MusicRatingInfo[] = [
    ...generateMusicRatingInfoListFromPlayInfo(e, tableDocument, "e"),
    ...generateMusicRatingInfoListFromPlayInfo(m, tableDocument, "m"),
    ...generateMusicRatingInfoListFromPlayInfo(r, tableDocument, "r"),
  ]

  const sortedAllDifficultyMusicScore = AllDifficultyMusicScore.toSorted((a, b) => b.rating - a.rating)

  const ratingTargetNewMusicScore = sortedAllDifficultyMusicScore.filter(s => s.isNew).slice(0, 15)
  const ratingTargetOldMusicScore = sortedAllDifficultyMusicScore.filter(s => !s.isNew).slice(0, 35)

  return (
    <div className="space-y-16">
      <div>現在のRating: {calculateMaimaiRating(sortedAllDifficultyMusicScore)}</div>
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          レーティング対象【新曲】
        </h2>
        <PlayInfoTableView
          key={AllDifficultyPlayInfoKey}
          musicRatingInfoList={ratingTargetNewMusicScore}
          minRating={ratingTargetNewMusicScore.at(-1)?.rating}
        />
      </div>
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          レーティング対象【旧曲】
        </h2>
        <PlayInfoTableView
          key={AllDifficultyPlayInfoKey}
          musicRatingInfoList={ratingTargetOldMusicScore}
          minRating={ratingTargetOldMusicScore.at(-1)?.rating}
        />
      </div>
      <div className="space-y-4">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          全楽曲単曲レート
        </h2>
        <PlayInfoTableView
          key={AllDifficultyPlayInfoKey}
          musicRatingInfoList={sortedAllDifficultyMusicScore}
          minRating={{
            old: ratingTargetOldMusicScore.at(-1)?.rating,
            new: ratingTargetNewMusicScore.at(-1)?.rating
          }}
        />
      </div>
    </div>

  )
}

export default PlayInfoTable