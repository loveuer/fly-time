type IconName = 'home' | 'grid' | 'chart' | 'back' | 'info' | 'star' | 'close' | 'refresh'

export function Icon({ name }: { name: IconName }) {
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
