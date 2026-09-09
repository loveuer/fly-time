import { useEffect, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { Icon } from '../components/Icon'
import type { CardSuit, SavedCardSelection, SavedPlayingCard } from '../sessions'
import { useGameStore } from '../store'

type Suit = CardSuit
type PlayingCard = SavedPlayingCard
type SelectedCard = SavedCardSelection

const suits: Suit[] = ['♠', '♥', '♦', '♣']
const rankNames = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const redSuits = new Set<Suit>(['♥', '♦'])

const getTableauCardOffset = (cardCount: number) => cardCount < 2 ? 57 : Math.max(18, Math.min(57, Math.floor(234 / (cardCount - 1))))

function makeSolitaire() {
  const deck: PlayingCard[] = suits.flatMap((suit) => Array.from({ length: 13 }, (_, i) => ({ id: `${suit}${i + 1}`, rank: i + 1, suit, faceUp: false }))).sort(() => Math.random() - 0.5)
  const tableau: PlayingCard[][] = Array.from({ length: 7 }, () => [])
  let cursor = 0
  for (let column = 0; column < 7; column += 1) for (let row = 0; row <= column; row += 1) tableau[column].push({ ...deck[cursor++], faceUp: row === column })
  return { tableau, stock: deck.slice(cursor), waste: [] as PlayingCard[], foundations: { '♠': [], '♥': [], '♦': [], '♣': [] } as Record<Suit, PlayingCard[]> }
}

export function Solitaire() {
  const savedSession = useGameStore((state) => state.solitaire)
  const saveSolitaire = useGameStore((state) => state.saveSolitaire)
  const [game, setGame] = useState<ReturnType<typeof makeSolitaire>>(() => {
    if (!savedSession?.game || savedSession.game.tableau.length !== 7) return makeSolitaire()
    return {
      tableau: savedSession.game.tableau.map((pile) => pile.map((card) => ({ ...card }))),
      stock: savedSession.game.stock.map((card) => ({ ...card })),
      waste: savedSession.game.waste.map((card) => ({ ...card })),
      foundations: {
        '♠': savedSession.game.foundations['♠'].map((card) => ({ ...card })),
        '♥': savedSession.game.foundations['♥'].map((card) => ({ ...card })),
        '♦': savedSession.game.foundations['♦'].map((card) => ({ ...card })),
        '♣': savedSession.game.foundations['♣'].map((card) => ({ ...card })),
      },
    }
  })
  const [selected, setSelected] = useState<SelectedCard | null>(() => savedSession?.selected ?? null)

  useEffect(() => {
    saveSolitaire({ game, selected })
  }, [game, saveSolitaire, selected])

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
  return <section className="game-panel solitaire-panel"><div className="game-intro"><span className="section-kicker">SOLITAIRE · KLONDIKE</span><h1>整理一手牌，<em>整理心情。</em></h1><p>点击选择牌堆，再点击目标列。红黑交替，数字递减。</p></div><div className="solitaire-top"><button className="card-slot stock" onClick={drawStock}>{game.stock.length ? <span>✦</span> : '↻'}</button><button className={`card-slot waste ${game.waste.at(-1) ? 'filled' : ''}`} onClick={() => game.waste.length && setSelected({ source: 'waste', column: -1, index: game.waste.length - 1 })}>{game.waste.at(-1) && <Card card={game.waste.at(-1)!} />}</button><div className="foundation-row">{suits.map((suit) => <button key={suit} className="card-slot foundation" onClick={() => moveToFoundation(suit)}>{game.foundations[suit].at(-1) ? <Card card={game.foundations[suit].at(-1)!} /> : <span className={redSuits.has(suit) ? 'red-suit' : ''}>{suit}</span>}</button>)}</div></div><div className="tableau">{game.tableau.map((pile, column) => <div className="tableau-column" key={column} onClick={() => selectTableau(column, pile.length)} style={{ '--card-offset': `${getTableauCardOffset(pile.length)}px` } as CSSProperties}>{pile.map((card, index) => <div className="card-wrap" key={card.id} style={{ zIndex: index + 1 }}><Card card={card} selected={selected?.source === 'tableau' && selected.column === column && index >= selected.index} onClick={(event) => { event.stopPropagation(); selectTableau(column, index) }} /></div>)}{pile.length === 0 && <span className="empty-column">K</span>}</div>)}</div><div className="game-actions"><button onClick={reset}><Icon name="refresh" />重新洗牌</button><span>点击牌面进行移动 · 点击 ♠ ♥ ♦ ♣ 归位</span></div></section>
}

function Card({ card, selected, onClick }: { card: PlayingCard; selected?: boolean; onClick?: (event: MouseEvent) => void }) {
  return <button onClick={onClick} className={`playing-card ${redSuits.has(card.suit) ? 'red-card' : ''} ${card.faceUp ? '' : 'back-card'} ${selected ? 'selected-card' : ''}`}>{card.faceUp ? <><span>{rankNames[card.rank]}</span><span>{card.suit}</span></> : <span>✦</span>}</button>
}
