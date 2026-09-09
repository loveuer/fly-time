import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Icon } from '../components/Icon'
import { getClues, getColumn, getNonogramPuzzle, isFilledCell, nonogramPuzzles } from '../nonogram'
import { useGameStore } from '../store'

export function Nonogram() {
  const progress = useGameStore((state) => state.nonogram)
  const setProgress = useGameStore((state) => state.setNonogramProgress)
  const resetNonogram = useGameStore((state) => state.resetNonogram)
  const [mode, setMode] = useState<'fill' | 'cross'>('fill')
  const puzzle = getNonogramPuzzle(progress.puzzleId)
  const size = puzzle.rows.length
  const cells = progress.cells.length === size * size ? progress.cells : Array(size * size).fill(0)
  const rowClues = puzzle.rows.map(getClues)
  const columnClues = Array.from({ length: size }, (_, column) => getClues(getColumn(puzzle.rows, column)))

  useEffect(() => {
    if (progress.puzzleId !== puzzle.id || progress.cells.length !== size * size) resetNonogram(puzzle.id, size)
  }, [progress.puzzleId, progress.cells.length, puzzle.id, resetNonogram, size])

  useEffect(() => {
    if (progress.completed) return
    const timer = window.setInterval(() => setProgress({ elapsed: progress.elapsed + 1 }), 1000)
    return () => window.clearInterval(timer)
  }, [progress.completed, progress.elapsed, setProgress])

  const choosePuzzle = (id: string) => {
    const nextPuzzle = getNonogramPuzzle(id)
    resetNonogram(nextPuzzle.id, nextPuzzle.rows.length)
    setMode('fill')
  }
  const nextPuzzle = () => {
    const currentIndex = nonogramPuzzles.findIndex((item) => item.id === puzzle.id)
    choosePuzzle(nonogramPuzzles[(currentIndex + 1) % nonogramPuzzles.length].id)
  }
  const isLineSolved = (line: number[]) => line.every((index) => cells[index] === 1)
  const markCell = (index: number) => {
    if (progress.completed) return
    const nextCells = [...cells]
    if (mode === 'fill') {
      if (!isFilledCell(puzzle, index)) {
        setProgress({ mistakes: progress.mistakes + 1 })
        return
      }
      nextCells[index] = nextCells[index] === 1 ? 0 : 1
    } else {
      if (nextCells[index] === 1) return
      nextCells[index] = nextCells[index] === 2 ? 0 : 2
    }
    const completed = puzzle.rows.every((row, rowIndex) => row.split('').every((target, columnIndex) => target === '0' || nextCells[rowIndex * size + columnIndex] === 1))
    setProgress({ cells: nextCells, completed })
  }
  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return <section className="game-panel nonogram-panel"><div className="game-intro"><span className="section-kicker">NONOGRAM · {puzzle.name.toUpperCase()}</span><h1>从数字里，<em>拼出一幅小画。</em></h1><p>线索表示连续涂色格子的数量。每组数字之间至少隔一个空格。</p></div><div className="nonogram-puzzle-tabs">{nonogramPuzzles.map((item, index) => <button key={item.id} className={item.id === puzzle.id ? 'active' : ''} onClick={() => choosePuzzle(item.id)}><span>0{index + 1}</span>{item.name}</button>)}</div><div className="nonogram-meta"><span><b>{puzzle.hint}</b> · 入门题</span><span>{progress.completed ? '完成啦 ✦' : `用时 ${formatTime(progress.elapsed)}`}</span></div><div className="nonogram-board" style={{ '--nonogram-size': size } as CSSProperties}><div className="nonogram-corner">↘</div>{columnClues.map((clue, column) => <div className={`nonogram-col-clue ${isLineSolved(Array.from({ length: size }, (_, row) => row * size + column)) ? 'solved' : ''}`} key={`column-${column}`}>{clue.map((number, clueIndex) => <span key={`${number}-${clueIndex}`}>{number}</span>)}</div>)}{rowClues.map((clue, row) => <div className="nonogram-row-group" key={`row-${row}`}><div className={`nonogram-row-clue ${isLineSolved(Array.from({ length: size }, (_, column) => row * size + column)) ? 'solved' : ''}`}>{clue.map((number, clueIndex) => <span key={`${number}-${clueIndex}`}>{number}</span>)}</div>{puzzle.rows[row].split('').map((_, column) => { const index = row * size + column; const mark = cells[index]; return <button key={index} className={`nonogram-cell ${mark === 1 ? 'filled' : ''} ${mark === 2 ? 'cross' : ''} ${column === 2 || column === 5 ? 'block-right' : ''} ${row === 2 || row === 5 ? 'block-bottom' : ''}`} onClick={() => markCell(index)} aria-label={`第 ${row + 1} 行第 ${column + 1} 列`}>{mark === 1 ? '✦' : mark === 2 ? '×' : ''}</button> })}</div>)}</div><div className="mode-toggle nonogram-mode"><button className={mode === 'fill' ? 'selected' : ''} onClick={() => setMode('fill')}>✦ 涂色</button><button className={mode === 'cross' ? 'selected' : ''} onClick={() => setMode('cross')}>× 排除</button></div><div className="nonogram-tip"><span>?</span><p><strong>怎么玩？</strong>先看行列线索，推理哪些格子一定要涂。涂错不会结束游戏，但会记一次错误。</p></div><div className="game-actions"><button onClick={() => choosePuzzle(puzzle.id)}><Icon name="refresh" />重新开始</button><button onClick={nextPuzzle}>换一题 →</button></div>{progress.completed && <div className="result-banner mint-result"><strong>图案完成，原来是「{puzzle.name}」！</strong><button onClick={nextPuzzle}>下一题 →</button></div>}</section>
}
