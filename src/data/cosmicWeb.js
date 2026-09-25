import { GALAXY_ORIGIN } from './galaxy.js'

// A finite, artistic volume, not the edge of the Universe or an observed catalogue.
// Sharing an origin lets the galaxy recede naturally during the change of scale.
export const COSMIC_ORIGIN = GALAXY_ORIGIN
export const COSMIC_SCALE = 6
export const COSMIC_VOIDS = [
  { center: [-38, 4, 24], radius: 39 },
  { center: [51, 14, -28], radius: 37 },
  { center: [-26, 18, -70], radius: 31 },
  { center: [54, -27, 70], radius: 28 },
]
export const COSMIC_CLUSTER = [12, 31, 25]
export const COSMIC_FILAMENT = [-57, 36, 59]
export const COSMIC_DARK_HINT = [34, 45, 32]
export const COSMIC_EXPANSION = [-6, -29, 85]

export const cosmicSections = [
  { id: 'overview', label: 'Tổng quan', eyebrow: 'MẠNG LƯỚI VŨ TRỤ', title: 'Không phải cô lập.\nMà là kết nối.', copy: 'Ở quy mô rất lớn, các thiên hà tạo thành một mạng lưới gồm những sợi vật chất, các cụm thiên hà và những vùng rỗng rộng lớn.' },
  { id: 'filaments', label: 'Sợi vật chất', eyebrow: 'CÁC SỢI VẬT CHẤT', title: 'Những nhịp cầu\nqua bóng tối.', copy: 'Các sợi vật chất là những cấu trúc kéo dài, nơi khí, vật chất tối và các thiên hà tập trung thành những dải trên quy mô vũ trụ.' },
  { id: 'clusters', label: 'Cụm thiên hà', eyebrow: 'CỤM THIÊN HÀ', title: 'Nơi mạng lưới\nhội tụ.', copy: 'Tại những nút giao, mật độ vật chất tăng lên. Đây là nơi có thể hình thành các nhóm và cụm thiên hà lớn, liên kết bởi hấp dẫn.' },
  { id: 'voids', label: 'Vùng rỗng', eyebrow: 'VÙNG RỖNG VŨ TRỤ', title: 'Khoảng trống cũng\ncó một hình dạng.', copy: 'Giữa các sợi là những vùng có mật độ vật chất thấp hơn nhiều. Chúng không hoàn toàn trống rỗng, nhưng có rất ít thiên hà so với các vùng tập trung.' },
  { id: 'darkMatter', label: 'Vật chất tối', eyebrow: 'VẬT CHẤT TỐI VÀ CẤU TRÚC LỚN', title: 'Bộ khung\nkhông phát sáng.', copy: 'Trong mô hình vũ trụ hiện đại, hấp dẫn của vật chất tối góp phần tạo nên các cấu trúc lớn. Khí và thiên hà phân bố trong bộ khung hấp dẫn này.' },
  { id: 'formation', label: 'Sự hình thành', eyebrow: 'SỰ HÌNH THÀNH CẤU TRÚC', title: 'Từ chênh lệch nhỏ\nđến mạng lưới lớn.', copy: 'Qua thời gian, những chênh lệch mật độ ban đầu phát triển dưới tác dụng của hấp dẫn. Vật chất tập trung dần vào các sợi và các nút.' },
  { id: 'expansion', label: 'Sự giãn nở', eyebrow: 'VŨ TRỤ ĐANG GIÃN NỞ', title: 'Khoảng cách lớn lên.\nQuy mô thay đổi.', copy: 'Ở quy mô lớn, khoảng cách giữa các vùng không liên kết hấp dẫn có thể tăng theo sự giãn nở của không gian. Không phải mọi cấu trúc đều bị kéo giãn theo.' },
  { id: 'observations', label: 'Quan sát hiện đại', eyebrow: 'TỪ QUAN SÁT ĐẾN BẢN ĐỒ', title: 'Đọc cấu trúc\ntừ ánh sáng.', copy: 'Khảo sát vị trí, độ dịch đỏ và hình dạng thiên hà giúp dựng bản đồ ba chiều, rồi đối chiếu với mô phỏng số về sự phát triển của cấu trúc lớn.' },
]

const concept = (id, name, description, notableFeatures) => ({ id: `cosmic-${id}`, name, category: 'cosmicWeb', type: 'Cấu trúc quy mô lớn', topic: 'Mạng lưới vũ trụ', description, notableFeatures, disclaimer: 'Mô hình minh họa có tỉ lệ, màu sắc và thời gian được giản lược; không phải bản đồ quan trắc hay mô phỏng hấp dẫn chính xác.' })
export const cosmicConcepts = {
  filaments: concept('filaments', 'Sợi vật chất', 'Những dải vật chất kéo dài kết nối các vùng tập trung thiên hà.', 'Ánh sáng mờ biểu diễn mật độ vật chất, không phải những dây sáng có thể nhìn trực tiếp bằng mắt. Mỗi chấm gợi một thiên hà hoặc một mẫu mật độ, không phải một ngôi sao.'),
  clusters: concept('clusters', 'Cụm thiên hà', 'Các nhóm và cụm thiên hà tập trung ở những miền có mật độ cao của mạng lưới.', 'Một nút sáng chứa nhiều điểm thành viên và quầng mềm, thay vì một vật thể đặc duy nhất. Đây là cụm minh họa, không mang tên một cụm đã quan sát.'),
  voids: concept('voids', 'Vùng rỗng vũ trụ', 'Một thể tích rộng lớn có mật độ vật chất và số thiên hà thấp hơn môi trường xung quanh.', 'Đường bao mờ chỉ giúp nhận biết thể tích ba chiều. Vùng rỗng thật không có một lớp vỏ phát sáng, và không phải chân không tuyệt đối.'),
  darkMatter: concept('dark-matter', 'Dấu vết của vật chất tối', 'Ta suy ra vật chất tối qua ảnh hưởng hấp dẫn, chẳng hạn lên chuyển động hoặc sự uốn cong ánh sáng.', 'Lớp tím nhạt bám theo các sợi chỉ tượng trưng cho phân bố vật chất vô hình. Đây không phải ánh sáng phát ra từ vật chất tối.'),
  expansion: concept('expansion', 'Khoảng cách đang thay đổi', 'Giãn nở được minh họa bằng khoảng cách giữa hai vùng độc lập tăng lên, trong khi kích thước từng vùng giữ nguyên.', 'Các cấu trúc đã liên kết hấp dẫn, như thiên hà hoặc cụm thiên hà, không đơn giản phình lên cùng sự giãn nở vũ trụ. Các con số trong minh họa là tỉ lệ tương đối, không phải tuổi hay kích thước thật.'),
}

export const cosmicSources = [
  { label: 'NASA · Cấu trúc quy mô lớn', url: 'https://science.nasa.gov/universe/galaxies/large-scale-structures/' },
  { label: 'ESA · Sự phân bố vật chất', url: 'https://www.esa.int/Science_Exploration/Space_Science/Planck/The_cosmic_microwave_background_and_the_distribution_of_matter_in_the_Universe' },
  { label: 'ESA · Lập bản đồ vật chất tối', url: 'https://www.esa.int/ESA_Multimedia/Videos/2024/09/Weak_gravitational_lensing_how_Euclid_maps_dark_matter/%28lang%29/en' },
  { label: 'NASA · Độ dịch đỏ vũ trụ', url: 'https://science.nasa.gov/mission/hubble/science/science-behind-the-discoveries/hubble-cosmological-redshift/' },
]

const poses = {
  overview: { target: [0, 0, 0], offset: [163, 115, 216] },
  filaments: { target: COSMIC_FILAMENT, offset: [77, 58, 101] },
  clusters: { target: COSMIC_CLUSTER, offset: [48, 34, 68] },
  voids: { target: COSMIC_VOIDS[0].center, offset: [73, 51, 104] },
  darkMatter: { target: [0, 0, 0], offset: [159, 131, 223] },
  formation: { target: [0, 0, 0], offset: [145, 116, 238] },
  expansion: { target: COSMIC_EXPANSION, offset: [42, 64, 121] },
  observations: { target: [0, 0, 0], offset: [189, 153, 226] },
}

export function getCosmicCameraPose(section = 'overview', aspect = 1.5) {
  const view = poses[section] || poses.overview
  const fit = Math.min(2.55, Math.max(1, 1.23 / Math.max(aspect, 0.4)))
  return {
    target: view.target.map((v, i) => COSMIC_ORIGIN[i] + v * COSMIC_SCALE),
    position: view.offset.map((v, i) => COSMIC_ORIGIN[i] + (view.target[i] + v * fit) * COSMIC_SCALE),
  }
}
