import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { GameId } from './data'

type Stats = {
  gamesPlayed: number
  minutes: number
  streak: number
}

type Store = {
  favorites: GameId[]
  recent: GameId[]
  stats: Stats
  toggleFavorite: (id: GameId) => void
  recordGame: (id: GameId, minutes?: number) => void
}

export const useGameStore = create<Store>()(
  persist(
    (set) => ({
      favorites: ['minesweeper'],
      recent: ['sudoku', 'minesweeper'],
      stats: { gamesPlayed: 12, minutes: 42, streak: 3 },
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
    }),
    { name: 'fly-time-storage', storage: createJSONStorage(() => localStorage) },
  ),
)
