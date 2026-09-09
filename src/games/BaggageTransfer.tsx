import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import type { SavedBaggageSession, SavedBaggageSnapshot } from '../sessions'
import { useGameStore } from '../store'

type Difficulty = 'easy' | 'middle' | 'hard'

type DifficultyOption = {
  id: Difficulty
  label: string
  count: number
  capacity: number
  minimumInversions: number
}

const difficulties: DifficultyOption[] = [
  { id: 'easy', label: '简单', count: 6, capacity: 3, minimumInversions: 3 },
  { id: 'middle', label: '中等', count: 9, capacity: 3, minimumInversions: 9 },
  { id: 'hard', label: '困难', count: 12, capacity: 3, minimumInversions: 18 },
]

const getDifficulty = (difficulty: Difficulty) => difficulties.find((option) => option.id === difficulty)!

const copySnapshot = (session: SavedBaggageSnapshot): SavedBaggageSnapshot => ({
  inputIndex: session.inputIndex,
  stack: [...session.stack],
  queue: [...session.queue],
  output: [...session.output],
  status: session.status,
})

const snapshot = (session: SavedBaggageSession): SavedBaggageSnapshot => copySnapshot(session)

const shuffle = <T,>(items: T[]) => {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const next = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[next]] = [result[next], result[index]]
  }
  return result
}

const inversionCount = (source: string[], target: string[]) => {
  const positions = new Map(source.map((item, index) => [item, index]))
  return target.reduce((count, item, index) => count + target.slice(index + 1).filter((next) => positions.get(item)! > positions.get(next)!).length, 0)
}

const createTarget = (source: string[], capacity: number) => {
  let inputIndex = 0
  const stack: string[] = []
  const queue: string[] = []
  const target: string[] = []

  while (target.length < source.length) {
    const canStore = inputIndex < source.length && (stack.length < capacity || queue.length < capacity)
    const shouldStore = canStore && (inputIndex < 2 || Math.random() < 0.64)
    if (shouldStore) {
      const item = source[inputIndex++]
      if (stack.length >= capacity || (queue.length < capacity && Math.random() < 0.5)) queue.push(item)
      else stack.push(item)
      continue
    }
    if (stack.length && queue.length) {
      if (Math.random() < 0.5) target.push(stack.pop()!)
      else target.push(queue.shift()!)
    }
    else if (stack.length) target.push(stack.pop()!)
    else if (queue.length) target.push(queue.shift()!)
  }
  return target
}

const fallbackTarget = (source: string[]) => {
  const target: string[] = []
  for (let index = 1; index < source.length; index += 3) target.push(...source.slice(index, index + 3).reverse())
  return [...target, source[0]]
}

const createSession = (difficulty: Difficulty): SavedBaggageSession => {
  const config = getDifficulty(difficulty)
  const source = shuffle(Array.from({ length: config.count }, (_, index) => String.fromCharCode(65 + index)))
  let target = fallbackTarget(source)
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const candidate = createTarget(source, config.capacity)
    if (candidate[0] !== source[0] && inversionCount(source, candidate) >= config.minimumInversions) {
      target = candidate
      break
    }
  }
  return { difficulty, source, target, inputIndex: 0, stack: [], queue: [], output: [], history: [], status: 'playing' }
}

const isSavedSession = (session: SavedBaggageSession | null): session is SavedBaggageSession => {
  if (!session || !difficulties.some((option) => option.id === session.difficulty)) return false
  const config = getDifficulty(session.difficulty as Difficulty)
  const validItems = (items: unknown) => Array.isArray(items) && items.every((item) => typeof item === 'string')
  return validItems(session.source) && validItems(session.target) && validItems(session.stack) && validItems(session.queue) && validItems(session.output)
    && session.source.length === config.count && session.target.length === config.count
    && new Set(session.source).size === config.count && session.target.every((item) => session.source.includes(item))
    && Number.isInteger(session.inputIndex) && session.inputIndex >= 0 && session.inputIndex <= config.count
    && Array.isArray(session.history) && (session.status === 'playing' || session.status === 'won')
}

const cloneSession = (session: SavedBaggageSession): SavedBaggageSession => ({
  ...session,
  source: [...session.source],
  target: [...session.target],
  stack: [...session.stack],
  queue: [...session.queue],
  output: [...session.output],
  history: session.history.map(copySnapshot),
})

const tokenTone = (item: string) => `tone-${item.charCodeAt(0) % 4}`

function Bag({ item, compact = false }: { item: string; compact?: boolean }) {
  return <span className={`baggage-token ${tokenTone(item)} ${compact ? 'compact' : ''}`}>{item}</span>
}

export function BaggageTransfer() {
  const savedSession = useGameStore((state) => state.baggage)
  const saveBaggage = useGameStore((state) => state.saveBaggage)
  const [session, setSession] = useState<SavedBaggageSession>(() => isSavedSession(savedSession) ? cloneSession(savedSession) : createSession('easy'))
  const difficulty = session.difficulty as Difficulty
  const config = getDifficulty(difficulty)
  const nextInput = session.source[session.inputIndex]
  const nextTarget = session.target[session.output.length]
  const stackTop = session.stack.at(-1)
  const queueHead = session.queue[0]
  const canSendStack = stackTop === nextTarget
  const canSendQueue = queueHead === nextTarget
  const stuck = session.status === 'playing' && !canSendStack && !canSendQueue && (!nextInput || (session.stack.length === config.capacity && session.queue.length === config.capacity))

  useEffect(() => {
    saveBaggage(session)
  }, [saveBaggage, session])

  const update = (change: (current: SavedBaggageSession) => SavedBaggageSession) => {
    setSession((current) => {
      if (current.status === 'won') return current
      const next = change(current)
      return { ...next, history: [...current.history, snapshot(current)].slice(-80) }
    })
  }

  const store = (target: 'stack' | 'queue') => {
    if (!nextInput || session[target].length >= config.capacity) return
    update((current) => ({
      ...current,
      inputIndex: current.inputIndex + 1,
      [target]: [...current[target], current.source[current.inputIndex]],
    }))
  }

  const dispatch = (from: 'stack' | 'queue') => {
    const item = from === 'stack' ? stackTop : queueHead
    if (!item || item !== nextTarget) return
    update((current) => {
      const output = [...current.output, item]
      return {
        ...current,
        stack: from === 'stack' ? current.stack.slice(0, -1) : current.stack,
        queue: from === 'queue' ? current.queue.slice(1) : current.queue,
        output,
        status: output.length === current.target.length ? 'won' : 'playing',
      }
    })
  }

  const undo = () => setSession((current) => {
    const previous = current.history.at(-1)
    return previous ? { ...current, ...copySnapshot(previous), history: current.history.slice(0, -1) } : current
  })

  const restart = () => setSession((current) => ({ ...current, inputIndex: 0, stack: [], queue: [], output: [], history: [], status: 'playing' }))

  return <section className="game-panel baggage-panel">
    <div className="game-intro"><span className="section-kicker">BAGGAGE TRANSFER · STACK + QUEUE</span><h1>安排次序，<em>送它登机。</em></h1><p>到达带只能先取先放；栈后进先出，等候带先进先出。按目标顺序送出所有行李。</p></div>
    <div className="baggage-difficulty">{difficulties.map((option) => <button key={option.id} className={difficulty === option.id ? 'active' : ''} onClick={() => setSession(createSession(option.id))}><strong>{option.label}</strong><small>{option.count} 件 · {option.capacity} 格</small></button>)}</div>
    <div className="baggage-target"><div><span className="section-kicker">登机目标</span><strong>{session.status === 'won' ? '全部完成 ✦' : `下一件：${nextTarget}`}</strong></div><div className="baggage-target-list">{session.target.map((item, index) => <Bag key={`${item}-${index}`} item={item} compact />)}</div></div>
    <div className="baggage-workspace">
      <article className="baggage-station incoming"><div className="station-heading"><span>到达传送带</span><small>FIFO · 只能取最前一件</small></div><div className="incoming-bags">{session.source.slice(session.inputIndex, session.inputIndex + 6).map((item) => <Bag key={item} item={item} />)}{!nextInput && <span className="empty-bags">已全部入库</span>}</div><div className="baggage-store-actions"><button disabled={!nextInput || session.stack.length >= config.capacity || session.status === 'won'} onClick={() => store('stack')}>放入栈</button><button disabled={!nextInput || session.queue.length >= config.capacity || session.status === 'won'} onClick={() => store('queue')}>放入队列</button></div></article>
      <div className="baggage-buffers">
        <article className="baggage-station stack-station"><div className="station-heading"><span>叠放车</span><small>Stack · 后进先出</small></div><div className="buffer-bags stack-bags">{session.stack.map((item) => <Bag key={item} item={item} />)}{!stackTop && <span className="empty-bags">空</span>}</div><button className="dispatch-button" disabled={!canSendStack || session.status === 'won'} onClick={() => dispatch('stack')}>{stackTop ? canSendStack ? `送出 ${stackTop}` : `栈顶 ${stackTop}` : '栈空'}</button></article>
        <article className="baggage-station queue-station"><div className="station-heading"><span>等候传送带</span><small>Queue · 先进先出</small></div><div className="buffer-bags queue-bags">{session.queue.map((item) => <Bag key={item} item={item} />)}{!queueHead && <span className="empty-bags">空</span>}</div><button className="dispatch-button" disabled={!canSendQueue || session.status === 'won'} onClick={() => dispatch('queue')}>{queueHead ? canSendQueue ? `送出 ${queueHead}` : `队首 ${queueHead}` : '队空'}</button></article>
      </div>
    </div>
    <div className={`baggage-message ${stuck ? 'warning' : session.status === 'won' ? 'complete' : ''}`}>{session.status === 'won' ? '全部行李已按次序登机，漂亮的调度。' : stuck ? '暂存区堵住了：下一件不在栈顶或队首，撤销一步重新安排。' : `当前要送出 ${nextTarget}；可随时先继续接收下一件行李。`}</div>
    <div className="game-actions"><button disabled={session.history.length === 0} onClick={undo}>↶ 撤销</button><button onClick={restart}><Icon name="refresh" />重新开始</button><button onClick={() => setSession(createSession(difficulty))}>随机新局</button></div>
    {session.status === 'won' && <div className="result-banner mint-result"><strong>节奏刚好，所有行李已送达。</strong><button onClick={() => setSession(createSession(difficulty))}>下一局 →</button></div>}
  </section>
}
