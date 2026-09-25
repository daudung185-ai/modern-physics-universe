const destinations = [
  { label: 'Vũ trụ', scene: 'hero' },
  { label: 'Trái Đất', scene: 'earth' },
  { label: 'Hệ Mặt Trời', scene: 'solarSystem' },
  { label: 'Thuyết tương đối', scene: 'relativity' },
  { label: 'Hố đen', scene: 'blackHole' },
  { label: 'Thiên hà', scene: 'galaxy' },
  { label: 'Mạng lưới vũ trụ', scene: 'cosmicWeb' },
]

export default function Navigation({ activeScene, isTransitioning, onNavigate }) {
  return (
    <nav className="side-navigation" aria-label="Các chủ đề về vũ trụ">
      {destinations.map(({ label, scene }) => (
        <button
          className={activeScene === scene ? 'is-active' : ''}
          disabled={!scene || isTransitioning}
          key={label}
          type="button"
          onClick={() => scene && onNavigate(scene)}
        >
          <span className="nav-marker" aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
