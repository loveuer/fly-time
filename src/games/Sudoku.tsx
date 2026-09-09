import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { useGameStore } from '../store'

type SudokuDifficulty = 'easy' | 'middle' | 'hard'
type SudokuGame = { puzzle: number[]; solution: number[] }

const sudokuDifficultyOptions: { id: SudokuDifficulty; label: string; holes: number }[] = [
  { id: 'easy', label: '简单', holes: 40 },
  { id: 'middle', label: '中等', holes: 48 },
  { id: 'hard', label: '困难', holes: 54 },
]

const shuffle = <T,>(items: T[]) => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }
  return result
}

const countSolutions = (board: number[], limit = 2): number => {
  let bestIndex = -1
  let bestMask = 0
  let fewestCandidates = 10
  const fullMask = (1 << 9) - 1

  for (let index = 0; index < board.length; index += 1) {
    if (board[index]) continue
    const row = Math.floor(index / 9)
    const column = index % 9
    const box = Math.floor(row / 3) * 3 + Math.floor(column / 3)
    let used = 0
    for (let offset = 0; offset < 9; offset += 1) {
      used |= board[row * 9 + offset] ? 1 << (board[row * 9 + offset] - 1) : 0
      used |= board[offset * 9 + column] ? 1 << (board[offset * 9 + column] - 1) : 0
      const boxRow = Math.floor(box / 3) * 3 + Math.floor(offset / 3)
      const boxColumn = (box % 3) * 3 + offset % 3
      used |= board[boxRow * 9 + boxColumn] ? 1 << (board[boxRow * 9 + boxColumn] - 1) : 0
    }
    const candidates = fullMask & ~used
    const candidateCount = candidates.toString(2).replace(/0/g, '').length
    if (!candidateCount) return 0
    if (candidateCount < fewestCandidates) {
      bestIndex = index
      bestMask = candidates
      fewestCandidates = candidateCount
      if (candidateCount === 1) break
    }
  }

  if (bestIndex === -1) return 1
  let solutions = 0
  while (bestMask && solutions < limit) {
    const bit = bestMask & -bestMask
    bestMask -= bit
    board[bestIndex] = Math.log2(bit) + 1
    solutions += countSolutions(board, limit - solutions)
    board[bestIndex] = 0
  }
  return solutions
}

const createSolvedSudoku = () => {
  const pattern = (row: number, column: number) => (row * 3 + Math.floor(row / 3) + column) % 9
  const groups = shuffle([0, 1, 2])
  const rows = groups.flatMap((group) => shuffle([0, 1, 2]).map((row) => group * 3 + row))
  const columns = groups.flatMap((group) => shuffle([0, 1, 2]).map((column) => group * 3 + column))
  const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
  return rows.flatMap((row) => columns.map((column) => digits[pattern(row, column)]))
}

const createSudokuGame = (difficulty: SudokuDifficulty): SudokuGame => {
  const holes = sudokuDifficultyOptions.find((option) => option.id === difficulty)!.holes
  const solution = createSolvedSudoku()
  const puzzle = [...solution]
  let removed = 0
  for (const index of shuffle(Array.from({ length: 81 }, (_, value) => value))) {
    if (removed >= holes) break
    const saved = puzzle[index]
    puzzle[index] = 0
    if (countSolutions(puzzle) === 1) removed += 1
    else puzzle[index] = saved
  }
  return { puzzle, solution }
}

export function Sudoku() {
  const savedSession = useGameStore((state) => state.sudoku)
  const saveSudoku = useGameStore((state) => state.saveSudoku)
  const restoredSession = savedSession && savedSession.puzzle.length === 81 && savedSession.solution.length === 81 && savedSession.board.length === 81 && savedSession.notes.length === 81 && savedSession.notes.every((items) => Array.isArray(items)) ? savedSession : null
  const restoredDifficulty = restoredSession && sudokuDifficultyOptions.some((option) => option.id === restoredSession.difficulty) ? restoredSession.difficulty as SudokuDifficulty : 'easy'
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>(restoredDifficulty)
  const [game, setGame] = useState<SudokuGame>(() => restoredSession ? { puzzle: [...restoredSession.puzzle], solution: [...restoredSession.solution] } : createSudokuGame(restoredDifficulty))
  const [board, setBoard] = useState<number[]>(() => restoredSession ? [...restoredSession.board] : [...game.puzzle])
  const [notes, setNotes] = useState<number[][]>(() => restoredSession ? restoredSession.notes.map((items) => [...items]) : Array.from({ length: 81 }, () => []))
  const [selected, setSelected] = useState<number | null>(() => restoredSession?.selected ?? null)
  const [elapsed, setElapsed] = useState(() => typeof restoredSession?.elapsed === 'number' ? restoredSession.elapsed : 0)
  const [complete, setComplete] = useState(() => restoredSession?.complete ?? false)
  const [inputMode, setInputMode] = useState<'value' | 'note'>('value')

  useEffect(() => {
    if (complete) return
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [complete])

  useEffect(() => {
    saveSudoku({ difficulty, puzzle: game.puzzle, solution: game.solution, board, notes, selected, elapsed, complete })
  }, [board, complete, difficulty, elapsed, game, notes, saveSudoku, selected])

  const reset = (nextDifficulty: SudokuDifficulty = difficulty) => {
    const nextGame = createSudokuGame(nextDifficulty)
    setDifficulty(nextDifficulty)
    setGame(nextGame)
    setBoard([...nextGame.puzzle])
    setNotes(Array.from({ length: 81 }, () => []))
    setSelected(null)
    setElapsed(0)
    setComplete(false)
    setInputMode('value')
  }
  const updateBoard = (next: number[]) => {
    setComplete(next.every((value, index) => value === game.solution[index]))
    setBoard(next)
  }
  const setNumber = (number: number) => {
    if (selected === null || game.puzzle[selected] !== 0 || complete) return
    if (inputMode === 'note') {
      if (board[selected] !== 0) return
      const currentNotes = notes[selected]
      if (!currentNotes.includes(number) && currentNotes.length >= 4) return
      const nextNotes = currentNotes.includes(number) ? currentNotes.filter((item) => item !== number) : [...currentNotes, number].sort()
      setNotes((previous) => previous.map((items, index) => index === selected ? nextNotes : items))
      return
    }
    const next = [...board]
    next[selected] = number
    setNotes((previous) => previous.map((items, index) => index === selected ? [] : items))
    updateBoard(next)
  }
  const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
  const activeNumber = selected === null ? null : board[selected]
  const selectedNotes = selected === null ? [] : notes[selected]
  const eraseSelected = () => {
    if (selected === null || game.puzzle[selected] !== 0 || complete) return
    if (inputMode === 'note') {
      setNotes((previous) => previous.map((items, index) => index === selected ? [] : items))
      return
    }
    const next = [...board]
    next[selected] = 0
    setNotes((previous) => previous.map((items, index) => index === selected ? [] : items))
    updateBoard(next)
  }

  return <section className="game-panel sudoku-panel"><div className="game-intro"><span className="section-kicker">SUDOKU · {difficulty.toUpperCase()}</span><h1>给数字，<em>一点秩序。</em></h1><p>每次开始都会随机生成一题，候选数字可以帮你记下暂时的推理。</p></div><div className="sudoku-difficulty">{sudokuDifficultyOptions.map((option) => <button key={option.id} className={difficulty === option.id ? 'active' : ''} onClick={() => reset(option.id)}><strong>{option.label}</strong><small>{option.id}</small></button>)}</div><div className="sudoku-meta"><span>用时 {formatTime(elapsed)}</span><span className={complete ? 'complete-label' : ''}>{complete ? '完成啦 ✦' : `随机唯一解 · 还剩 ${board.filter((value) => value === 0).length} 格`}</span></div><div className="sudoku-board">{board.map((value, index) => <button key={index} className={`sudoku-cell ${game.puzzle[index] ? 'given' : 'editable'} ${selected === index ? 'selected' : ''} ${activeNumber && value === activeNumber ? 'same-number' : ''} ${Math.floor(index / 9) % 3 === 2 ? 'block-bottom' : ''} ${index % 9 % 3 === 2 ? 'block-right' : ''}`} onClick={() => setSelected(index)}>{value ? value : notes[index].length > 0 ? <span className="candidate-grid">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => <span key={number}>{notes[index].includes(number) ? number : ''}</span>)}</span> : ''}</button>)}</div><div className="mode-toggle sudoku-mode"><button className={inputMode === 'value' ? 'selected' : ''} onClick={() => setInputMode('value')}>● 确定答案</button><button className={inputMode === 'note' ? 'selected' : ''} onClick={() => setInputMode('note')}>⁙ 候选数字 <small>{selectedNotes.length}/4</small></button></div><div className="number-pad">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => <button key={number} className={(inputMode === 'value' && activeNumber === number) || (inputMode === 'note' && selectedNotes.includes(number)) ? 'active' : ''} onClick={() => setNumber(number)}>{number}</button>)}<button className="erase" onClick={eraseSelected}>⌫</button></div><div className="game-actions"><button onClick={() => reset()}><Icon name="refresh" />随机新题</button><span>{inputMode === 'note' ? '每格最多保留 4 个候选数字' : '填满后自动完成'}</span></div>{complete && <div className="result-banner mint-result"><strong>一格不差，落地前刚好完成。</strong><button onClick={() => reset()}>再来一盘 →</button></div>}</section>
}
