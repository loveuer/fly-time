export type GameId = 'minesweeper' | 'solitaire' | 'sudoku'

export type GameMeta = {
  id: GameId
  title: string
  subtitle: string
  description: string
  icon: string
  color: string
  category: string
  difficulty: string
  time: string
}

export const games: GameMeta[] = [
  {
    id: 'minesweeper',
    title: '扫雷',
    subtitle: '拆弹手册',
    description: '每一步都要冷静一点。',
    icon: '▦',
    color: 'coral',
    category: '动脑',
    difficulty: '轻松',
    time: '5–15 分钟',
  },
  {
    id: 'solitaire',
    title: '纸牌',
    subtitle: '一个人的牌局',
    description: '把这一手牌，慢慢理顺。',
    icon: '♠',
    color: 'violet',
    category: '经典',
    difficulty: '中等',
    time: '10–30 分钟',
  },
  {
    id: 'sudoku',
    title: '数独',
    subtitle: '九宫格',
    description: '让脑海里的杂音安静下来。',
    icon: '数',
    color: 'mint',
    category: '专注',
    difficulty: '中等',
    time: '10–20 分钟',
  },
]

export const getGame = (id: GameId) => games.find((game) => game.id === id)!
