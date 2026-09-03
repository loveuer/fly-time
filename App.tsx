import { useEffect, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { getGame, games, type GameId } from './src/data'
import { getClues, getColumn, getNonogramPuzzle, isFilledCell, nonogramPuzzles } from './src/nonogram'
import { useGameStore } from './src/store'

type Screen = 'home' | 'library' | 'stats'

const Icon = ({ name }: { name: 'home' | 'grid' | 'chart' | 'back' | 'info' | 'star' | 'close' | 'refresh' }) => {
  const paths = {
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-6h6v6"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    chart: <><path d="M4 19V5"/><path d="M4 19h17"/><path d="m7 15 3-4 3 2 5-7"/></>,
    back: <><path d="m15 18-6-6 6-6"/><path d="M9 12h11"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>,
    close: <><path d="m6 6 12 12"/><path d="m18 6-12 12"/></>,
    refresh: <><path d="M20 11a8.1 8.1 0 0 0-14.9-3L3 11"/><path d="M3 5v6h6"/><path d="M4 13a8.1 8.1 0 0 0 14.9 3L21 13"/><path d="M21 19v-6h-6"/></>,
  }
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [activeGame, setActiveGame] = useState<GameId | null>(null)
  const [showAbout, setShowAbout] = useState(false)
  const recordGame = useGameStore((state) => state.recordGame)

  const openGame = (id: GameId) => {
    setActiveGame(id)
    recordGame(id, 0)
  }

  if (activeGame) {
    return <GameScreen id={activeGame} onBack={() => setActiveGame(null)} />
  }

  return (
    <div className="app-shell">
      <main className="main-content">
        {screen === 'home' && <Home onOpen={openGame} onAbout={() => setShowAbout(true)} />}
        {screen === 'library' && <Library onOpen={openGame} />}
        {screen === 'stats' && <Stats />}
      </main>
      <BottomNav screen={screen} onChange={setScreen} />
      {showAbout && <About onClose={() => setShowAbout(false)} />}
    </div>
  )
}

function BrandHeader({ onAbout }: { onAbout: () => void }) {
  return <header className="brand-header">
    <div className="brand-lockup"><span className="brand-mark">✦</span><span>FLY TIME</span></div>
    <button className="icon-button muted" onClick={onAbout} aria-label="关于 Fly Time"><Icon name="info" /></button>
  </header>
}

function Home({ onOpen, onAbout }: { onOpen: (id: GameId) => void; onAbout: () => void }) {
  const { stats, recent } = useGameStore()
  const recentGames = recent.map((id) => getGame(id)).filter(Boolean)
  return <>
    <BrandHeader onAbout={onAbout} />
    <section className="hero">
      <div className="eyebrow"><span className="live-dot" />离线模式已就绪</div>
      <h1>飞行模式，<br /><em>也有好玩的事。</em></h1>
      <p>不用网络，不用社交，给自己一点<br />安静而刚刚好的时间。</p>
      <div className="flight-path"><span /><i /><i /><i /><b>✈</b></div>
    </section>
    <section className="section-heading"><div><span className="section-kicker">JUST FOR YOU</span><h2>现在想玩什么？</h2></div><span className="tiny-caption">{games.length} 款游戏</span></section>
    <div className="game-grid home-grid">
      {games.map((game, index) => <GameCard key={game.id} game={game} featured={index === 0} onOpen={onOpen} />)}
    </div>
    <section className="section-heading recent-heading"><div><span className="section-kicker">YOUR JOURNEY</span><h2>最近玩过</h2></div><button className="text-button" onClick={() => onOpen(recentGames[0]?.id || 'minesweeper')}>继续 <span>→</span></button></section>
    {recentGames.length > 0 && <div className="recent-row">{recentGames.slice(0, 2).map((game) => <button className="recent-item" key={game.id} onClick={() => onOpen(game.id)}><span className={`recent-icon ${game.color}`}>{game.icon}</span><span><strong>{game.title}</strong><small>{game.subtitle}</small></span><span className="recent-arrow">↗</span></button>)}</div>}
    <div className="daily-note"><span>☼</span><div><strong>今日小提示</strong><p>专注 10 分钟，窗外的云会更好看。</p></div></div>
    <div className="home-statline"><span>本次旅程 <b>{stats.minutes} 分钟</b></span><span className="separator">·</span><span>连续 <b>{stats.streak} 天</b></span></div>
  </>
}

function GameCard({ game, featured, onOpen }: { game: ReturnType<typeof getGame>; featured?: boolean; onOpen: (id: GameId) => void }) {
  const favorite = useGameStore((state) => state.favorites.includes(game.id))
  const toggleFavorite = useGameStore((state) => state.toggleFavorite)
  return <article className={`game-card ${game.color} ${featured ? 'featured' : ''}`}>
    <div className="card-top"><span className="card-icon">{game.icon}</span><button className={`favorite-button ${favorite ? 'is-favorite' : ''}`} onClick={() => toggleFavorite(game.id)} aria-label="收藏"><Icon name="star" /></button></div>
    <div className="card-copy"><span className="card-category">{game.category}</span><h3>{game.title}</h3><p>{game.description}</p></div>
    <button className="play-button" onClick={() => onOpen(game.id)}><span>开始游戏</span><span>↗</span></button>
  </article>
}

function Library({ onOpen }: { onOpen: (id: GameId) => void }) {
  const [filter, setFilter] = useState('全部')
  const filters = ['全部', '经典', '动脑', '专注']
  const filteredGames = filter === '全部' ? games : games.filter((game) => game.category === filter)
  return <>
    <PageTitle eyebrow="GAME CABINET" title="游戏柜" caption="挑一款，马上开始。" />
    <div className="filter-row">{filters.map((item) => <button className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <div className="library-list">{filteredGames.map((game) => <GameCard key={game.id} game={game} onOpen={onOpen} />)}</div>
    <div className="offline-card"><span className="offline-symbol">◌</span><div><strong>全部内容都已离线</strong><p>起飞后也可以随时打开，不需要 Wi-Fi。</p></div><span className="checkmark">✓</span></div>
  </>
}

function Stats() {
  const { stats, recent } = useGameStore()
  return <>
    <PageTitle eyebrow="YOUR LOGBOOK" title="旅程记录" caption="每一次专注，都值得记下。" />
    <div className="stats-highlight"><span className="section-kicker">TOTAL FOCUS TIME</span><strong>{stats.minutes}<small> min</small></strong><div className="stats-orbit">✦</div><p>比上次旅程多了 8 分钟 <span>↗</span></p></div>
    <div className="stat-cells"><div><span>游戏局数</span><strong>{stats.gamesPlayed}</strong><small>局</small></div><div><span>连续天数</span><strong>{stats.streak}</strong><small>天</small></div><div><span>最常玩</span><strong className="stat-game">{getGame(recent[0] || 'minesweeper').icon}</strong><small>{getGame(recent[0] || 'minesweeper').title}</small></div></div>
    <div className="section-heading stats-heading"><div><span className="section-kicker">A LITTLE HABIT</span><h2>你的专注轨迹</h2></div></div>
    <div className="chart-card"><div className="chart-labels"><span>本周</span><span>每日专注分钟</span></div><div className="chart"><span className="chart-line" /><span className="chart-dot dot-one" /><span className="chart-dot dot-two" /><span className="chart-dot dot-three" /><div className="bar b1" /><div className="bar b2" /><div className="bar b3" /><div className="bar b4" /><div className="bar b5" /><div className="bar b6" /><div className="bar b7" /></div><div className="chart-days"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div></div>
    <div className="quote-card"><span>“</span><p>真正的休息，<br />是让注意力回到自己身上。</p><small>— FLY TIME</small></div>
  </>
}

function PageTitle({ eyebrow, title, caption }: { eyebrow: string; title: string; caption: string }) {
  return <div className="page-title"><span className="section-kicker">{eyebrow}</span><h1>{title}</h1><p>{caption}</p></div>
}

function BottomNav({ screen, onChange }: { screen: Screen; onChange: (screen: Screen) => void }) {
  return <nav className="bottom-nav"><button className={screen === 'home' ? 'active' : ''} onClick={() => onChange('home')}><Icon name="home" /><span>首页</span></button><button className={screen === 'library' ? 'active' : ''} onClick={() => onChange('library')}><Icon name="grid" /><span>游戏</span></button><button className={screen === 'stats' ? 'active' : ''} onClick={() => onChange('stats')}><Icon name="chart" /><span>记录</span></button></nav>
}

function About({ onClose }: { onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="about-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><Icon name="close" /></button><span className="big-logo">✦</span><span className="section-kicker">ABOUT FLY TIME</span><h2>给无网时光，<br />准备一点好玩的。</h2><p>Fly Time 是一个为飞行模式准备的离线小游戏合集。你的记录只保存在这台设备里。</p><div className="about-pill"><span className="live-dot" />无需网络 · 无广告 · 无打扰</div></div></div>
}

function GameScreen({ id, onBack }: { id: GameId; onBack: () => void }) {
  const game = getGame(id)
  return <div className="game-screen"><header className="game-header"><button className="back-button" onClick={onBack}><Icon name="back" /></button><div><span className="section-kicker">{game.category}</span><h2>{game.title}</h2></div><span className={`game-header-icon ${game.color}`}>{game.icon}</span></header>{id === 'minesweeper' && <Minesweeper />}{id === 'sudoku' && <Sudoku />}{id === 'solitaire' && <Solitaire />}{id === 'nonogram' && <Nonogram />}</div>
}

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

function makeMines(size: number, mineCount: number): MineCell[] {
  const cells = Array.from({ length: size * size }, () => ({ mine: false, open: false, flagged: false, adjacent: 0 }))
  randomizeIndexes(cells.length).slice(0, mineCount).forEach((index) => { cells[index].mine = true })
  cells.forEach((cell, index) => {
    if (cell.mine) return
    cell.adjacent = around(index, size).filter((next) => cells[next].mine).length
  })
  return cells
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

function Minesweeper() {
  const [difficulty, setDifficulty] = useState<MineDifficulty>('easy')
  const [board, setBoard] = useState(() => makeMines(getMineConfig('easy').size, getMineConfig('easy').mines))
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [flagMode, setFlagMode] = useState(false)
  const [startedAt, setStartedAt] = useState(Date.now())
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

function Sudoku() {
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>('easy')
  const [game, setGame] = useState<SudokuGame>(() => createSudokuGame('easy'))
  const [board, setBoard] = useState<number[]>(() => [...game.puzzle])
  const [notes, setNotes] = useState<number[][]>(() => Array.from({ length: 81 }, () => []))
  const [selected, setSelected] = useState<number | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [wrongCells, setWrongCells] = useState<number[]>([])
  const [complete, setComplete] = useState(false)
  const [inputMode, setInputMode] = useState<'value' | 'note'>('value')

  const reset = (nextDifficulty: SudokuDifficulty = difficulty) => {
    const nextGame = createSudokuGame(nextDifficulty)
    setDifficulty(nextDifficulty)
    setGame(nextGame)
    setBoard([...nextGame.puzzle])
    setNotes(Array.from({ length: 81 }, () => []))
    setSelected(null)
    setMistakes(0)
    setWrongCells([])
    setComplete(false)
    setInputMode('value')
  }
  const updateBoard = (next: number[]) => {
    const isFull = next.every((value) => value !== 0)
    if (isFull) {
      const incorrect = next.reduce<number[]>((cells, value, index) => {
        if (value !== game.solution[index]) cells.push(index)
        return cells
      }, [])
      setWrongCells(incorrect)
      setMistakes(incorrect.length)
      setComplete(incorrect.length === 0)
    } else {
      setWrongCells([])
      setMistakes(0)
      setComplete(false)
    }
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

  return <section className="game-panel sudoku-panel"><div className="game-intro"><span className="section-kicker">SUDOKU · {difficulty.toUpperCase()}</span><h1>给数字，<em>一点秩序。</em></h1><p>每次开始都会随机生成一题，候选数字可以帮你记下暂时的推理。</p></div><div className="sudoku-difficulty">{sudokuDifficultyOptions.map((option) => <button key={option.id} className={difficulty === option.id ? 'active' : ''} onClick={() => reset(option.id)}><strong>{option.label}</strong><small>{option.id}</small></button>)}</div><div className="sudoku-meta"><span>错误格 <b>{mistakes}</b></span><span className={complete ? 'complete-label' : ''}>{complete ? '完成啦 ✦' : wrongCells.length ? `已填满 · 有 ${wrongCells.length} 格待修正` : `随机唯一解 · 还剩 ${board.filter((value) => value === 0).length} 格`}</span></div><div className="sudoku-board">{board.map((value, index) => <button key={index} className={`sudoku-cell ${game.puzzle[index] ? 'given' : 'editable'} ${selected === index ? 'selected' : ''} ${activeNumber && value === activeNumber ? 'same-number' : ''} ${wrongCells.includes(index) ? 'wrong' : ''} ${Math.floor(index / 9) % 3 === 2 ? 'block-bottom' : ''} ${index % 9 % 3 === 2 ? 'block-right' : ''}`} onClick={() => setSelected(index)}>{value ? value : notes[index].length > 0 ? <span className="candidate-grid">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => <span key={number}>{notes[index].includes(number) ? number : ''}</span>)}</span> : ''}</button>)}</div><div className="mode-toggle sudoku-mode"><button className={inputMode === 'value' ? 'selected' : ''} onClick={() => setInputMode('value')}>● 确定答案</button><button className={inputMode === 'note' ? 'selected' : ''} onClick={() => setInputMode('note')}>⁙ 候选数字 <small>{selectedNotes.length}/4</small></button></div><div className="number-pad">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => <button key={number} className={(inputMode === 'value' && activeNumber === number) || (inputMode === 'note' && selectedNotes.includes(number)) ? 'active' : ''} onClick={() => setNumber(number)}>{number}</button>)}<button className="erase" onClick={eraseSelected}>⌫</button></div><div className="game-actions"><button onClick={() => reset()}><Icon name="refresh" />随机新题</button><span>{inputMode === 'note' ? '每格最多保留 4 个候选数字' : '填满后自动验证'}</span></div>{wrongCells.length > 0 && !complete && <div className="sudoku-warning"><strong>再检查一下，有 {wrongCells.length} 格不太对。</strong><span>红色格子需要改正</span></div>}{complete && <div className="result-banner mint-result"><strong>一格不差，落地前刚好完成。</strong><button onClick={() => reset()}>再来一盘 →</button></div>}</section>
}
function Nonogram() {
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

type Suit = '♠' | '♥' | '♦' | '♣'
type PlayingCard = { id: string; rank: number; suit: Suit; faceUp: boolean }
type SelectedCard = { source: 'tableau' | 'waste'; column: number; index: number }
const suits: Suit[] = ['♠', '♥', '♦', '♣']
const rankNames = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const redSuits = new Set<Suit>(['♥', '♦'])

function makeSolitaire() {
  const deck: PlayingCard[] = suits.flatMap((suit) => Array.from({ length: 13 }, (_, i) => ({ id: `${suit}${i + 1}`, rank: i + 1, suit, faceUp: false }))).sort(() => Math.random() - 0.5)
  const tableau: PlayingCard[][] = Array.from({ length: 7 }, () => [])
  let cursor = 0
  for (let column = 0; column < 7; column += 1) for (let row = 0; row <= column; row += 1) tableau[column].push({ ...deck[cursor++], faceUp: row === column })
  return { tableau, stock: deck.slice(cursor), waste: [] as PlayingCard[], foundations: { '♠': [], '♥': [], '♦': [], '♣': [] } as Record<Suit, PlayingCard[]> }
}

function Solitaire() {
  const [game, setGame] = useState(makeSolitaire)
  const [selected, setSelected] = useState<SelectedCard | null>(null)
  const reset = () => { setGame(makeSolitaire()); setSelected(null) }
  const selectedCards = selected ? selected.source === 'waste' ? [game.waste.at(-1)] : game.tableau[selected.column].slice(selected.index) : []
  const canPlace = (card: PlayingCard | undefined, target: PlayingCard | undefined) => !card ? false : !target ? card.rank === 13 : target.faceUp && redSuits.has(card.suit) !== redSuits.has(target.suit) && card.rank === target.rank - 1
  const moveToColumn = (column: number) => {
    if (!selected || !selectedCards[0]) return
    const target = game.tableau[column].at(-1)
    if (selected.source === 'tableau' && selected.column === column) { setSelected(null); return }
    if (!canPlace(selectedCards[0], target)) { setSelected(null); return }
    setGame((previous) => {
      const moving = selected.source === 'waste' ? [previous.waste.at(-1)!] : previous.tableau[selected.column].slice(selected.index)
      const nextTableau = previous.tableau.map((pile, index) => index === column ? [...pile, ...moving] : index === selected!.column && selected!.source === 'tableau' ? pile.slice(0, selected!.index) : [...pile])
      if (selected.source === 'tableau' && nextTableau[selected.column].at(-1)?.faceUp === false) nextTableau[selected.column][nextTableau[selected.column].length - 1].faceUp = true
      return { ...previous, tableau: nextTableau, waste: selected.source === 'waste' ? previous.waste.slice(0, -1) : previous.waste }
    })
    setSelected(null)
  }
  const selectTableau = (column: number, index: number) => {
    const card = game.tableau[column][index]
    if (!card) { moveToColumn(column); return }
    if (!card.faceUp) {
      if (index === game.tableau[column].length - 1) setGame((previous) => ({ ...previous, tableau: previous.tableau.map((pile, i) => i === column ? pile.map((item, j) => j === index ? { ...item, faceUp: true } : item) : pile) }))
      return
    }
    if (selected) { moveToColumn(column); return }
    setSelected({ source: 'tableau', column, index })
  }
  const drawStock = () => {
    setSelected(null)
    setGame((previous) => {
      if (previous.stock.length) return { ...previous, stock: previous.stock.slice(0, -1), waste: [...previous.waste, { ...previous.stock.at(-1)!, faceUp: true }] }
      return { ...previous, stock: [...previous.waste].reverse().map((card) => ({ ...card, faceUp: false })), waste: [] }
    })
  }
  const moveToFoundation = (suit: Suit) => {
    if (!selected || !selectedCards[0] || selectedCards.length !== 1) return
    const card = selectedCards[0]
    const foundation = game.foundations[suit]
    if (card.suit !== suit || card.rank !== foundation.length + 1) return
    setGame((previous) => {
      const fromWaste = selected.source === 'waste'
      const nextTableau = previous.tableau.map((pile, index) => index === selected!.column ? pile.slice(0, -1) : [...pile])
      if (!fromWaste && nextTableau[selected!.column].at(-1)?.faceUp === false) nextTableau[selected!.column][nextTableau[selected!.column].length - 1].faceUp = true
      return { ...previous, tableau: nextTableau, waste: fromWaste ? previous.waste.slice(0, -1) : previous.waste, foundations: { ...previous.foundations, [suit]: [...foundation, card] } }
    })
    setSelected(null)
  }
  return <section className="game-panel solitaire-panel"><div className="game-intro"><span className="section-kicker">SOLITAIRE · KLONDIKE</span><h1>整理一手牌，<em>整理心情。</em></h1><p>点击选择牌堆，再点击目标列。红黑交替，数字递减。</p></div><div className="solitaire-top"><button className="card-slot stock" onClick={drawStock}>{game.stock.length ? <span>✦</span> : '↻'}</button><button className={`card-slot waste ${game.waste.at(-1) ? 'filled' : ''}`} onClick={() => game.waste.length && setSelected({ source: 'waste', column: -1, index: game.waste.length - 1 })}>{game.waste.at(-1) && <Card card={game.waste.at(-1)!} />}</button><div className="foundation-row">{suits.map((suit) => <button key={suit} className="card-slot foundation" onClick={() => moveToFoundation(suit)}>{game.foundations[suit].at(-1) ? <Card card={game.foundations[suit].at(-1)!} /> : <span className={redSuits.has(suit) ? 'red-suit' : ''}>{suit}</span>}</button>)}</div></div><div className="tableau">{game.tableau.map((pile, column) => <div className="tableau-column" key={column} onClick={() => selectTableau(column, pile.length)}>{pile.map((card, index) => <div className="card-wrap" key={card.id} style={{ zIndex: index + 1 }}><Card card={card} selected={selected?.source === 'tableau' && selected.column === column && index >= selected.index} onClick={(event) => { event.stopPropagation(); selectTableau(column, index) }} /></div>)}{pile.length === 0 && <span className="empty-column">K</span>}</div>)}</div><div className="game-actions"><button onClick={reset}><Icon name="refresh" />重新洗牌</button><span>点击牌面进行移动 · 点击 ♠ ♥ ♦ ♣ 归位</span></div></section>
}

function Card({ card, selected, onClick }: { card: PlayingCard; selected?: boolean; onClick?: (event: MouseEvent) => void }) {
  return <button onClick={onClick} className={`playing-card ${redSuits.has(card.suit) ? 'red-card' : ''} ${card.faceUp ? '' : 'back-card'} ${selected ? 'selected-card' : ''}`}>{card.faceUp ? <><span>{rankNames[card.rank]}</span><span>{card.suit}</span></> : <span>✦</span>}</button>
}

export default App
