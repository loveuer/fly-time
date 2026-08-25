import { useEffect, useState } from 'react'
import type { MouseEvent } from 'react'
import { getGame, games, type GameId } from './src/data'
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
  return <div className="game-screen"><header className="game-header"><button className="back-button" onClick={onBack}><Icon name="back" /></button><div><span className="section-kicker">{game.category}</span><h2>{game.title}</h2></div><span className={`game-header-icon ${game.color}`}>{game.icon}</span></header>{id === 'minesweeper' && <Minesweeper />}{id === 'sudoku' && <Sudoku />}{id === 'solitaire' && <Solitaire />}</div>
}

type MineCell = { mine: boolean; open: boolean; flagged: boolean; adjacent: number }
const mineSize = 9
const mineCount = 10

function makeMines(): MineCell[] {
  const cells = Array.from({ length: mineSize * mineSize }, () => ({ mine: false, open: false, flagged: false, adjacent: 0 }))
  const positions = Array.from({ length: cells.length }, (_, index) => index).sort(() => Math.random() - 0.5).slice(0, mineCount)
  positions.forEach((index) => { cells[index].mine = true })
  cells.forEach((cell, index) => {
    if (cell.mine) return
    cell.adjacent = around(index).filter((next) => cells[next].mine).length
  })
  return cells
}

function around(index: number) {
  const row = Math.floor(index / mineSize)
  const column = index % mineSize
  const indexes: number[] = []
  for (let y = -1; y <= 1; y += 1) for (let x = -1; x <= 1; x += 1) {
    if (!x && !y) continue
    const nextRow = row + y
    const nextColumn = column + x
    if (nextRow >= 0 && nextRow < mineSize && nextColumn >= 0 && nextColumn < mineSize) indexes.push(nextRow * mineSize + nextColumn)
  }
  return indexes
}

function Minesweeper() {
  const [board, setBoard] = useState(makeMines)
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [flagMode, setFlagMode] = useState(false)
  const [startedAt, setStartedAt] = useState(Date.now())
  const [, setClock] = useState(0)
  const flags = board.filter((cell) => cell.flagged).length

  useEffect(() => {
    if (status !== 'playing') return
    const timer = window.setInterval(() => setClock((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [status])

  const reset = () => { setBoard(makeMines()); setStatus('playing'); setStartedAt(Date.now()) }
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
        if (next[current].adjacent === 0) around(current).forEach((near) => { if (!next[near].mine) queue.push(near) })
      }
      if (next.every((cell) => cell.mine || cell.open)) setStatus('won')
      return next
    })
  }
  const toggleFlag = (index: number) => {
    if (status !== 'playing') return
    setBoard((previous) => previous.map((cell, cellIndex) => cellIndex === index && !cell.open ? { ...cell, flagged: !cell.flagged } : cell))
  }
  const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))

  return <section className="game-panel mines-panel"><div className="game-intro"><span className="section-kicker">MINESWEEPER · BEGINNER</span><h1>保持冷静，<em>找到出口。</em></h1><p>点击安全的格子，数字告诉你附近有几颗雷。</p></div><div className="mine-toolbar"><div><small>地雷</small><strong>{String(mineCount - flags).padStart(2, '0')}</strong></div><div className={`game-status ${status}`}>{status === 'playing' ? '进行中' : status === 'won' ? '完成啦' : '踩雷了'}</div><div><small>时间</small><strong>{String(elapsed).padStart(3, '0')}</strong></div></div><div className="mine-board" role="grid">{board.map((cell, index) => <button key={index} className={`mine-cell ${cell.open ? 'open' : ''} ${cell.flagged ? 'flagged' : ''} n${cell.adjacent}`} onClick={() => reveal(index)} onContextMenu={(event) => { event.preventDefault(); toggleFlag(index) }} aria-label={`第 ${index + 1} 格`}>{cell.open ? cell.mine ? '✦' : cell.adjacent || '' : cell.flagged ? '⚑' : ''}</button>)}</div><div className="mode-toggle"><button className={!flagMode ? 'selected' : ''} onClick={() => setFlagMode(false)}>⌁ 挖掘</button><button className={flagMode ? 'selected' : ''} onClick={() => setFlagMode(true)}>⚑ 标记</button></div><div className="game-actions"><button onClick={reset}><Icon name="refresh" />重新开始</button><span>长按或右键可以标记地雷</span></div>{status !== 'playing' && <div className="result-banner"><strong>{status === 'won' ? '漂亮！航线安全。' : '差一点，再来一局？'}</strong><button onClick={reset}>再玩一次 →</button></div>}</section>
}

const sudokuSolution = [5, 3, 4, 6, 7, 8, 9, 1, 2, 6, 7, 2, 1, 9, 5, 3, 4, 8, 1, 9, 8, 3, 4, 2, 5, 6, 7, 8, 5, 9, 7, 6, 1, 4, 2, 3, 4, 2, 6, 8, 5, 3, 7, 9, 1, 7, 1, 3, 9, 2, 4, 8, 5, 6, 9, 6, 1, 5, 3, 7, 2, 8, 4, 2, 8, 7, 4, 1, 9, 6, 3, 5, 3, 4, 5, 2, 8, 6, 1, 7, 9]
const sudokuPuzzle = [5, 3, 0, 0, 7, 0, 0, 0, 2, 6, 0, 2, 1, 9, 5, 0, 0, 0, 0, 9, 8, 0, 0, 0, 0, 6, 0, 8, 0, 0, 7, 0, 0, 0, 3, 0, 4, 0, 0, 8, 0, 3, 0, 0, 1, 7, 0, 0, 0, 2, 0, 0, 0, 6, 0, 6, 0, 0, 0, 0, 0, 2, 8, 0, 0, 0, 4, 1, 9, 0, 0, 0, 0, 0, 0, 0, 0, 7, 9]

function Sudoku() {
  const [board, setBoard] = useState(sudokuPuzzle)
  const [selected, setSelected] = useState<number | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [complete, setComplete] = useState(false)
  const reset = () => { setBoard(sudokuPuzzle); setSelected(null); setMistakes(0); setComplete(false) }
  const setNumber = (number: number) => {
    if (selected === null || sudokuPuzzle[selected] !== 0 || complete) return
    if (number !== sudokuSolution[selected]) { setMistakes((count) => count + 1); return }
    setBoard((previous) => {
      const next = [...previous]
      next[selected] = number
      if (next.every((value) => value !== 0)) setComplete(true)
      return next
    })
  }
  const activeNumber = selected === null ? null : board[selected]
  return <section className="game-panel sudoku-panel"><div className="game-intro"><span className="section-kicker">SUDOKU · EASY</span><h1>给数字，<em>一点秩序。</em></h1><p>点击空格，再选择下方的数字。慢慢来，不着急。</p></div><div className="sudoku-meta"><span>错误 <b>{mistakes}/3</b></span><span className={complete ? 'complete-label' : ''}>{complete ? '完成啦 ✦' : '进行中 · 还剩 ' + board.filter((value) => value === 0).length + ' 格'}</span></div><div className="sudoku-board">{board.map((value, index) => <button key={index} className={`sudoku-cell ${sudokuPuzzle[index] ? 'given' : 'editable'} ${selected === index ? 'selected' : ''} ${activeNumber && value === activeNumber ? 'same-number' : ''} ${Math.floor(index / 9) % 3 === 2 ? 'block-bottom' : ''} ${index % 9 % 3 === 2 ? 'block-right' : ''}`} onClick={() => setSelected(index)}>{value || ''}</button>)}</div><div className="number-pad">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => <button key={number} className={activeNumber === number ? 'active' : ''} onClick={() => setNumber(number)}>{number}</button>)}<button className="erase" onClick={() => { if (selected !== null && !sudokuPuzzle[selected]) setBoard((prev) => prev.map((value, index) => index === selected ? 0 : value)) }}>⌫</button></div><div className="game-actions"><button onClick={reset}><Icon name="refresh" />重新开始</button><span>已自动保存当前进度</span></div>{complete && <div className="result-banner mint-result"><strong>一格不差，落地前刚好完成。</strong><button onClick={reset}>再来一盘 →</button></div>}</section>
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
