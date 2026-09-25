import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { cosmicConcepts, cosmicSections, cosmicSources } from '../data/cosmicWeb.js'

// The timeline writes a shared numeric ref, not React state every frame.
// The 3D renderer and the accessible slider therefore use the same progress.
function SimulationControl({ kind, simulation }) {
  const slider = useRef()
  const output = useRef()
  const timeline = useRef()
  const [playing, setPlaying] = useState(false)
  const isFormation = kind === 'formation'
  const sync = () => {
    const value = simulation.current[kind]
    if (slider.current) slider.current.value = String(value)
    if (output.current) output.current.textContent = isFormation ? `${Math.round(value * 100)}%` : `${(1 + value * 0.28).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}×`
  }
  function play(restart = false) {
    timeline.current?.kill()
    if (restart || simulation.current[kind] >= 0.999) simulation.current[kind] = 0
    setPlaying(true)
    timeline.current = gsap.to(simulation.current, { [kind]: 1, duration: 8 * (1 - simulation.current[kind]), ease: 'none', onUpdate: sync, onComplete: () => setPlaying(false) })
  }
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { simulation.current[kind] = 1; sync() }
    else play(true)
    return () => timeline.current?.kill()
    // This control is mounted afresh for each selected illustration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, simulation])
  return <div className="cosmic-simulation">
    <div className="cosmic-control-heading"><span>{isFormation ? 'DIỄN TIẾN MINH HỌA' : 'KHOẢNG CÁCH TƯƠNG ĐỐI'}</span><output ref={output}>{isFormation ? '0%' : '1,00×'}</output></div>
    <label htmlFor={`cosmic-${kind}-range`}>{isFormation ? 'Mức độ hình thành cấu trúc' : 'Mức độ giãn nở minh họa'}</label>
    <input id={`cosmic-${kind}-range`} ref={slider} type="range" min="0" max="1" step="0.005" defaultValue={simulation.current[kind]} onChange={(event) => {
      timeline.current?.kill(); setPlaying(false); simulation.current[kind] = Number(event.target.value); sync()
    }} />
    <div className="cosmic-range-ends"><span>{isFormation ? 'Phân bố ban đầu' : 'Khoảng cách ban đầu'}</span><span>{isFormation ? 'Mạng lưới' : 'Xa hơn 28%'}</span></div>
    <div className="cosmic-simulation-actions">
      <button type="button" onClick={() => { if (playing) { timeline.current?.kill(); setPlaying(false) } else play() }}>{playing ? 'TẠM DỪNG' : 'TIẾP TỤC'}</button>
      <button type="button" onClick={() => play(true)}>XEM LẠI ↺</button>
    </div>
    <p>{isFormation ? 'Các hạt được nội suy về vị trí cuối để giải thích ý tưởng; không giải phương trình hấp dẫn, không biểu diễn tuổi vũ trụ.' : 'Chỉ khoảng cách giữa hai vùng đánh dấu tăng. Kích thước mỗi vùng giữ nguyên; đây không phải mô hình tiến hóa của toàn bộ mạng lưới.'}</p>
  </div>
}

function TopicContent({ section, simulation, onSelect }) {
  switch (section) {
    case 'filaments': return <><div className="cosmic-thread-diagram" aria-hidden="true"><i /><i /><i /><b /><b /></div><p className="cosmic-detail">Nhìn dọc theo sợi đang được nhấn sáng: mật độ thay đổi, nhiều nhánh nhỏ nối vào nhau và chạy qua các lớp không gian khác nhau.</p><button className="cosmic-link-button" type="button" onClick={() => onSelect(cosmicConcepts.filaments)}>KHÁM PHÁ SỢI VẬT CHẤT ↗</button></>
    case 'clusters': return <><div className="cosmic-focus-card"><span>MẬT ĐỘ CAO</span><strong>Không phải một thiên hà.<br />Mà là nhiều thiên hà.</strong></div><p className="cosmic-detail">Những điểm tập trung dày đặc tạo thành lõi sáng và quầng mềm. Hấp dẫn liên kết các thiên hà cùng khí nóng và vật chất tối trong cụm.</p><button className="cosmic-link-button" type="button" onClick={() => onSelect(cosmicConcepts.clusters)}>MỞ THÔNG TIN CỤM ↗</button></>
    case 'voids': return <><div className="cosmic-void-diagram" aria-hidden="true"><i /><span>THƯA VẬT CHẤT</span></div><p className="cosmic-detail">Đường bao đứt nét đánh dấu một thể tích rỗng trong mô hình. Hãy xoay góc nhìn để thấy các sợi bao quanh nó từ nhiều phía.</p><p className="cosmic-note">Đường bao là chú giải, không phải một lớp vỏ vật lý. “Rỗng” nghĩa là mật độ thấp, không phải tuyệt đối không có vật chất.</p><button className="cosmic-link-button" type="button" onClick={() => onSelect(cosmicConcepts.voids)}>TÌM HIỂU VÙNG RỖNG ↗</button></>
    case 'darkMatter': return <><div className="cosmic-layer-key"><span><i />Thiên hà và vật chất nhìn thấy</span><span><i />Phân bố vật chất tối · ký hiệu</span></div><p className="cosmic-detail">Lớp mờ rộng hơn quanh các sợi gợi ý bộ khung hấp dẫn vô hình. Quan sát thấu kính hấp dẫn giúp kiểm tra sự phân bố vật chất này.</p><p className="cosmic-note">Màu tím nhạt không phải màu thật của vật chất tối. Mục này chỉ giới thiệu vai trò của nó trong cấu trúc lớn.</p><button className="cosmic-link-button" type="button" onClick={() => onSelect(cosmicConcepts.darkMatter)}>ĐỌC VỀ BỘ KHUNG HẤP DẪN ↗</button></>
    case 'formation': return <><SimulationControl kind="formation" simulation={simulation} /><div className="cosmic-steps"><span>01 · Chênh lệch mật độ</span><span>02 · Vật chất tập trung</span><span>03 · Sợi và nút hình thành</span></div></>
    case 'expansion': return <><SimulationControl kind="expansion" simulation={simulation} /><p className="cosmic-note">Các hệ đã liên kết hấp dẫn như thiên hà và cụm thiên hà không đơn giản phình lên cùng không gian. Minh họa chọn hai vùng độc lập.</p><button className="cosmic-link-button" type="button" onClick={() => onSelect(cosmicConcepts.expansion)}>HIỂU ĐÚNG VỀ GIÃN NỞ ↗</button></>
    case 'observations': return <><div className="cosmic-observation-list"><article><span>01</span><div><strong>Khảo sát thiên hà</strong><p>Vị trí trên trời và độ dịch đỏ giúp ước lượng phân bố trong không gian.</p></div></article><article><span>02</span><div><strong>Thấu kính hấp dẫn</strong><p>Biến dạng nhỏ của ảnh thiên hà giúp suy ra vật chất dọc đường truyền ánh sáng.</p></div></article><article><span>03</span><div><strong>Mô phỏng số</strong><p>Đối chiếu các mô hình hình thành cấu trúc với bản đồ quan sát.</p></div></article></div><div className="cosmic-sources"><span>TÌM HIỂU TỪ NASA VÀ ESA</span>{cosmicSources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}</div></>
    default: return <><div className="cosmic-overview-key"><span><i />Sợi · kết nối</span><span><i />Cụm · hội tụ</span><span><i />Vùng rỗng · tương phản</span></div><p className="cosmic-detail">Mỗi điểm sáng gợi một thiên hà hoặc một mẫu mật độ, không phải một ngôi sao. Xoay bản đồ để cảm nhận các sợi chạy trước, sau và xuyên qua chiều sâu.</p><div className="cosmic-invitation">Từ một thiên hà riêng lẻ<br />đến cấu trúc kết nối vô số thiên hà.</div></>
  }
}

export default function CosmicWebOverlay({ isVisible, section, simulation, onSectionChange, onSelect, onResetView }) {
  const [open, setOpen] = useState(() => typeof window === 'undefined' || !window.matchMedia('(max-width: 1024px)').matches)
  const content = useRef()
  const current = cosmicSections.find((item) => item.id === section) || cosmicSections[0]
  const interactive = isVisible && open
  useEffect(() => { if (content.current) content.current.scrollTop = 0 }, [section])
  function navigateTabs(event, index) {
    const offset = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0
    if (!offset && event.key !== 'Home' && event.key !== 'End') return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? cosmicSections.length - 1 : (index + offset + cosmicSections.length) % cosmicSections.length
    onSectionChange(cosmicSections[next].id)
    document.getElementById(`cosmic-tab-${cosmicSections[next].id}`)?.focus()
  }
  return <>
    <section id="cosmic-panel" className={`cosmic-panel${isVisible ? ' is-visible' : ''}${open ? '' : ' is-collapsed'}`} aria-label="Khám phá mạng lưới vũ trụ" aria-hidden={!interactive} inert={!interactive ? true : undefined}>
      <header className="cosmic-panel-header"><span><i />CẤU TRÚC QUY MÔ LỚN</span><button type="button" disabled={!interactive} onClick={() => setOpen(false)}>ẨN BẢNG ‹</button></header>
      <nav className="cosmic-tabs" role="tablist" aria-label="Các chủ đề mạng lưới vũ trụ">
        {cosmicSections.map((item, index) => <button id={`cosmic-tab-${item.id}`} key={item.id} type="button" role="tab" aria-selected={section === item.id} aria-controls="cosmic-tab-content" tabIndex={section === item.id ? 0 : -1} disabled={!interactive} onClick={() => onSectionChange(item.id)} onKeyDown={(event) => navigateTabs(event, index)}><span>{String(index + 1).padStart(2, '0')}</span>{item.label}</button>)}
      </nav>
      <div id="cosmic-tab-content" ref={content} className="cosmic-panel-content" role="tabpanel" aria-labelledby={`cosmic-tab-${current.id}`} tabIndex={interactive ? 0 : -1}>
        <div key={section} className="cosmic-topic"><p className="cosmic-eyebrow">{current.eyebrow}</p><h2>{current.title}</h2><p className="cosmic-introduction">{current.copy}</p>
          {isVisible && <TopicContent section={section} simulation={simulation} onSelect={onSelect} />}
        </div>
        <p className="cosmic-footnote">Một thể tích minh họa, không phải toàn bộ vũ trụ. Hình học, độ sáng và thời gian đã được giản lược; không phải dữ liệu quan trắc.</p>
      </div>
    </section>
    <button className={`cosmic-reveal${isVisible && !open ? ' is-visible' : ''}`} type="button" aria-controls="cosmic-panel" aria-expanded={open} tabIndex={isVisible && !open ? 0 : -1} onClick={() => setOpen(true)}>HIỆN BẢNG ›</button>
    <div className={`cosmic-hud${isVisible ? ' is-visible' : ''}`} aria-hidden={!isVisible}><div><span>BẢN ĐỒ CẤU TRÚC LỚN</span><small>Kéo để xoay · Cuộn hoặc chụm để thu phóng</small></div><button type="button" disabled={!isVisible} onClick={onResetView}>↗ VỀ TOÀN CẢNH</button></div>
  </>
}
