export default function Hero({ isVisible, onStart }) {
  return (
    <section className={`hero${isVisible ? '' : ' is-hidden'}`} aria-hidden={!isVisible} aria-labelledby="hero-title">
      <p className="eyebrow">VẬT LÝ HIỆN ĐẠI</p>
      <h1 id="hero-title">Khám phá Vũ trụ</h1>
      <p className="hero-copy">Từ các hạt lượng tử đến mạng lưới vũ trụ.</p>
      <button className="journey-button" disabled={!isVisible} type="button" onClick={onStart}>
        <span>BẮT ĐẦU HÀNH TRÌNH</span>
        <i aria-hidden="true">↗</i>
      </button>
    </section>
  )
}
