export type CardSuit = '♠' | '♥' | '♦' | '♣'

export type SavedMineCell = {
  mine: boolean
  open: boolean
  flagged: boolean
  adjacent: number
}

export type SavedMinesweeperSession = {
  difficulty: string
  board: SavedMineCell[]
  status: 'playing' | 'won' | 'lost'
  startedAt: number
}

export type SavedSudokuSession = {
  difficulty: string
  puzzle: number[]
  solution: number[]
  board: number[]
  notes: number[][]
  selected: number | null
  mistakes: number
  wrongCells: number[]
  complete: boolean
}

export type SavedPlayingCard = {
  id: string
  rank: number
  suit: CardSuit
  faceUp: boolean
}

export type SavedSolitaireGame = {
  tableau: SavedPlayingCard[][]
  stock: SavedPlayingCard[]
  waste: SavedPlayingCard[]
  foundations: Record<CardSuit, SavedPlayingCard[]>
}

export type SavedCardSelection = {
  source: 'tableau' | 'waste'
  column: number
  index: number
}

export type SavedSolitaireSession = {
  game: SavedSolitaireGame
  selected: SavedCardSelection | null
}
