import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import { Icon } from './src/components/Icon'
import { getGame, games, type GameId } from './src/data'
import { BaggageTransfer } from './src/games/BaggageTransfer'
import { Minesweeper } from './src/games/Minesweeper'
import { Nonogram } from './src/games/Nonogram'
import { Solitaire } from './src/games/Solitaire'
import { Sudoku } from './src/games/Sudoku'
import { useGameStore } from './src/store'

type Screen = 'home' | 'library' | 'stats'

const pagePaths: Record<Screen, string> = { home: '/', library: '/library', stats: '/stats' }
const gameViews: Record<GameId, ComponentType> = { minesweeper: Minesweeper, solitaire: Solitaire, sudoku: Sudoku, nonogram: Nonogram, baggage: BaggageTransfer }

const getPathname = () => window.location.pathname.replace(/\/+$/, '') || '/'

const getRoute = (pathname: string): { screen: Screen; gameId?: GameId } => {
  const gameId = pathname.slice(1) as GameId
  if (games.some((game) => game.id === gameId)) return { screen: 'home', gameId }
  if (pathname === '/library') return { screen: 'library' }
  if (pathname === '/stats') return { screen: 'stats' }
  return { screen: 'home' }
}

function App() {
  const [hydrated, setHydrated] = useState(() => useGameStore.persist.hasHydrated())
  const [pathname, setPathname] = useState(getPathname)
  const [showAbout, setShowAbout] = useState(false)
  const recordGame = useGameStore((state) => state.recordGame)

  useEffect(() => {
    if (useGameStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useGameStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  useEffect(() => {
    const updatePathname = () => setPathname(getPathname())
    window.addEventListener('popstate', updatePathname)
    return () => window.removeEventListener('popstate', updatePathname)
  }, [])

  const navigate = (path: string) => {
    if (path === getPathname()) return
    window.history.pushState({}, '', path)
    setPathname(path)
  }

  const openGame = (id: GameId) => {
    recordGame(id, 0)
    navigate(`/${id}`)
  }

  if (!hydrated) return <div className="hydration-screen"><span className="brand-mark">✦</span><span>正在恢复旅程…</span></div>

  const route = getRoute(pathname)
  if (route.gameId) return <GameScreen id={route.gameId} onBack={() => navigate('/')} />

  return <div className="app-shell">
    <main className="main-content">
      {route.screen === 'home' && <Home onOpen={openGame} onAbout={() => setShowAbout(true)} />}
      {route.screen === 'library' && <Library onOpen={openGame} />}
      {route.screen === 'stats' && <Stats />}
    </main>
    <BottomNav screen={route.screen} onChange={(screen) => navigate(pagePaths[screen])} />
    {showAbout && <About onClose={() => setShowAbout(false)} />}
  </div>
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
    <div className="game-grid home-grid">{games.map((game) => <GameCard key={game.id} game={game} onOpen={onOpen} />)}</div>
    <section className="section-heading recent-heading"><div><span className="section-kicker">YOUR JOURNEY</span><h2>最近玩过</h2></div><button className="text-button" onClick={() => onOpen(recentGames[0]?.id || 'minesweeper')}>继续 <span>→</span></button></section>
    {recentGames.length > 0 && <div className="recent-row">{recentGames.slice(0, 2).map((game) => <button className="recent-item" key={game.id} onClick={() => onOpen(game.id)}><span className={`recent-icon ${game.color}`}>{game.icon}</span><span><strong>{game.title}</strong><small>{game.subtitle}</small></span><span className="recent-arrow">↗</span></button>)}</div>}
    <div className="daily-note"><span>☼</span><div><strong>今日小提示</strong><p>专注 10 分钟，窗外的云会更好看。</p></div></div>
    <div className="home-statline"><span>本次旅程 <b>{stats.minutes} 分钟</b></span><span className="separator">·</span><span>连续 <b>{stats.streak} 天</b></span></div>
  </>
}

function GameCard({ game, onOpen }: { game: ReturnType<typeof getGame>; onOpen: (id: GameId) => void }) {
  const favorite = useGameStore((state) => state.favorites.includes(game.id))
  const toggleFavorite = useGameStore((state) => state.toggleFavorite)
  return <article className={`game-card ${game.color}`}>
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
  const Game = gameViews[id]
  return <div className="game-screen"><header className="game-header"><button className="back-button" onClick={onBack}><Icon name="back" /></button><div><span className="section-kicker">{game.category}</span><h2>{game.title}</h2></div><span className={`game-header-icon ${game.color}`}>{game.icon}</span></header><Game /></div>
}

export default App
