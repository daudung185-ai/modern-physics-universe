import { useState } from 'react'
import { relativityConcepts } from '../data/concepts'

const sections = [
  ['overview', 'Tổng quan'],
  ['spacetime', 'Không-thời gian'],
  ['curvature', 'Độ cong'],
  ['geodesic', 'Đường trắc địa'],
  ['light', 'Ánh sáng'],
  ['time', 'Giãn thời gian'],
  ['equivalence', 'Nguyên lý tương đương'],
  ['equation', 'Einstein'],
  ['history', 'Lịch sử'],
  ['modern', 'Thế kỷ 21'],
]

const modernApplications = [
  ['GPS', 'Hệ thống định vị phải hiệu chỉnh nhịp đồng hồ vệ tinh theo cả thuyết tương đối hẹp và tương đối rộng.'],
  ['Thấu kính hấp dẫn', 'Các nhà thiên văn dùng sự bẻ cong ánh sáng để quan sát thiên hà xa, lập bản đồ khối lượng và tìm vật thể tối.'],
  ['Sóng hấp dẫn', 'Những gợn trong không-thời gian đã được đo trực tiếp trong thế kỷ 21 bằng giao thoa kế laser.'],
  ['Vùng quanh hố đen', 'Chuyển động của vật chất và ánh sáng gần các vật thể cực đoan cho phép kiểm nghiệm hấp dẫn mạnh.'],
  ['Thử nghiệm hấp dẫn chính xác cao', 'Đồng hồ nguyên tử, vệ tinh và phép đo thiên văn tiếp tục kiểm tra các dự đoán của thuyết tương đối rộng.'],
]

const massStages = [
  [0.8, 'Tiểu hành tinh lớn'],
  [1.2, 'Hành tinh đá'],
  [1.7, 'Sao khí khổng lồ'],
  [2, 'Sao kiểu Mặt Trời'],
]

function MassSelector({ mass, interactive, onMassChange }) {
  const massLabel = mass.toFixed(1).replace('.', ',')
  const objectLabel = massStages.find(([limit]) => mass <= limit)?.[1] ?? massStages[3][1]

  return (
    <div className="relativity-mass-selector">
      <div className="relativity-control-heading"><span>VẬT THỂ TRUNG TÂM</span><strong>{objectLabel}</strong></div>
      <label htmlFor="relativity-mass-range" className="relativity-control-label">Khối lượng minh họa <output>{massLabel}/2,0</output></label>
      <input id="relativity-mass-range" type="range" min="0.5" max="2" step="0.1" value={mass} disabled={!interactive} aria-label="Điều chỉnh khối lượng minh họa, tối đa cỡ Mặt Trời" onChange={(event) => onMassChange(Number(event.target.value))} />
      <div className="relativity-range-ends"><span>nhỏ</span><span>tối đa ≈ Mặt Trời</span></div>
      <p>Thang điều khiển độ biến dạng trong mô phỏng; không biểu diễn tỉ lệ khối lượng thật.</p>
    </div>
  )
}

function SpacetimeDiagram() {
  return (
    <div className="relativity-spacetime-diagram" role="img" aria-label="Ba trục không gian X, Y, Z và bốn lát cắt trạng thái tách riêng trên tiến trình thời gian từ t0 đến t3">
      <div className="relativity-space-volume">
        <span className="relativity-diagram-caption">KHÔNG GIAN · X / Y / Z</span>
        <div className="relativity-space-stage" aria-hidden="true">
          <i className="relativity-space-axis relativity-axis-x" />
          <i className="relativity-space-axis relativity-axis-y" />
          <i className="relativity-space-axis relativity-axis-z" />
          {[0, 1, 2, 3].map((slice) => <span className="relativity-time-slice" key={slice} style={{ '--slice-shift': `${-slice * 13}px`, '--slice-delay': `${slice * 0.55}s` }}><i /></span>)}
          <b className="relativity-space-core" />
          <span className="relativity-axis-label relativity-label-x">X</span>
          <span className="relativity-axis-label relativity-label-y">Y</span>
          <span className="relativity-axis-label relativity-label-z">Z</span>
        </div>
      </div>
      <div className="relativity-time-progression">
        <span className="relativity-diagram-caption">THỜI GIAN · CHUỖI TRẠNG THÁI</span>
        <div className="relativity-time-track" aria-hidden="true">
          {[0, 1, 2, 3].map((slice) => <span key={slice}><i />t<sub>{slice}</sub></span>)}
        </div>
        <small>Mỗi lát cắt là một trạng thái không gian ở một thời điểm khác nhau.</small>
      </div>
    </div>
  )
}

function LightPathDiagram({ mass, passDistance, multipleLightRays }) {
  const nearY = 44 - (passDistance - 0.8) * 7
  const bend = (mass / 2) * (2.8 - passDistance) * 22
  const rayPath = (offset = 0, strength = 1) => {
    const incomingY = nearY + offset
    return `M 10 ${incomingY} C 83 ${incomingY}, 112 ${incomingY + 1}, 151 ${incomingY + 3} C 186 ${incomingY + 6}, 191 ${incomingY + bend * strength}, 310 ${incomingY + bend * strength}`
  }

  return (
    <div className="relativity-light-diagram" role="img" aria-label="Tia sáng đi gần vật thể trung tâm bị bẻ cong; độ cong đổi theo khối lượng và khoảng cách đi qua">
      <svg viewBox="0 0 320 132" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs><linearGradient id="relativity-light-gradient" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#88c9ff" stopOpacity=".25"/><stop offset=".55" stopColor="#f8e4a8"/><stop offset="1" stopColor="#fff1cb" stopOpacity=".65"/></linearGradient></defs>
        <path className="relativity-light-reference" d={`M 10 ${nearY} L 310 ${nearY}`} />
        {multipleLightRays && <><path className="relativity-light-secondary" d={rayPath(-12, 0.72)} /><path className="relativity-light-secondary" d={rayPath(-24, 0.5)} /></>}
        <circle className="relativity-light-mass-halo" cx="161" cy="76" r="29" />
        <circle className="relativity-light-mass" cx="161" cy="76" r="16" />
        <path className="relativity-light-ray" d={rayPath()} />
        <path className="relativity-light-flow" d={rayPath()} />
      </svg>
      <div className="relativity-light-diagram-labels"><span>NGUỒN SÁNG</span><span>KHỐI LƯỢNG</span><span>HƯỚNG QUAN SÁT</span></div>
    </div>
  )
}

function ClockComparison({ mass, distance }) {
  const nearClockRate = Math.max(0.46, 1 - (mass / (distance + 1.5)) * 0.46)
  const nearClockDuration = 8 / nearClockRate
  const nearRateLabel = nearClockRate.toFixed(2).replace('.', ',')

  return (
    <div className="clock-comparison">
      <div className="clock-unit">
        <div className="clock-face" style={{ '--clock-speed': `${nearClockDuration}s`, '--clock-hour-speed': `${nearClockDuration * 6}s` }} aria-label={`Đồng hồ A chạy ở tốc độ tương đối ${nearRateLabel}`}>
          <span className="clock-hand clock-hour" />
          <span className="clock-hand clock-second" />
          <i />
        </div>
        <strong>Đồng hồ A · ở gần</strong>
        <small>{nearRateLabel}×</small>
      </div>
      <div className="clock-relation" aria-hidden="true">≠</div>
      <div className="clock-unit">
        <div className="clock-face" style={{ '--clock-speed': '8s', '--clock-hour-speed': '48s' }} aria-label="Đồng hồ B ở xa chạy ở tốc độ tham chiếu">
          <span className="clock-hand clock-hour" />
          <span className="clock-hand clock-second" />
          <i />
        </div>
        <strong>Đồng hồ B · ở xa</strong>
        <small>1,00×</small>
      </div>
    </div>
  )
}

export default function RelativityOverlay({
  isVisible,
  mass,
  activeSection,
  geodesicVisible,
  onMassChange,
  onSectionChange,
  onGeodesicToggle,
  onGeodesicReplay,
  onSelect,
  lightPassDistance = 1.4,
  multipleLightRays = true,
  onLightPassDistanceChange = () => {},
  onMultipleLightRaysChange = () => {},
}) {
  const [panelOpen, setPanelOpen] = useState(() => (
    typeof window === 'undefined' || !window.matchMedia('(max-width: 1024px)').matches
  ))
  const [clockDistance, setClockDistance] = useState(3)
  const interactive = isVisible && panelOpen

  const renderSection = () => {
    switch (activeSection) {
      case 'spacetime':
        return (
          <>
            <p className="eyebrow">KHÔNG-THỜI GIAN</p>
            <h2>Ba chiều không gian kết hợp với thời gian thành một cấu trúc bốn chiều.</h2>
            <p className="topic-copy">Các tọa độ X, Y và Z mô tả vị trí trong không gian. Thời gian cho biết trật tự và khoảng cách giữa các sự kiện, nhưng không nên được hiểu hoàn toàn giống một trục không gian thông thường.</p>
            <SpacetimeDiagram />
            <p className="topic-note">Mỗi lát cắt là một trạng thái của ba chiều không gian. Thời gian mô tả sự tiếp diễn giữa các trạng thái, không phải một trục không gian thứ tư cùng loại. Hình ảnh này là phép trực quan hóa 3D của cấu trúc 4D.</p>
          </>
        )
      case 'curvature':
        return (
          <>
            <p className="eyebrow">ĐỘ CONG KHÔNG-THỜI GIAN</p>
            <h2>Vật chất làm thay đổi hình học của vùng không-thời gian xung quanh.</h2>
            <p className="topic-copy">Mạng lưới thể tích trong mô phỏng bị nén, xoắn và dịch chuyển theo cả X, Y và Z. Đây là phép ẩn dụ trực quan, không phải hình dạng vật lý nhìn thấy được của không-thời gian.</p>
            <p className="topic-note">Dùng bộ chọn khối lượng phía trên để so sánh: trường biến dạng mạnh hơn khi vật thể trung tâm nặng hơn, nhưng mô hình luôn giới hạn ở cỡ Mặt Trời.</p>
          </>
        )
      case 'geodesic':
        return (
          <>
            <p className="eyebrow">ĐƯỜNG TRẮC ĐỊA</p>
            <h2>Vật thể tự do đi theo những đường “thẳng nhất có thể” trong hình học cong.</h2>
            <p className="topic-copy">Trong thuyết tương đối rộng, một vật không cần bị kéo bởi lực hấp dẫn theo nghĩa Newton; quỹ đạo của nó phản ánh hình học không-thời gian mà nó đang đi qua.</p>
            <div className="simulation-controls">
              <button type="button" disabled={!interactive} onClick={onGeodesicToggle}>{geodesicVisible ? 'ẨN QUỸ ĐẠO' : 'HIỆN QUỸ ĐẠO'}</button>
              <button type="button" disabled={!interactive || !geodesicVisible} onClick={onGeodesicReplay}>↻ PHÁT LẠI</button>
            </div>
            <p className="topic-note"><i className="legend-geodesic" />Các điểm sáng chuyển động trên hai đường trắc địa minh họa khác nhau.</p>
          </>
        )
      case 'light':
        return (
          <>
            <p className="eyebrow">ÁNH SÁNG VÀ THẤU KÍNH HẤP DẪN</p>
            <h2>Ánh sáng cũng đi theo đường trắc địa trong không-thời gian cong.</h2>
            <p className="topic-copy">Trong thuyết tương đối rộng, ánh sáng cũng đi theo đường trắc địa của không-thời gian cong. Đi gần vật thể hơn hoặc tăng khối lượng sẽ làm mức bẻ cong rõ hơn trong mô hình.</p>
            <LightPathDiagram mass={mass} passDistance={lightPassDistance} multipleLightRays={multipleLightRays} />
            <div className="relativity-light-controls">
              <label htmlFor="relativity-light-distance" className="relativity-control-label">Khoảng cách tia đi qua tâm <output>{lightPassDistance <= 1.3 ? 'gần' : lightPassDistance >= 2 ? 'xa' : 'vừa'}</output></label>
              <input id="relativity-light-distance" type="range" min="0.8" max="2.4" step="0.1" value={lightPassDistance} disabled={!interactive} onChange={(event) => onLightPassDistanceChange(Number(event.target.value))} />
              <label className="relativity-ray-toggle"><input type="checkbox" checked={multipleLightRays} disabled={!interactive} onChange={(event) => onMultipleLightRaysChange(event.target.checked)} /><span>HIỆN NHIỀU TIA SÁNG</span></label>
            </div>
            <h3>Thấu kính hấp dẫn</h3>
            <p className="topic-copy">Một vật thể có khối lượng lớn có thể làm cong ánh sáng từ nguồn nằm phía sau, tạo ảnh phóng đại, kéo dài hoặc nhiều ảnh của cùng một nguồn.</p>
          </>
        )
      case 'time':
        return (
          <>
            <p className="eyebrow">GIÃN THỜI GIAN HẤP DẪN</p>
            <h2>Đồng hồ trong trường hấp dẫn mạnh chạy chậm hơn tương đối so với đồng hồ ở xa.</h2>
            <p className="topic-copy">So sánh hai đồng hồ dưới đây. Khoảng cách nhỏ hơn hoặc khối lượng lớn hơn làm chênh lệch nhịp thời gian rõ hơn trong mô hình.</p>
            <ClockComparison mass={mass} distance={clockDistance} />
            <div className="mass-control distance-control">
              <label htmlFor="distance-range"><span>Khoảng cách của đồng hồ A</span><output>{clockDistance}/10</output></label>
              <input id="distance-range" type="range" min="1" max="10" step="1" value={clockDistance} disabled={!interactive} aria-label="Điều chỉnh khoảng cách của đồng hồ gần khối lượng" onChange={(event) => setClockDistance(Number(event.target.value))} />
            </div>
          </>
        )
      case 'equivalence':
        return (
          <>
            <p className="eyebrow">NGUYÊN LÝ TƯƠNG ĐƯƠNG</p>
            <h2>Trong một vùng đủ nhỏ, trọng lực và gia tốc có thể không phân biệt được bằng thí nghiệm cục bộ.</h2>
            <div className="equivalence-demo">
              <article><div className="elevator gravity-elevator"><span className="test-ball" /><i>↓</i></div><strong>Thang máy trong trường hấp dẫn</strong><p>Vật rơi về phía sàn.</p></article>
              <article><div className="elevator acceleration-elevator"><span className="test-ball" /><i>↑</i></div><strong>Thang máy gia tốc trong không gian</strong><p>Sàn tăng tốc về phía vật.</p></article>
            </div>
            <p className="topic-note">Hai tình huống có thể tạo ra kết quả cục bộ tương đương, gợi ý mối liên hệ sâu sắc giữa gia tốc và hấp dẫn.</p>
          </>
        )
      case 'equation':
        return (
          <>
            <p className="eyebrow">PHƯƠNG TRÌNH TRƯỜNG EINSTEIN</p>
            <p className="equation" aria-label="Phương trình trường Einstein">Gμν + Λgμν = 8πG/c⁴ Tμν</p>
            <div className="equation-sides">
              <article><span>HÌNH HỌC KHÔNG-THỜI GIAN</span><strong>Gμν + Λgμν</strong><p>Vế trái mô tả độ cong, mêtric và đóng góp của hằng số vũ trụ.</p></article>
              <i aria-hidden="true">↔</i>
              <article><span>VẬT CHẤT VÀ NĂNG LƯỢNG</span><strong>Tμν</strong><p>Vế phải mô tả mật độ, dòng năng lượng và động lượng hiện diện.</p></article>
            </div>
            <p className="equation-summary">Vật chất và năng lượng ảnh hưởng đến hình học không-thời gian; hình học đó ảnh hưởng đến chuyển động của vật chất và ánh sáng.</p>
          </>
        )
      case 'history':
        return (
          <>
            <p className="eyebrow">TỪ TƯƠNG ĐỐI HẸP ĐẾN TƯƠNG ĐỐI RỘNG</p>
            <div className="relativity-timeline expanded-timeline">
              <div className="timeline-track">
                <article><time>1905</time><strong>Thuyết tương đối hẹp</strong><ul><li>Tốc độ ánh sáng bất biến</li><li>Giãn thời gian</li><li>Co độ dài</li><li>Tính tương đối của đồng thời</li><li>E = mc²</li></ul></article>
                <article><time>1915</time><strong>Thuyết tương đối rộng</strong><ul><li>Hấp dẫn là hình học</li><li>Không-thời gian cong</li><li>Đường trắc địa</li><li>Phương trình trường Einstein</li></ul></article>
              </div>
              <div className="timeline-transition">mở rộng nguyên lý tương đối cho hệ quy chiếu gia tốc và hấp dẫn</div>
            </div>
          </>
        )
      case 'modern':
        return (
          <>
            <p className="eyebrow">THUYẾT TƯƠNG ĐỐI TRONG THẾ KỶ 21</p>
            <h2>Từ công nghệ hằng ngày đến những phép đo hấp dẫn chính xác nhất.</h2>
            <div className="application-grid">
              {modernApplications.map(([title, description]) => <article key={title}><strong>{title}</strong><p>{description}</p></article>)}
            </div>
            <p className="topic-note">Sóng hấp dẫn chỉ được giới thiệu ở mức khái niệm trong mục này; không có mô phỏng thuộc Giai đoạn 4 được thêm.</p>
          </>
        )
      default:
        return (
          <>
            <p className="eyebrow">TỔNG QUAN</p>
            <h2>Hấp dẫn là hệ quả của hình học không-thời gian bị ảnh hưởng bởi vật chất và năng lượng.</h2>
            <p className="topic-copy">Thuyết tương đối rộng mô tả hấp dẫn qua hình học không-thời gian. Xoay góc nhìn và cuộn chuột để quan sát trường 3D; chọn khối lượng để thấy độ cong và đường đi ánh sáng thay đổi.</p>
            <div className="concept-flow"><span>Vật chất &amp; năng lượng</span><i>→</i><span>Làm cong không-thời gian</span><i>→</i><span>Ảnh hưởng chuyển động</span></div>
            <div className="visual-legend" aria-label="Chú giải mô phỏng tổng quan"><span><i className="legend-lattice" />Trường không-thời gian 3D</span><span><i className="legend-mass" />Vật thể trung tâm</span></div>
            <div className="concept-actions" aria-label="Các khái niệm tương đối rộng">
              {relativityConcepts.map((concept) => <button key={concept.id} disabled={!interactive} type="button" onClick={() => onSelect(concept)}>{concept.name}</button>)}
            </div>
          </>
        )
    }
  }

  return (
    <>
      <section
        id="relativity-information-panel"
        className={`science-overlay relativity-overlay${isVisible ? ' is-visible' : ''}${panelOpen ? '' : ' is-collapsed'}`}
        aria-hidden={!isVisible || !panelOpen}
        inert={!isVisible || !panelOpen ? true : undefined}
      >
        <div className="relativity-panel-header">
          <span>THUYẾT TƯƠNG ĐỐI</span>
          <button type="button" disabled={!interactive} onClick={() => setPanelOpen(false)}><i aria-hidden="true">‹</i> ẨN BẢNG</button>
        </div>
        <nav className="relativity-subnav" aria-label="Các mục trong phần Thuyết tương đối">
          {sections.map(([id, label], index) => (
            <button key={id} className={activeSection === id ? 'is-active' : ''} type="button" disabled={!interactive} onClick={() => onSectionChange(id)}>
              <span>{String(index + 1).padStart(2, '0')}</span>{label}
            </button>
          ))}
        </nav>
        <MassSelector mass={mass} interactive={interactive} onMassChange={onMassChange} />
        <div className="relativity-topic" key={activeSection}>{renderSection()}</div>
        <p className="scene-disclaimer">Các hình ảnh mô phỏng được đơn giản hóa cho mục đích giáo dục, không phải phép giải số đầy đủ các phương trình trường Einstein.</p>
      </section>

      <button
        className={`relativity-reveal-button${isVisible && !panelOpen ? ' is-visible' : ''}`}
        type="button"
        aria-controls="relativity-information-panel"
        aria-expanded={panelOpen}
        tabIndex={isVisible && !panelOpen ? 0 : -1}
        onClick={() => setPanelOpen(true)}
      >
        HIỆN BẢNG <i aria-hidden="true">›</i>
      </button>
    </>
  )
}
