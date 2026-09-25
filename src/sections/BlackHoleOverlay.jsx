import { useState } from 'react'
import { blackHoleConcepts } from '../data/concepts'

const sections = [
  ['overview', 'Tổng quan'],
  ['horizon', 'Chân trời sự kiện'],
  ['disk', 'Đĩa bồi tụ'],
  ['time', 'Giãn thời gian'],
  ['formulas', 'Công thức'],
  ['nearby', 'Gần hố đen'],
  ['observations', 'Quan sát hiện đại'],
]

const formulas = [
  {
    name: 'Bán kính Schwarzschild',
    expression: 'rₛ = 2GM / c²',
    explanation: 'rₛ là bán kính Schwarzschild; G là hằng số hấp dẫn, M là khối lượng và c là tốc độ ánh sáng. Nếu một khối lượng nằm gọn bên trong bán kính này, một hố đen không quay có thể hình thành.',
  },
  {
    name: 'Vận tốc thoát',
    expression: 'v_thoát = √(2GM / r)',
    explanation: 'Vận tốc thoát tăng khi khối lượng lớn hơn hoặc khoảng cách r nhỏ hơn. Khi giá trị trực quan này đạt tốc độ ánh sáng, ánh sáng không thể thoát ra ngoài.',
  },
  {
    name: 'Giãn thời gian hấp dẫn',
    expression: 't_xa = t_gần / √(1 − 2GM/(rc²))',
    explanation: 'Trong mô hình Schwarzschild đơn giản hóa, đồng hồ ở gần trường hấp dẫn mạnh chạy chậm hơn tương đối so với đồng hồ ở rất xa.',
  },
  {
    name: 'Năng lượng – khối lượng',
    expression: 'E = mc²',
    explanation: 'Khối lượng và năng lượng có liên hệ chặt chẽ trong thuyết tương đối; một lượng khối lượng tương ứng với một lượng năng lượng rất lớn.',
  },
]

const conceptById = Object.fromEntries(blackHoleConcepts.map((concept) => [concept.id, concept]))

export default function BlackHoleOverlay({ isVisible, activeSection, onSectionChange, onSelect }) {
  const [panelOpen, setPanelOpen] = useState(() => (
    typeof window === 'undefined' || !window.matchMedia('(max-width: 1024px)').matches
  ))
  const interactive = isVisible && panelOpen

  const renderSection = () => {
    switch (activeSection) {
      case 'horizon':
        return (
          <>
            <p className="eyebrow">CHÂN TRỜI SỰ KIỆN</p>
            <h2>Ranh giới một chiều của nhân quả.</h2>
            <p className="topic-copy">Đây là ranh giới mà từ đó trở đi không có tín hiệu nào có thể quay trở lại với người quan sát ở xa. Nó không phải bề mặt vật chất, dù trong mô hình được thể hiện bằng một silhouette đen để dễ quan sát.</p>
            <button className="black-hole-detail-button" type="button" disabled={!interactive} onClick={() => onSelect(conceptById['event-horizon'])}>MỞ THẺ KIẾN THỨC</button>
          </>
        )
      case 'disk':
        return (
          <>
            <p className="eyebrow">ĐĨA BỒI TỤ</p>
            <h2>Plasma nóng chuyển động quanh vùng tối trung tâm.</h2>
            <p className="topic-copy">Vật chất nóng quay quanh hố đen, bị nén và ma sát mạnh, phát sáng thành đĩa bồi tụ. Vùng trong chuyển động nhanh và nóng hơn; vùng ngoài loãng, nguội và mờ dần.</p>
            <div className="disk-temperature-key" aria-label="Thang nhiệt độ trực quan của đĩa bồi tụ"><span>Nóng nhất</span><i /><span>Nguội hơn</span></div>
            <button className="black-hole-detail-button" type="button" disabled={!interactive} onClick={() => onSelect(conceptById['accretion-disk'])}>MỞ THẺ KIẾN THỨC</button>
          </>
        )
      case 'time':
        return (
          <>
            <p className="eyebrow">GIÃN THỜI GIAN HẤP DẪN</p>
            <h2>Thời gian trôi chậm hơn ở gần trường hấp dẫn mạnh.</h2>
            <p className="topic-copy">Hai đồng hồ lý tưởng ở hai khoảng cách khác nhau sẽ tích lũy thời gian khác nhau khi được so sánh. Hiệu ứng tăng mạnh khi đồng hồ tiến gần chân trời sự kiện.</p>
            <div className="black-hole-clocks" aria-label="So sánh đồng hồ gần và xa hố đen">
              <article><i className="slow-clock" /><strong>Đồng hồ gần</strong><span>chậm hơn</span></article>
              <b>≠</b>
              <article><i className="far-clock" /><strong>Đồng hồ ở xa</strong><span>nhịp tham chiếu</span></article>
            </div>
            <button className="black-hole-detail-button" type="button" disabled={!interactive} onClick={() => onSelect(conceptById['time-dilation'])}>MỞ THẺ KIẾN THỨC</button>
          </>
        )
      case 'formulas':
        return (
          <>
            <p className="eyebrow">CÔNG THỨC LIÊN QUAN</p>
            <h2>Bốn liên hệ nền tảng để đọc mô hình.</h2>
            <div className="black-hole-formulas">
              {formulas.map((formula) => (
                <article key={formula.name}>
                  <span>{formula.name}</span>
                  <strong>{formula.expression}</strong>
                  <p>{formula.explanation}</p>
                </article>
              ))}
            </div>
            <p className="topic-note">Các biểu thức được trình bày ở mức trực quan; công thức giãn thời gian áp dụng cho trường hợp Schwarzschild lý tưởng hóa.</p>
          </>
        )
      case 'nearby':
        return (
          <>
            <p className="eyebrow">ĐIỀU GÌ XẢY RA GẦN HỐ ĐEN?</p>
            <h2>Hấp dẫn cực hạn chi phối vật chất, ánh sáng và nhịp thời gian.</h2>
            <div className="black-hole-fact-list">
              <article><strong>Lực thủy triều</strong><p>Chênh lệch hấp dẫn giữa hai vị trí có thể kéo giãn vật chất theo một hướng và nén theo hướng khác.</p></article>
              <article><strong>Ánh sáng bị bẻ cong</strong><p>Đường đi của photon uốn theo hình học không-thời gian, tạo thấu kính và vòng photon biểu kiến.</p></article>
              <article><strong>Quỹ đạo vật chất</strong><p>Khí có thể quay nhiều vòng, mất năng lượng rồi rơi dần vào trong, làm đĩa nóng lên.</p></article>
              <article><strong>Trường hấp dẫn cực hạn</strong><p>Gần chân trời sự kiện, các hiệu ứng tương đối tính trở nên chi phối và trực giác Newton không còn đủ.</p></article>
            </div>
          </>
        )
      case 'observations':
        return (
          <>
            <p className="eyebrow">QUAN SÁT THIÊN VĂN HIỆN ĐẠI</p>
            <h2>Ta nhận biết hố đen qua ảnh hưởng của nó lên môi trường.</h2>
            <div className="black-hole-fact-list">
              <article><strong>Ảnh vùng bóng hố đen</strong><p>Mạng kính thiên văn vô tuyến có thể tái dựng vùng sáng bao quanh bóng tối biểu kiến gần chân trời sự kiện.</p></article>
              <article><strong>Vật chất quanh hố đen</strong><p>Phổ, độ sáng biến thiên và tia X cho biết khí nóng đang chuyển động trong trường hấp dẫn mạnh.</p></article>
              <article><strong>Kính thiên văn hiện đại</strong><p>Quan sát đa bước sóng kết hợp dữ liệu vô tuyến, quang học, hồng ngoại và tia X.</p></article>
              <article><strong>Sóng hấp dẫn</strong><p>Tín hiệu từ những hệ vật thể cực đậm đặc hợp nhất giúp đo khối lượng, spin và kiểm nghiệm hấp dẫn mạnh.</p></article>
            </div>
          </>
        )
      default:
        return (
          <>
            <p className="eyebrow">TỔNG QUAN</p>
            <h2>Hố đen là vùng không-thời gian có độ cong rất lớn.</h2>
            <p className="topic-copy">Sau chân trời sự kiện, ánh sáng cũng không thể thoát ra ngoài. Trong scene, bạn có thể kéo để xoay, cuộn để zoom và nhấp vào các vùng sáng để mở thẻ kiến thức.</p>
            <div className="black-hole-legend" aria-label="Chú giải scene Hố đen">
              <span><i className="legend-horizon" />Chân trời sự kiện</span>
              <span><i className="legend-disk" />Đĩa bồi tụ</span>
              <span><i className="legend-photon" />Vòng photon</span>
              <span><i className="legend-time" />Điểm giãn thời gian</span>
            </div>
            <div className="concept-actions" aria-label="Các khái niệm về hố đen">
              {blackHoleConcepts.map((concept) => (
                <button key={concept.id} disabled={!interactive} type="button" onClick={() => onSelect(concept)}>{concept.name}</button>
              ))}
            </div>
          </>
        )
    }
  }

  return (
    <>
      <section
        id="black-hole-information-panel"
        className={`science-overlay black-hole-overlay${isVisible ? ' is-visible' : ''}${panelOpen ? '' : ' is-collapsed'}`}
        aria-hidden={!isVisible || !panelOpen}
        inert={!isVisible || !panelOpen ? true : undefined}
      >
        <div className="black-hole-panel-header">
          <span>HỐ ĐEN</span>
          <button type="button" disabled={!interactive} onClick={() => setPanelOpen(false)}><i aria-hidden="true">‹</i> ẨN BẢNG</button>
        </div>
        <nav className="black-hole-subnav" aria-label="Các mục trong phần Hố đen">
          {sections.map(([id, label], index) => (
            <button key={id} className={activeSection === id ? 'is-active' : ''} type="button" disabled={!interactive} onClick={() => onSectionChange(id)}>
              <span>{String(index + 1).padStart(2, '0')}</span>{label}
            </button>
          ))}
        </nav>
        <div className="black-hole-topic" key={activeSection}>{renderSection()}</div>
        <p className="scene-disclaimer">Hình ảnh được đơn giản hóa cho mục đích giáo dục, không phải mô phỏng tương đối rộng đầy đủ.</p>
      </section>

      <button
        className={`black-hole-reveal-button${isVisible && !panelOpen ? ' is-visible' : ''}`}
        type="button"
        aria-controls="black-hole-information-panel"
        aria-expanded={panelOpen}
        tabIndex={isVisible && !panelOpen ? 0 : -1}
        onClick={() => setPanelOpen(true)}
      >
        HIỆN BẢNG <i aria-hidden="true">›</i>
      </button>
    </>
  )
}
