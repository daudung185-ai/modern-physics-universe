import { useEffect, useRef, useState } from 'react'
import { galaxyConcepts, galaxySections, galaxySources } from '../data/galaxy'

function RotationCurve() {
  return (
    <figure className="galaxy-curve">
      <svg viewBox="0 0 300 172" role="img" aria-label="Sơ đồ định tính: đường vận tốc quan sát được duy trì cao ở vùng ngoài, trong khi dự đoán chỉ từ vật chất phát sáng giảm dần">
        <path className="galaxy-curve-grid" d="M32 30H282M32 65H282M32 100H282M32 136H282M32 20V136" />
        <path className="galaxy-curve-visible" d="M33 132C48 113 63 52 93 45S162 90 280 113" />
        <path className="galaxy-curve-observed" d="M33 132C47 100 69 45 96 43S214 42 280 41" />
        <text x="34" y="12">Vận tốc quỹ đạo</text><text x="122" y="160">Khoảng cách tới tâm →</text>
      </svg>
      <figcaption><span><i />Quan sát điển hình</span><span><i />Chỉ vật chất phát sáng</span></figcaption>
      <p>Sơ đồ định tính, không phải một bộ dữ liệu đo đạc. Vùng bao trong scene chỉ biểu tượng hóa phân bố vật chất tối.</p>
    </figure>
  )
}

function SectionContent({ section, onSelect }) {
  switch (section) {
    case 'structure':
      return <div className="galaxy-anatomy">
        {[
          ['01', 'Lõi', 'Miền trung tâm dày đặc sao.', 'core'],
          ['02', 'Phần phình', 'Khối sao ba chiều ôm quanh lõi.'],
          ['03', 'Đĩa thiên hà', 'Lớp sao, khí và bụi tương đối mỏng.'],
          ['04', 'Nhánh xoắn', 'Những vùng mật độ cao trên đĩa.', 'arms'],
          ['05', 'Quầng sao', 'Các sao thưa phân bố ngoài đĩa.'],
          ['06', 'Bụi và khí', 'Vệt tối xen giữa các dải sáng.'],
        ].map(([number, title, copy, id]) => <div key={number}><span>{number}</span><article>{id ? <button type="button" onClick={() => onSelect(galaxyConcepts[id])}>{title} ↗</button> : <strong>{title}</strong>}<p>{copy}</p></article></div>)}
      </div>
    case 'core':
      return <><div className="galaxy-pullquote">Một vùng sáng.<br />Hàng triệu câu chuyện sao.</div><p className="galaxy-detail">Lõi hòa vào phần phình ba chiều. Ánh sáng ấm trong mô hình là tổng hợp của nhiều sao, không phải ánh sáng của một quả cầu duy nhất.</p><button className="galaxy-text-button" type="button" onClick={() => onSelect(galaxyConcepts.core)}>TÌM HIỂU VÙNG TRUNG TÂM ↗</button></>
    case 'arms':
      return <><div className="galaxy-color-key"><span><i />Sao trẻ trắng xanh</span><span><i />Khí mờ và bụi tối</span><span><i />Sao vàng, cam</span></div><p className="galaxy-detail">Các nhánh không đều tăm tắp: cụm sao, mây khí và vùng bụi đan xen tạo nên cấu trúc có mật độ khác nhau. Nhánh xoắn không phải cánh quạt rắn.</p><button className="galaxy-text-button" type="button" onClick={() => onSelect(galaxyConcepts.arms)}>KHÁM PHÁ NHÁNH XOẮN ↗</button></>
    case 'solar':
      return <><div className="galaxy-location-card"><span>ĐỊA CHỈ VŨ TRỤ CỦA CHÚNG TA</span><strong>Nhánh nhỏ Orion</strong><div className="galaxy-location-track"><i /><b /></div><div className="galaxy-location-ends"><span>Lõi thiên hà</span><span>Vùng ngoài đĩa</span></div></div><p className="galaxy-detail">Điểm đánh dấu xanh nhạt là vị trí xấp xỉ của Hệ Mặt Trời. Nó đã được phóng đại; ở quy mô này, các hành tinh riêng lẻ không thể nhìn thấy.</p><button className="galaxy-text-button" type="button" onClick={() => onSelect(galaxyConcepts.solar)}>MỞ THÔNG TIN VỊ TRÍ ↗</button></>
    case 'rotation':
      return <><div className="galaxy-orbit-key"><span><i />Vòng trong</span><span><i />Vòng giữa</span><span><i />Vòng ngoài</span></div><p className="galaxy-detail">Ba điểm chuyển động giúp so sánh tốc độ góc: vùng ngoài mất nhiều thời gian hơn để đi hết một vòng. Tốc độ được tăng mạnh để có thể quan sát trong vài giây.</p><p className="galaxy-note">Tốc độ quỹ đạo và tốc độ góc khác nhau: một vòng lớn hơn có thể mất lâu hơn dù ngôi sao vẫn chuyển động nhanh.</p></>
    case 'darkMatter':
      return <><RotationCurve /><button className="galaxy-text-button" type="button" onClick={() => onSelect(galaxyConcepts.darkMatter)}>VẬT CHẤT TỐI LÀ GÌ? ↗</button></>
    case 'modern':
      return <><div className="galaxy-evolution"><article><span>01</span><strong>Tương tác</strong><p>Hấp dẫn có thể kéo dài và biến dạng thiên hà.</p></article><article><span>02</span><strong>Tiến hóa</strong><p>Sự hình thành sao và sáp nhập thay đổi cấu trúc theo thời gian.</p></article><article><span>03</span><strong>Quan sát</strong><p>Kính thiên văn ở nhiều bước sóng hé lộ sao, khí và bụi.</p></article></div><div className="galaxy-sources"><span>ĐỌC THÊM TỪ NASA</span>{galaxySources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div></>
    default:
      return <><div className="galaxy-overview-stat"><span>04</span><p>nhánh xoắn chính<br /><small>trong mô hình minh họa</small></p></div><p className="galaxy-detail">Quan sát từ trên cao để thấy hình xoắn ốc. Nghiêng góc nhìn để nhận ra đĩa mỏng, phần phình trung tâm và chiều sâu của quầng sao.</p><div className="galaxy-invitation"><i aria-hidden="true" />Tìm điểm sáng xanh nhạt — đó là nơi chúng ta gọi là nhà.</div></>
  }
}

export default function GalaxyOverlay({ isVisible, section, onSectionChange, onSelect, onResetView }) {
  const [open, setOpen] = useState(() => typeof window === 'undefined' || !window.matchMedia('(max-width: 1024px)').matches)
  const content = useRef()
  const current = galaxySections.find((item) => item.id === section) || galaxySections[0]
  useEffect(() => { if (content.current) content.current.scrollTop = 0 }, [section])
  const interactive = isVisible && open

  function handleTabKey(event, index) {
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
    if (!direction && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? galaxySections.length - 1 : (index + direction + galaxySections.length) % galaxySections.length
    onSectionChange(galaxySections[next].id)
    document.getElementById(`galaxy-tab-${galaxySections[next].id}`)?.focus()
  }

  return <>
    <section id="galaxy-panel" className={`galaxy-panel${isVisible ? ' is-visible' : ''}${open ? '' : ' is-collapsed'}`} aria-hidden={!interactive} inert={!interactive ? true : undefined}>
      <header className="galaxy-panel-header"><span><i />DẢI NGÂN HÀ</span><button type="button" onClick={() => setOpen(false)} disabled={!interactive}>ẨN BẢNG ‹</button></header>
      <nav className="galaxy-tabs" role="tablist" aria-label="Khám phá thiên hà">
        {galaxySections.map((item, index) => <button
          id={`galaxy-tab-${item.id}`} key={item.id} role="tab" type="button" aria-selected={section === item.id}
          aria-controls="galaxy-tab-content" className={section === item.id ? 'is-active' : ''}
          tabIndex={section === item.id ? 0 : -1} disabled={!interactive}
          onKeyDown={(event) => handleTabKey(event, index)} onClick={() => onSectionChange(item.id)}
        ><span>{String(index + 1).padStart(2, '0')}</span>{item.label}</button>)}
      </nav>
      <div ref={content} id="galaxy-tab-content" className="galaxy-panel-content" role="tabpanel" aria-labelledby={`galaxy-tab-${current.id}`} tabIndex={interactive ? 0 : -1}>
        <div className="galaxy-topic" key={section}>
          <p className="galaxy-eyebrow">{current.eyebrow}</p><h2>{current.title}</h2><p className="galaxy-introduction">{current.copy}</p>
          <SectionContent section={section} onSelect={onSelect} />
        </div>
        <p className="galaxy-footnote">Mô hình nghệ thuật có tỉ lệ giản lược, lấy cảm hứng từ thiên hà xoắn ốc và Dải Ngân Hà.</p>
      </div>
    </section>
    <button className={`galaxy-reveal${isVisible && !open ? ' is-visible' : ''}`} aria-expanded={open} aria-controls="galaxy-panel" type="button" onClick={() => setOpen(true)} tabIndex={isVisible && !open ? 0 : -1}>HIỆN BẢNG ›</button>
    <div className={`galaxy-hud${isVisible ? ' is-visible' : ''}`} aria-hidden={!isVisible}>
      <div><span>XOAY ĐỂ KHÁM PHÁ</span><small>Cuộn hoặc chụm hai ngón để thu phóng</small></div>
      <button type="button" onClick={onResetView} disabled={!isVisible}>↗ VỀ TOÀN CẢNH</button>
    </div>
  </>
}
