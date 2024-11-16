"use client"

import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { MusicDifficultyMap, MusicRatingInfo } from "../utils/types/type"
import { calculateGoalScore, rankByScore, calculateSingleRating } from "../utils/functions_browser"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PlayInfoTableViewProps {
  musicRatingInfoList: MusicRatingInfo[],
  /** レーティング対象の最低単曲レート */
  minRating?: number | {
    old?: number,
    new?: number
  },
}

const toDisplayGoalScore = (goalScore: number) => {
  // 1.005より大きい場合、達成不可能なので "-"を返す
  if (goalScore > 1.005) return "-"

  return Math.round(goalScore * 1000000) / 1000000
}

const PlayInfoTableView = ({ musicRatingInfoList, minRating: minRatingFromProps }: PlayInfoTableViewProps) => {
  const [goalRatingOffset, setGoalRatingOffset] = useState(10)
  const [sortedMusicRating, setSortedMusicRating] = useState(musicRatingInfoList)
  const [sortSingleRatingStatus, setSortSingleRatingStatus] = useState<"ASC" | "DESC">("DESC")
  const [sortRealLevelStatus, setSortRealLevelStatus] = useState<"ASC" | "DESC">("DESC")
  const [sortGoalScoreStatus, setSortGoalScoreStatus] = useState<"ALL" | "FILTERED">("ALL")
  const [sortOldOrNewStatus, setSortOldOrNewStatus] = useState<"ALL" | "NEW" | "OLD">("ALL")
  const [sortDiffToGoalScoreStatus, setSortDiffToGoalScoreStatus] = useState<"ASC" | "DESC">("DESC")

  const handleSortByRealLevel = () => {
    const newState = sortRealLevelStatus === "ASC" ? "DESC" : "ASC"
    setSortRealLevelStatus(newState)
    setSortedMusicRating((current) => {
      if (newState === "ASC") {
        return current.toSorted((a, b) => a.levelUsingRatingCalculate - b.levelUsingRatingCalculate)
      } else {
        return current.toSorted((a, b) => b.levelUsingRatingCalculate - a.levelUsingRatingCalculate)
      }
    })
  }

  const handleSortBySingleRating = () => {
    const newState = sortSingleRatingStatus === "ASC" ? "DESC" : "ASC"
    setSortSingleRatingStatus(newState)
    setSortedMusicRating((current) => {
      if (newState === "ASC") {
        return current.toSorted((a, b) => a.rating - b.rating)
      } else {
        return current.toSorted((a, b) => b.rating - a.rating)
      }
    })
  }

  const handleSortGoalScoreStatus = () => {
    const newState = sortGoalScoreStatus === "ALL" ? "FILTERED" : "ALL"
    setSortGoalScoreStatus(newState)
  }

  const handleSortOldOrNewStatus = () => {
    switch (sortOldOrNewStatus) {
      case "ALL":
        setSortOldOrNewStatus("NEW")
        break
      case "NEW":
        setSortOldOrNewStatus("OLD")
        break
      case "OLD":
        setSortOldOrNewStatus("ALL")
        break
      default:
        const UNREACHED: never = sortOldOrNewStatus
        return UNREACHED
    }
  }

  const handleSortDiffToGoalScoreStatus = () => {
    const newState = sortDiffToGoalScoreStatus === "ASC" ? "DESC" : "ASC"
    setSortDiffToGoalScoreStatus(newState)
    setSortedMusicRating((current) => {
      const calculateDiffToGoalScoreByMusicRating = (musicRating: MusicRatingInfo) => {
        const { musicGoalRating } = calculateGoalRatingByMusicRating(musicRating)
        const goalScore = calculateGoalScore(musicGoalRating, musicRating.levelUsingRatingCalculate)
        const diff = goalScore <= 1.005 ? Math.round(goalScore * 1000000 - musicRating.score * 1000000) / 1000000 : 999
        return diff
      }
      if (newState === "ASC") {
        return current.toSorted((a, b) => calculateDiffToGoalScoreByMusicRating(a) - calculateDiffToGoalScoreByMusicRating(b))
      } else {
        return current.toSorted((a, b) => calculateDiffToGoalScoreByMusicRating(b) - calculateDiffToGoalScoreByMusicRating(a))
      }
    })
  }

  /**
   * 目標レーティングを算出する
   * @param musicRating 
   * @returns 
   */
  const calculateGoalRatingByMusicRating = (musicRating: MusicRatingInfo) => {
    /** レーティング対象の最低単曲レート。undefinedの場合、その曲のレートに設定する。 */
    let minRating: number
    /** オブジェクトの場合（number型でない場合、）新曲か旧曲かで最低単曲レートを設定する。undefinedの場合、その曲のレートに設定する。 */
    if (typeof minRatingFromProps !== "number") {
      if (musicRating.isNew) {
        minRating = minRatingFromProps?.new || musicRating.rating
      } else {
        minRating = minRatingFromProps?.old || musicRating.rating
      }
    } else {
      minRating = minRatingFromProps
    }
    /** 
     * 最低単曲レートよりも高い場合レーティング対象に入っているため、その曲のレートを基準として目標レートを設定する
     * 最低単曲レートよりも低い場合レーティング対象に入っていないため、最低単曲レートを基準として目標レートを設定する
     */
    const musicGoalRating = musicRating.rating >= minRating ?
      musicRating.rating + goalRatingOffset :
      minRating + goalRatingOffset;

    return { musicGoalRating, minRating }
  }

  return (
    <div className="space-y-4">
      <div className="ml-auto w-fit">
        目標スコア上昇値：
        <Input
          className="w-40 inline-block"
          type="number"
          min={1}
          value={goalRatingOffset}
          onChange={(e) => setGoalRatingOffset(Number(e.currentTarget.value))} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead className="w-80">楽曲名</TableHead>
            <TableHead>難易度</TableHead>
            <TableHead><button onClick={handleSortBySingleRating}>単曲レート[{sortSingleRatingStatus === "ASC" ? "↑" : "↓"}]</button></TableHead>
            <TableHead>楽曲スコア</TableHead>
            <TableHead>ランク</TableHead>
            <TableHead><button onClick={handleSortByRealLevel}>譜面定数[{sortRealLevelStatus === "ASC" ? "↑" : "↓"}]</button></TableHead>
            <TableHead>DXST</TableHead>
            <TableHead><button onClick={handleSortOldOrNewStatus}>新曲{sortOldOrNewStatus === "NEW" ? "[新]" : sortOldOrNewStatus === "OLD" ? "[旧]" : ""}</button></TableHead>
            <TableHead>表示レベル</TableHead>
            <TableHead><button onClick={handleSortGoalScoreStatus}>目標スコア{sortGoalScoreStatus === "FILTERED" ? "▼" : "▽"}</button></TableHead>
            <TableHead>上昇値</TableHead>
            <TableHead><button onClick={handleSortDiffToGoalScoreStatus}>目標まで[{sortDiffToGoalScoreStatus === "ASC" ? "↑" : "↓"}]</button></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {
            sortedMusicRating.map((musicRatingItem, i) => {

              const { musicGoalRating, minRating } = calculateGoalRatingByMusicRating(musicRatingItem)
              const goalScore = calculateGoalScore(musicGoalRating, musicRatingItem.levelUsingRatingCalculate)

              /** 目標スコアがフィルターされており、到達不可能である場合は表示しない */
              if (sortGoalScoreStatus === "FILTERED" && calculateGoalScore(musicGoalRating, musicRatingItem.levelUsingRatingCalculate) > 1.005) return

              if (sortOldOrNewStatus === "NEW" && !musicRatingItem.isNew) return
              if (sortOldOrNewStatus === "OLD" && !(musicRatingItem.isNew === undefined || !musicRatingItem.isNew)) return

              /** 目標スコアに達した時のでらっくすレーティングの上昇分 */
              const increaseMaimaiRatingWhenReachGoalScore = (() => {
                if (goalScore > 1.005) return "-"
                const singleRatingWhenReachGoalScore = calculateSingleRating(musicRatingItem.levelUsingRatingCalculate, goalScore)

                return singleRatingWhenReachGoalScore - Math.max(musicRatingItem.rating, minRating)
              })()

              return (
                <TableRow key={`${musicRatingItem.name}-${musicRatingItem.difficulty}-${musicRatingItem.isDx ? 'dx' : 'st'}`}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{musicRatingItem.name}{musicRatingItem.count && <span className="font-bold text-red-500">{`（${musicRatingItem.count}回）`}</span>}</TableCell>
                  <TableCell>{MusicDifficultyMap[musicRatingItem.difficulty]}</TableCell>
                  <TableCell>{musicRatingItem.rating}</TableCell>
                  <TableCell>{Math.round(musicRatingItem.score * 1000000) / 1000000}</TableCell>
                  <TableCell>{rankByScore(musicRatingItem.score)}</TableCell>
                  <TableCell
                    className={cn({
                      "text-red-600": !musicRatingItem.realLevel
                    })}>
                    {musicRatingItem.levelUsingRatingCalculate}{!musicRatingItem.realLevel && " ?"}
                  </TableCell>
                  <TableCell>{musicRatingItem.isDx ? "DX" : "ST"}</TableCell>
                  <TableCell
                    className={cn({
                      "text-red-600": musicRatingItem.isNew === undefined
                    })}
                  >
                    {musicRatingItem.isNew ? "◯" : musicRatingItem.isNew === undefined ? "?" : ""}
                  </TableCell>
                  <TableCell>{musicRatingItem.displayLevel}</TableCell>
                  <TableCell>{toDisplayGoalScore(goalScore)}</TableCell>
                  <TableCell>{increaseMaimaiRatingWhenReachGoalScore}</TableCell>
                  <TableCell>{goalScore <= 1.005 ? Math.round(goalScore * 1000000 - musicRatingItem.score * 1000000) / 1000000 : "-"}</TableCell>
                </TableRow>
              )
            })
          }
        </TableBody>
      </Table>
    </div>
  )
}

export default PlayInfoTableView