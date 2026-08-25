import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { GameId } from './data'

type Stats = {
  gamesPlayed: number
  minutes: number
  streak: number
}

export type NonogramProgress = {
  puzzleId: string
  cells: number[]
  elapsed: number
  mistakes: number
  completed: boolean
}

type Store = {
  favorites: GameId[]
  recent: GameId[]
  stats: Stats
  nonogram: NonogramProgress
  toggleFavorite: (id: GameId) => void
  recordGame: (id: GameId, minutes?: number) => void
  setNonogramProgress: (progress: Partial<NonogramProgress>) => void
  resetNonogram: (puzzleId: string, size: number) => void
}

export const useGameStore = create<Store>()(
  persist(
    (set) => ({
      favorites: ['minesweeper'],
      recent: ['sudoku', 'minesweeper'],
      stats: { gamesPlayed: 12, minutes: 42, streak: 3 },
      nonogram: { puzzleId: 'plane', cells: Array(49).fill(0), elapsed: 0, mistakes: 0, completed: false },
      toggleFavorite: (id) => set((state) => ({
        favorites: state.favorites.includes(id)
          ? state.favorites.filter((gameId) => gameId !== id)
          : [...state.favorites, id],
      })),
      recordGame: (id, minutes = 4) => set((state) => ({
        recent: [id, ...state.recent.filter((gameId) => gameId !== id)].slice(0, 3),
        stats: {
          ...state.stats,
          gamesPlayed: state.stats.gamesPlayed + 1,
          minutes: state.stats.minutes + minutes,
        },
      })),
      setNonogramProgress: (progress) => set((state) => ({
        nonogram: { ...state.nonogram, ...progress },
      })),
      resetNonogram: (puzzleId, size) => set({
        nonogram: { puzzleId, cells: Array(size * size).fill(0), elapsed: 0, mistakes: 0, completed: false },
      }),
    }),
    { name: 'fly-time-storage', storage: createJSONStorage(() => localStorage) },
  ),
)
