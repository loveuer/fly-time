export type NonogramPuzzle = {
  id: string
  name: string
  hint: string
  rows: string[]
}

export const nonogramPuzzles: NonogramPuzzle[] = [
  {
    id: 'plane',
    name: '小飞机',
    hint: '准备起飞',
    rows: [
      '0001000',
      '0011100',
      '0111110',
      '1111111',
      '0011100',
      '0011100',
      '0110110',
    ],
  },
  {
    id: 'cat',
    name: '小猫',
    hint: '窗边的朋友',
    rows: [
      '0101010',
      '1111111',
      '1111111',
      '0111110',
      '0011100',
      '0110110',
      '1100011',
    ],
  },
  {
    id: 'coffee',
    name: '咖啡杯',
    hint: '再来一杯',
    rows: [
      '0111110',
      '0100010',
      '0100011',
      '0111110',
      '0011100',
      '0011100',
      '0110110',
    ],
  },
]

export const getNonogramPuzzle = (id: string) => nonogramPuzzles.find((puzzle) => puzzle.id === id) ?? nonogramPuzzles[0]

export const getClues = (line: string) => {
  const clues: number[] = []
  let count = 0
  for (const cell of line) {
    if (cell === '1') count += 1
    else if (count) {
      clues.push(count)
      count = 0
    }
  }
  if (count) clues.push(count)
  return clues.length ? clues : [0]
}

export const getColumn = (rows: string[], column: number) => rows.map((row) => row[column]).join('')

export const isFilledCell = (puzzle: NonogramPuzzle, index: number) => puzzle.rows[Math.floor(index / puzzle.rows.length)][index % puzzle.rows.length] === '1'
