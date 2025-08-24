import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calculateMaimaiRating,
  generateMusicRatingInfoListFromMusicData,
} from "../utils/functions";
import AllDifficultyPlayInfo from "../utils/playInfo.json";
import { MusicRatingInfo } from "../utils/types/type";
import PlayInfoTableView from "./PlayInfoTableView";
import { calculateGoalScore } from "../utils/functions";

interface playInfoTableProps {
  musicData: {
    r: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    m: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
    e: Array<{ title: string; level: number; isDx: boolean; isNew: boolean }>;
  };
  searchParams?: { goalRatingOffset: number };
}

const PlayInfoTable = ({ musicData }: playInfoTableProps) => {
  const e = AllDifficultyPlayInfo.e;
  const m = AllDifficultyPlayInfo.m;
  const r = AllDifficultyPlayInfo.r;

  /** PlayInfoが変更された際に各テーブルのStateを初期化するためのKey */
  const AllDifficultyPlayInfoKey = JSON.stringify(AllDifficultyPlayInfo);

  const AllDifficultyMusicScore: MusicRatingInfo[] = [
    ...generateMusicRatingInfoListFromMusicData(e, musicData, "e"),
    ...generateMusicRatingInfoListFromMusicData(m, musicData, "m"),
    ...generateMusicRatingInfoListFromMusicData(r, musicData, "r"),
  ];

  const sortedAllDifficultyMusicScore = AllDifficultyMusicScore.toSorted(
    (a, b) => b.rating - a.rating
  );

  const ratingTargetNewMusicScore = sortedAllDifficultyMusicScore
    .filter((s) => s.isNew)
    .slice(0, 15);
  const ratingTargetOldMusicScore = sortedAllDifficultyMusicScore
    .filter((s) => !s.isNew)
    .slice(0, 35);

  const minNewRating = ratingTargetNewMusicScore.at(-1)?.rating;
  const minOldRating = ratingTargetOldMusicScore.at(-1)?.rating;

  const toDisplayGoalScore = (goalScore: number) => {
    // 1.005より大きい場合、達成不可能なので "-"を返す
    if (goalScore > 1.005) return "-";

    return Math.round(goalScore * 10000) / 10000;
  };

  return (
    <div className="space-y-16">
      <div>
        現在のRating: {calculateMaimaiRating(sortedAllDifficultyMusicScore)}
      </div>
      <div>
        <div className="flex gap-16 max-w-[700px]">
          {[12, 13].map((baseRate) => (
            <Table key={baseRate}>
              <TableHeader>
                <TableRow>
                  <TableHead>譜面定数</TableHead>
                  <TableHead>目標スコア</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 10 }, (_, i) => baseRate + i * 0.1).map(
                  (rate) => {
                    return (
                      <TableRow key={rate}>
                        <TableCell>{rate.toFixed(1)}</TableCell>
                        <TableCell>
                          {toDisplayGoalScore(
                            calculateGoalScore(minOldRating || 0, rate)
                          )}
                          　（
                          {toDisplayGoalScore(
                            calculateGoalScore(minNewRating || 0, rate)
                          )}
                          ）
                        </TableCell>
                      </TableRow>
                    );
                  }
                )}
              </TableBody>
            </Table>
          ))}
        </div>
      </div>
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
            new: ratingTargetNewMusicScore.at(-1)?.rating,
          }}
        />
      </div>
    </div>
  );
};

export default PlayInfoTable;
