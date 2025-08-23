"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { MusicDifficultyMap, MusicRatingInfo } from "../utils/types/type";
import {
  calculateGoalScore,
  rankByScore,
  calculateSingleRating,
} from "../utils/functions_browser";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface PlayInfoTableViewProps {
  musicRatingInfoList: MusicRatingInfo[];
  /** レーティング対象の最低単曲レート */
  minRating?:
    | number
    | {
        old?: number;
        new?: number;
      };
}

const toDisplayGoalScore = (goalScore: number) => {
  // 1.005より大きい場合、達成不可能なので "-"を返す
  if (goalScore > 1.005) return "-";

  return Math.round(goalScore * 1000000) / 1000000;
};

const RANKS = ["SSS+", "SSS", "SS+", "SS", "S+", "S", "AAA", "AA", "A", "B", "C", "D"]; // 必要に応じて調整

const PlayInfoTableView = ({
  musicRatingInfoList,
  minRating: minRatingFromProps,
}: PlayInfoTableViewProps) => {
  const [goalRatingOffset, setGoalRatingOffset] = useState(4);
  const [sortedMusicRating, setSortedMusicRating] =
    useState(musicRatingInfoList);
  const [sortSingleRatingStatus, setSortSingleRatingStatus] = useState<
    "ASC" | "DESC"
  >("DESC");
  const [sortRealLevelStatus, setSortRealLevelStatus] = useState<
    "ASC" | "DESC"
  >("DESC");
  const [sortOldOrNewStatus, setSortOldOrNewStatus] = useState<
    "ALL" | "NEW" | "OLD"
  >("ALL");
  const [sortDiffToGoalScoreStatus, setSortDiffToGoalScoreStatus] = useState<
    "ASC" | "DESC"
  >("DESC");
  const [selectedRanks, setSelectedRanks] = useState<string[]>(RANKS);
  const [goalScoreFilter, setGoalScoreFilter] = useState<string>("all");

  const handleSortByRealLevel = () => {
    const newState = sortRealLevelStatus === "ASC" ? "DESC" : "ASC";
    setSortRealLevelStatus(newState);
    setSortedMusicRating((current) => {
      if (newState === "ASC") {
        return current.toSorted(
          (a, b) => a.levelUsingRatingCalculate - b.levelUsingRatingCalculate
        );
      } else {
        return current.toSorted(
          (a, b) => b.levelUsingRatingCalculate - a.levelUsingRatingCalculate
        );
      }
    });
  };

  const handleSortBySingleRating = () => {
    const newState = sortSingleRatingStatus === "ASC" ? "DESC" : "ASC";
    setSortSingleRatingStatus(newState);
    setSortedMusicRating((current) => {
      if (newState === "ASC") {
        return current.toSorted((a, b) => a.rating - b.rating);
      } else {
        return current.toSorted((a, b) => b.rating - a.rating);
      }
    });
  };


  const handleSortOldOrNewStatus = () => {
    switch (sortOldOrNewStatus) {
      case "ALL":
        setSortOldOrNewStatus("NEW");
        break;
      case "NEW":
        setSortOldOrNewStatus("OLD");
        break;
      case "OLD":
        setSortOldOrNewStatus("ALL");
        break;
      default:
        const UNREACHED: never = sortOldOrNewStatus;
        return UNREACHED;
    }
  };

  const handleSortDiffToGoalScoreStatus = () => {
    const newState = sortDiffToGoalScoreStatus === "ASC" ? "DESC" : "ASC";
    setSortDiffToGoalScoreStatus(newState);
    setSortedMusicRating((current) => {
      const calculateDiffToGoalScoreByMusicRating = (
        musicRating: MusicRatingInfo
      ) => {
        const { musicGoalRating } =
          calculateGoalRatingByMusicRating(musicRating);
        const goalScore = calculateGoalScore(
          musicGoalRating,
          musicRating.levelUsingRatingCalculate
        );
        const diff =
          goalScore <= 1.005
            ? Math.round(goalScore * 1000000 - musicRating.score * 1000000) /
              1000000
            : 999;
        return diff;
      };
      if (newState === "ASC") {
        return current.toSorted(
          (a, b) =>
            calculateDiffToGoalScoreByMusicRating(a) -
            calculateDiffToGoalScoreByMusicRating(b)
        );
      } else {
        return current.toSorted(
          (a, b) =>
            calculateDiffToGoalScoreByMusicRating(b) -
            calculateDiffToGoalScoreByMusicRating(a)
        );
      }
    });
  };

  const handleRankChange = (rank: string) => {
    setSelectedRanks((prev) =>
      prev.includes(rank)
        ? prev.filter((r) => r !== rank)
        : [...prev, rank]
    );
  };

  /**
   * 目標レーティングを算出する
   * @param musicRating
   * @returns
   */
  const calculateGoalRatingByMusicRating = (musicRating: MusicRatingInfo) => {
    /** レーティング対象の最低単曲レート。undefinedの場合、その曲のレートに設定する。 */
    let minRating: number;
    /** オブジェクトの場合（number型でない場合、）新曲か旧曲かで最低単曲レートを設定する。undefinedの場合、その曲のレートに設定する。 */
    if (typeof minRatingFromProps !== "number") {
      if (musicRating.isNew) {
        minRating = minRatingFromProps?.new || musicRating.rating;
      } else {
        minRating = minRatingFromProps?.old || musicRating.rating;
      }
    } else {
      minRating = minRatingFromProps;
    }
    /**
     * 最低単曲レートよりも高い場合レーティング対象に入っているため、その曲のレートを基準として目標レートを設定する
     * 最低単曲レートよりも低い場合レーティング対象に入っていないため、最低単曲レートを基準として目標レートを設定する
     */
    const musicGoalRating =
      musicRating.rating >= minRating
        ? musicRating.rating + goalRatingOffset
        : minRating + goalRatingOffset;

    return { musicGoalRating, minRating };
  };

  return (
    <div className="space-y-4">
      <div className="ml-auto w-fit flex items-center gap-4">
        目標スコア上昇値：
        <Input
          className="w-40 inline-block"
          type="number"
          min={1}
          value={goalRatingOffset}
          onChange={(e) => setGoalRatingOffset(Number(e.currentTarget.value))}
        />
        <Popover>
          <PopoverTrigger asChild>
            <button className="border rounded px-2 py-1 bg-white shadow">
              ランク絞り込み
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="flex flex-col gap-2">
              {RANKS.map((rank) => (
                <label key={rank} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedRanks.includes(rank)}
                    onCheckedChange={() => handleRankChange(rank)}
                  />
                  {rank}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead className="w-80">楽曲名</TableHead>
            <TableHead>難易度</TableHead>
            <TableHead>
              <button onClick={handleSortBySingleRating}>
                単曲レート[{sortSingleRatingStatus === "ASC" ? "↑" : "↓"}]
              </button>
            </TableHead>
            <TableHead>楽曲スコア</TableHead>
            <TableHead>ランク</TableHead>
            <TableHead>
              <button onClick={handleSortByRealLevel}>
                譜面定数[{sortRealLevelStatus === "ASC" ? "↑" : "↓"}]
              </button>
            </TableHead>
            <TableHead>DXST</TableHead>
            <TableHead>
              <button onClick={handleSortOldOrNewStatus}>
                新曲
                {sortOldOrNewStatus === "NEW"
                  ? "[新]"
                  : sortOldOrNewStatus === "OLD"
                  ? "[旧]"
                  : ""}
              </button>
            </TableHead>
            <TableHead>表示レベル</TableHead>
            <TableHead>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="hover:underline">
                    目標スコア
                    {goalScoreFilter === "filtered" && " (除外あり)"}
                    {goalScoreFilter === "100.0" && " (≤100.0)"}
                    {goalScoreFilter === "99.5" && " (≤99.5)"}
                    {goalScoreFilter === "99.0" && " (≤99.0)"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">目標スコア表示設定</h4>
                    <RadioGroup value={goalScoreFilter} onValueChange={setGoalScoreFilter}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all">全て</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="filtered" id="filtered" />
                        <Label htmlFor="filtered">到達不可能を除外</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="100.0" id="100.0" />
                        <Label htmlFor="100.0">100.0以下</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="99.5" id="99.5" />
                        <Label htmlFor="99.5">99.5以下</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="99.0" id="99.0" />
                        <Label htmlFor="99.0">99.0以下</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </PopoverContent>
              </Popover>
            </TableHead>
            <TableHead>上昇値</TableHead>
            <TableHead>
              <button onClick={handleSortDiffToGoalScoreStatus}>
                目標まで[{sortDiffToGoalScoreStatus === "ASC" ? "↑" : "↓"}]
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMusicRating
            .filter((musicRatingItem) => selectedRanks.includes(rankByScore(musicRatingItem.score)))
            .filter((musicRatingItem) => {
              const { musicGoalRating } = calculateGoalRatingByMusicRating(musicRatingItem);
              const goalScore = calculateGoalScore(
                musicGoalRating,
                musicRatingItem.levelUsingRatingCalculate
              );
              
              if (goalScoreFilter === "all") return true;
              if (goalScoreFilter === "filtered") return goalScore <= 1.005;
              
              const goalScorePercentage = goalScore * 100;
              const maxScoreValue = parseFloat(goalScoreFilter);
              return goalScorePercentage <= maxScoreValue;
            })
            .map((musicRatingItem, i) => {
              const { musicGoalRating, minRating } =
                calculateGoalRatingByMusicRating(musicRatingItem);
              const goalScore = calculateGoalScore(
                musicGoalRating,
                musicRatingItem.levelUsingRatingCalculate
              );


              if (sortOldOrNewStatus === "NEW" && !musicRatingItem.isNew) return;
              if (
                sortOldOrNewStatus === "OLD" &&
                !(musicRatingItem.isNew === undefined || !musicRatingItem.isNew)
              )
                return;

              /** 目標スコアに達した時のでらっくすレーティングの上昇分 */
              const increaseMaimaiRatingWhenReachGoalScore = (() => {
                if (goalScore > 1.005) return "-";
                const singleRatingWhenReachGoalScore = calculateSingleRating(
                  musicRatingItem.levelUsingRatingCalculate,
                  goalScore
                );

                return (
                  singleRatingWhenReachGoalScore -
                  Math.max(musicRatingItem.rating, minRating)
                );
              })();

              return (
                <TableRow
                  className={cn(musicRatingItem.isPlayedRecently && "bg-red-50")}
                  key={`${musicRatingItem.name}-${musicRatingItem.difficulty}-${
                    musicRatingItem.isDx ? "dx" : "st"
                  }`}
                >
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    {musicRatingItem.name}
                    {musicRatingItem.count && (
                      <span className="font-bold text-red-500">{`（${musicRatingItem.count}回）`}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {MusicDifficultyMap[musicRatingItem.difficulty]}
                  </TableCell>
                  <TableCell>{musicRatingItem.rating}</TableCell>
                  <TableCell>
                    {Math.round(musicRatingItem.score * 1000000) / 1000000}
                  </TableCell>
                  <TableCell>{rankByScore(musicRatingItem.score)}</TableCell>
                  <TableCell
                    className={cn({
                      "text-red-600": !musicRatingItem.realLevel,
                    })}
                  >
                    {musicRatingItem.levelUsingRatingCalculate}
                    {!musicRatingItem.realLevel && " ?"}
                  </TableCell>
                  <TableCell>{musicRatingItem.isDx ? "DX" : "ST"}</TableCell>
                  <TableCell
                    className={cn({
                      "text-red-600": musicRatingItem.isNew === undefined,
                    })}
                  >
                    {musicRatingItem.isNew
                      ? "◯"
                      : musicRatingItem.isNew === undefined
                      ? "?"
                      : ""}
                  </TableCell>
                  <TableCell>{musicRatingItem.displayLevel}</TableCell>
                  <TableCell>{toDisplayGoalScore(goalScore)}</TableCell>
                  <TableCell>{increaseMaimaiRatingWhenReachGoalScore}</TableCell>
                  <TableCell>
                    {goalScore <= 1.005
                      ? Math.round(
                          goalScore * 1000000 - musicRatingItem.score * 1000000
                        ) / 1000000
                      : "-"}
                  </TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PlayInfoTableView;
