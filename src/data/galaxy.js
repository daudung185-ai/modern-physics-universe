// An artistic, compressed Milky-Way-like model; these are scene units, not light-years.
export const GALAXY_ORIGIN = [0, 32, -790]
export const GALAXY_RADIUS = 68
export const spiralAngle = (radius, arm = 0) => arm * Math.PI / 2 + 1.28 * Math.log(1 + radius / 4.5)
const anchor = (radius, arm, offset = 0) => {
  const angle = spiralAngle(radius, arm) + offset
  return [Math.cos(angle) * radius, 1.1, Math.sin(angle) * radius]
}
export const SOLAR_ANCHOR = anchor(40, 2, 0.1)
export const ARM_ANCHOR = anchor(43, 0)
export const HALO_ANCHOR = [46, 23, -19]

export const galaxySections = [
  { id: 'overview', label: 'Tổng quan', title: 'Một thiên hà.\nVô số thế giới.', eyebrow: 'THIÊN HÀ', copy: 'Thiên hà là một hệ khổng lồ gồm sao, khí, bụi và vật chất tối, liên kết với nhau bởi hấp dẫn.' },
  { id: 'structure', label: 'Cấu trúc', title: 'Những lớp của\nmột thế giới sao.', eyebrow: 'CẤU TRÚC THIÊN HÀ', copy: 'Từ phần phình trung tâm đến đĩa sao mỏng và vùng bao ngoài, mỗi thành phần kể một phần lịch sử của thiên hà.' },
  { id: 'core', label: 'Lõi thiên hà', title: 'Nơi các vì sao\nhội tụ.', eyebrow: 'LÕI THIÊN HÀ', copy: 'Lõi thiên hà là vùng trung tâm có mật độ sao cao, phát sáng mạnh và chứa môi trường vật lý cực kỳ phức tạp.' },
  { id: 'arms', label: 'Nhánh xoắn', title: 'Những dòng sông\nánh sáng.', eyebrow: 'CÁC NHÁNH XOẮN', copy: 'Các nhánh xoắn tập trung nhiều sao trẻ, khí và bụi, tạo nên hình dạng đặc trưng của thiên hà xoắn ốc.' },
  { id: 'solar', label: 'Vị trí của chúng ta', title: 'Chúng ta ở đây.', eyebrow: 'HỆ MẶT TRỜI NẰM Ở ĐÂU?', copy: 'Hệ Mặt Trời chỉ là một phần rất nhỏ của Dải Ngân Hà. Chúng ta ở xa lõi, trong nhánh nhỏ Orion, giữa các nhánh Nhân Mã và Perseus.' },
  { id: 'rotation', label: 'Chuyển động quay', title: 'Không một ngôi sao\nnào đứng yên.', eyebrow: 'SỰ QUAY CỦA THIÊN HÀ', copy: 'Các sao quay quanh tâm thiên hà, nhưng không phải mọi vùng đều chuyển động giống nhau. Hãy so sánh thời gian để các điểm đánh dấu đi hết một vòng.' },
  { id: 'darkMatter', label: 'Vật chất tối', title: 'Điều mắt ta\nkhông nhìn thấy.', eyebrow: 'THIÊN HÀ VÀ VẬT CHẤT TỐI', copy: 'Chuyển động quay cho thấy lực hấp dẫn mạnh hơn mức có thể giải thích chỉ bằng vật chất nhìn thấy. Đây là một trong những bằng chứng về vật chất tối.' },
  { id: 'modern', label: 'Vũ trụ hiện đại', title: 'Một hòn đảo sao\ngiữa vô vàn hòn đảo.', eyebrow: 'THIÊN HÀ TRONG VŨ TRỤ HIỆN ĐẠI', copy: 'Dải Ngân Hà là một trong vô số thiên hà trong vũ trụ quan sát được. Thiên hà tương tác hấp dẫn, va chạm, sáp nhập và tiếp tục tiến hóa.' },
]

const concept = (id, name, description, notableFeatures) => ({ id, name, category: 'galaxy', type: 'Cấu trúc thiên hà', topic: 'Dải Ngân Hà', description, notableFeatures, disclaimer: 'Vị trí, kích thước và chuyển động đã được giản lược để minh họa; đây không phải bản đồ quan trắc chính xác.' })
export const galaxyConcepts = {
  core: concept('galaxy-core', 'Lõi thiên hà', 'Vùng trung tâm có mật độ sao cao, nằm trong phần phình của thiên hà.', 'Ánh sáng ấm là tổng hợp từ nhiều ngôi sao chưa thể phân giải riêng. Cấu trúc sáng này không phải một ngôi sao khổng lồ.'),
  arms: concept('galaxy-arms', 'Các nhánh xoắn', 'Các dải sao, khí và bụi vẽ nên cấu trúc xoắn ốc. Sao trẻ có sắc trắng xanh làm một số vùng nổi bật.', 'Nhánh xoắn là một cấu trúc mật độ; không phải một cánh rắn mang theo tất cả các ngôi sao.'),
  solar: concept('galaxy-solar', 'Vị trí của Hệ Mặt Trời', 'Hệ Mặt Trời ở trong nhánh nhỏ Orion, khá xa lõi Dải Ngân Hà.', 'Điểm sáng được phóng đại để dễ tìm. Toàn bộ Hệ Mặt Trời thực tế quá nhỏ để thấy ở tỉ lệ toàn thiên hà.'),
  darkMatter: concept('galaxy-dark-matter', 'Vùng vật chất tối', 'Vật chất tối không phát sáng như sao. Các nhà thiên văn suy ra sự hiện diện của nó từ tác dụng hấp dẫn.', 'Vùng màu xanh tím là ký hiệu minh họa một quầng vật chất tối mở rộng, không phải ánh sáng phát ra từ vật chất tối.'),
}

// Sources for the Vietnamese educational copy; no external assets are required.
export const galaxySources = [
  { label: 'NASA · Thiên hà', url: 'https://science.nasa.gov/universe/galaxies/' },
  { label: 'NASA · Vị trí Hệ Mặt Trời', url: 'https://science.nasa.gov/solar-system/solar-system-facts/' },
  { label: 'NASA · Vật chất tối', url: 'https://science.nasa.gov/dark-matter/' },
]

export function getGalaxyCameraPose(section, aspect) {
  const views = {
    overview: { target: [0, 0, 0], offset: [86, 88, 122] },
    structure: { target: [0, 0, 0], offset: [92, 57, 125] },
    core: { target: [0, 0, 0], offset: [30, 34, 44] },
    arms: { target: ARM_ANCHOR, offset: [40, 54, 48] },
    solar: { target: SOLAR_ANCHOR, offset: [27, 30, 38] },
    rotation: { target: [0, 0, 0], offset: [16, 144, 64] },
    darkMatter: { target: [0, 0, 0], offset: [107, 80, 139] },
    modern: { target: [0, 0, 0], offset: [100, 106, 150] },
  }
  const view = views[section] || views.overview
  const fit = Math.min(1.8, Math.max(1, 1.18 / Math.max(aspect, 0.4)))
  return {
    target: view.target.map((v, i) => v + GALAXY_ORIGIN[i]),
    position: view.offset.map((v, i) => v * fit + view.target[i] + GALAXY_ORIGIN[i]),
  }
}
