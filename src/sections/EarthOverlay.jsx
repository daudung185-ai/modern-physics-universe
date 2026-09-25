export default function EarthOverlay({ isVisible, onExplore }) {
  return (
    <section className={`earth-overlay${isVisible ? ' is-visible' : ''}`} aria-hidden={!isVisible}>
      <p className="eyebrow">TRÁI ĐẤT</p>
      <h2>Hành trình của chúng ta bắt đầu từ một thế giới nhỏ bé giữa vũ trụ bao la.</h2>
      <p className="earth-note">Ngôi nhà của nhân loại.</p>
      <button className="journey-button" disabled={!isVisible} type="button" onClick={onExplore}>
        <span>KHÁM PHÁ HỆ MẶT TRỜI</span>
        <i aria-hidden="true">↗</i>
      </button>
    </section>
  )
}
