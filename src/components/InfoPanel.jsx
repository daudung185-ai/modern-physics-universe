export default function InfoPanel({ item, onClose }) {
  if (!item) return null

  const isConcept = item.category === 'relativity' || item.category === 'blackHole' || item.category === 'galaxy' || item.category === 'cosmicWeb'
  const facts = [
    ['Khối lượng', item.mass], ['Đường kính', item.diameter], ['Bán kính', item.radius],
    ['Gia tốc hấp dẫn', item.gravity], ['Nhiệt độ', item.averageTemperature], ['Chu kỳ quỹ đạo', item.orbitalPeriod],
    ['Chu kỳ tự quay', item.rotationPeriod], ['Số vệ tinh', item.numberOfMoons], ['Khoảng cách tới Mặt Trời', item.distanceFromSun],
    ['Khoảng cách tới Trái Đất', item.distanceFromEarth],
  ].filter(([, value]) => value)

  let profileLabel = 'HỒ SƠ HÀNH TINH'
  if (item.id === 'sun') profileLabel = 'HỒ SƠ NGÔI SAO'
  else if (item.id === 'moon') profileLabel = 'HỒ SƠ VỆ TINH'
  else if (item.category === 'relativity') profileLabel = 'KHÁI NIỆM TƯƠNG ĐỐI'
  else if (item.category === 'blackHole') profileLabel = 'KHÁI NIỆM HỐ ĐEN'
  else if (item.category === 'galaxy') profileLabel = 'KHÁM PHÁ THIÊN HÀ'
  else if (item.category === 'cosmicWeb') profileLabel = 'KHÁM PHÁ CẤU TRÚC LỚN'

  return (
    <aside className="info-panel" aria-live="polite">
      <button className="panel-close" type="button" onClick={onClose} aria-label="Đóng bảng thông tin">×</button>
      <p className="eyebrow">{profileLabel}</p>
      <h2>{item.name}</h2>
      <dl>
        <div><dt>Phân loại</dt><dd>{item.type}</dd></div>
        {isConcept ? (
          <div><dt>Chủ đề</dt><dd>{item.topic}</dd></div>
        ) : (
          <div>
            <dt>{item.id === 'sun' ? 'Vị trí trong hệ' : item.id === 'moon' ? 'Quay quanh' : 'Thứ tự từ Mặt Trời'}</dt>
            <dd>{item.id === 'sun' ? 'Ngôi sao trung tâm' : item.id === 'moon' ? item.parentBody : item.order}</dd>
          </div>
        )}
      </dl>
      <p>{item.description}</p>
      {facts.length > 0 && (
        <>
          <h3>Dữ liệu chính</h3>
          <dl className="fact-grid">
            {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </>
      )}
      {(item.age || item.composition || item.notableFeatures) && (
        <div className="panel-notes">
          {item.age && <p><span>Tuổi</span>{item.age}</p>}
          {item.composition && <p><span>Thành phần</span>{item.composition}</p>}
          {item.notableFeatures && <p><span>{isConcept ? 'Bối cảnh' : 'Đặc điểm'}</span>{item.notableFeatures}</p>}
        </div>
      )}
      {item.disclaimer && <p className="info-disclaimer">{item.disclaimer}</p>}
    </aside>
  )
}
