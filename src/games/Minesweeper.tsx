import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Icon } from '../components/Icon'
import { useGameStore } from '../store'

type MineCell = { mine: boolean; open: boolean; flagged: boolean; adjacent: number }
type MineDifficulty = 'easy' | 'middle' | 'hard'
type MineDifficultyOption = { id: MineDifficulty; label: string; size: number; mines: number }

const mineDifficultyOptions: MineDifficultyOption[] = [
  { id: 'easy', label: '简单', size: 9, mines: 10 },
  { id: 'middle', label: '中等', size: 12, mines: 24 },
  { id: 'hard', label: '困难', size: 16, mines: 48 },
]

const getMineConfig = (difficulty: MineDifficulty) => mineDifficultyOptions.find((option) => option.id === difficulty)!

const randomizeIndexes = (length: number) => {
  const indexes = Array.from({ length }, (_, index) => index)
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]]
  }
  return indexes
}

function around(index: number, size: number) {
  const row = Math.floor(index / size)
  const column = index % size
  const indexes: number[] = []
  for (let y = -1; y <= 1; y += 1) for (let x = -1; x <= 1; x += 1) {
    if (!x && !y) continue
    const nextRow = row + y
    const nextColumn = column + x
    if (nextRow >= 0 && nextRow < size && nextColumn >= 0 && nextColumn < size) indexes.push(nextRow * size + nextColumn)
  }
  return indexes
}

function makeMines(size: number, mineCount: number): MineCell[] {
  const cells = Array.from({ length: size * size }, () => ({ mine: false, open: false, flagged: false, adjacent: 0 }))
  randomizeIndexes(cells.length).slice(0, mineCount).forEach((index) => { cells[index].mine = true })
  cells.forEach((cell, index) => {
    if (cell.mine) return
    cell.adjacent = around(index, size).filter((next) => cells[next].mine).length
  })
  return cells
}

export function Minesweeper() {
  const savedSession = useGameStore((state) => state.minesweeper)
  const saveMinesweeper = useGameStore((state) => state.saveMinesweeper)
  const restoredDifficulty = savedSession && mineDifficultyOptions.some((option) => option.id === savedSession.difficulty) ? savedSession.difficulty as MineDifficulty : 'easy'
  const restoredConfig = getMineConfig(restoredDifficulty)
  const [difficulty, setDifficulty] = useState<MineDifficulty>(restoredDifficulty)
  const [board, setBoard] = useState<MineCell[]>(() => savedSession?.board.length === restoredConfig.size * restoredConfig.size ? savedSession.board : makeMines(restoredConfig.size, restoredConfig.mines))
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>(() => savedSession?.status ?? 'playing')
  const [flagMode, setFlagMode] = useState(false)
  const [startedAt, setStartedAt] = useState(() => savedSession?.startedAt ?? Date.now())
  const [, setClock] = useState(0)
  const config = getMineConfig(difficulty)
  const size = config.size
  const mineCount = config.mines
  const flags = board.filter((cell) => cell.flagged).length

  useEffect(() => {
    if (status !== 'playing') return
    const timer = window.setInterval(() => setClock((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [status])

  useEffect(() => {
    saveMinesweeper({ difficulty, board, status, startedAt })
  }, [board, difficulty, saveMinesweeper, startedAt, status])

  const reset = (nextDifficulty: MineDifficulty = difficulty) => {
    const nextConfig = getMineConfig(nextDifficulty)
    setDifficulty(nextDifficulty)
    setBoard(makeMines(nextConfig.size, nextConfig.mines))
    setStatus('playing')
    setFlagMode(false)
    setStartedAt(Date.now())
  }
  const reveal = (index: number) => {
    if (status !== 'playing') return
    if (flagMode) { toggleFlag(index); return }
    setBoard((previous) => {
      if (previous[index].open || previous[index].flagged) return previous
      const next = previous.map((cell) => ({ ...cell }))
      if (next[index].mine) {
        next.forEach((cell) => { if (cell.mine) cell.open = true })
        setStatus('lost')
        return next
      }
      const queue = [index]
      const visited = new Set<number>()
      while (queue.length) {
        const current = queue.shift()!
        if (visited.has(current) || next[current].flagged) continue
        visited.add(current)
        next[current].open = true
        if (next[current].adjacent === 0) around(current, size).forEach((near) => { if (!next[near].mine) queue.push(near) })
      }
      if (next.every((cell) => cell.mine || cell.open)) setStatus('won')
      return next
    })
  }
  const toggleFlag = (index: number) => {
    if (status !== 'playing') return
    setBoard((previous) => previous.map((cell, cellIndex) => {
      if (cellIndex !== index || cell.open) return cell
      if (!cell.flagged && flags >= mineCount) return cell
      return { ...cell, flagged: !cell.flagged }
    }))
  }
  const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))

  return <section className="game-panel mines-panel"><div className="game-intro"><span className="section-kicker">MINESWEEPER · {difficulty.toUpperCase()}</span><h1>保持冷静，<em>找到出口。</em></h1><p>随机生成 {size}×{size} 棋盘，找到全部 {mineCount} 颗雷。</p></div><div className="mine-difficulty">{mineDifficultyOptions.map((option) => <button key={option.id} className={difficulty === option.id ? 'active' : ''} onClick={() => reset(option.id)}><strong>{option.label}</strong><small>{option.id}</small></button>)}</div><div className="mine-toolbar"><div><small>剩余地雷</small><strong>{String(Math.max(0, mineCount - flags)).padStart(2, '0')}</strong></div><div className={`game-status ${status}`}>{status === 'playing' ? '进行中' : status === 'won' ? '完成啦' : '踩雷了'}</div><div><small>时间</small><strong>{String(elapsed).padStart(3, '0')}</strong></div></div><div className="mine-board" role="grid" style={{ '--mine-size': size } as CSSProperties}>{board.map((cell, index) => <button key={index} className={`mine-cell ${cell.open ? 'open' : ''} ${cell.flagged ? 'flagged' : ''} n${cell.adjacent}`} onClick={() => reveal(index)} onContextMenu={(event) => { event.preventDefault(); toggleFlag(index) }} aria-label={`第 ${index + 1} 格`}>{cell.open ? cell.mine ? '✦' : cell.adjacent || '' : cell.flagged ? '⚑' : ''}</button>)}</div><div className="mode-toggle"><button className={!flagMode ? 'selected' : ''} onClick={() => setFlagMode(false)}>⌁ 挖掘</button><button className={flagMode ? 'selected' : ''} onClick={() => setFlagMode(true)}>⚑ 标记</button></div><div className="game-actions"><button onClick={() => reset()}><Icon name="refresh" />随机新局</button><span>长按或右键可以标记地雷</span></div>{status !== 'playing' && <div className="result-banner"><strong>{status === 'won' ? '漂亮！航线安全。' : '差一点，再来一局？'}</strong><button onClick={() => reset()}>再玩一次 →</button></div>}</section>
}
