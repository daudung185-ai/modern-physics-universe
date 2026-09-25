import * as THREE from 'three'
import { COSMIC_CLUSTER, COSMIC_FILAMENT, COSMIC_VOIDS } from '../data/cosmicWeb.js'

function generator(seed) {
  let value = seed >>> 0
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296 }
}
const vector = (array) => new THREE.Vector3(...array)
const voids = COSMIC_VOIDS.map(({ center, radius }) => ({ center: vector(center), radius }))

export function outsideVoids(point, margin = 0) {
  return voids.every((region) => point.distanceTo(region.center) >= region.radius + margin)
}

// A deterministic spatial graph: minimum-length backbone + local branches.
// Explicit underdense volumes and Poisson spacing avoid a random particle soup
// or a visible cubic lattice. Curves bend around the excluded volumes.
export function createCosmicNetwork() {
  const rand = generator(713095)
  const nodes = [vector(COSMIC_CLUSTER), vector(COSMIC_FILAMENT), new THREE.Vector3(0, 0, 0)]
  for (let attempt = 0; nodes.length < 64 && attempt < 12000; attempt += 1) {
    const p = new THREE.Vector3((rand() - 0.5) * 270, (rand() - 0.5) * 174, (rand() - 0.5) * 226)
    if ((p.x / 144) ** 2 + (p.y / 98) ** 2 + (p.z / 128) ** 2 > 1.12) continue
    if (!outsideVoids(p, 5) || nodes.some((node) => node.distanceToSquared(p) < 26 ** 2)) continue
    nodes.push(p)
  }
  const edges = []
  const existing = new Set()
  const degree = new Uint8Array(nodes.length)
  const add = (a, b) => {
    const key = [Math.min(a, b), Math.max(a, b)].join(':')
    if (existing.has(key)) return
    existing.add(key); edges.push([a, b]); degree[a] += 1; degree[b] += 1
  }
  const visited = new Set([0])
  while (visited.size < nodes.length) {
    let best = Infinity; let pair
    for (const a of visited) for (let b = 0; b < nodes.length; b += 1) {
      if (visited.has(b)) continue
      const distance = nodes[a].distanceToSquared(nodes[b])
      if (distance < best) { best = distance; pair = [a, b] }
    }
    add(...pair); visited.add(pair[1])
  }
  for (let a = 0; a < nodes.length; a += 1) {
    const nearest = nodes.map((node, b) => ({ b, distance: node.distanceTo(nodes[a]) })).filter(({ b }) => b !== a).sort((x, y) => x.distance - y.distance)
    for (const { b, distance } of nearest.slice(0, 4)) {
      if (distance < 77 && degree[a] < 4 && degree[b] < 5) add(a, b)
    }
  }
  const curves = edges.map(([a, b], index) => {
    const start = nodes[a]; const end = nodes[b]
    const path = [start.clone()]
    const direction = end.clone().sub(start).normalize()
    const perpendicular = new THREE.Vector3(-direction.z, 0.37, direction.x).normalize()
    const bend = (rand() - 0.5) * 14
    for (let j = 1; j < 5; j += 1) {
      const t = j / 5
      const point = start.clone().lerp(end, t).addScaledVector(perpendicular, Math.sin(t * Math.PI) * bend)
      // Project control points outside voids; particles also enforce exclusion.
      for (let pass = 0; pass < 3; pass += 1) for (const region of voids) {
        const offset = point.clone().sub(region.center)
        if (offset.length() < region.radius + 5) point.copy(region.center).add(offset.normalize().multiplyScalar(region.radius + 5))
      }
      path.push(point)
    }
    path.push(end.clone())
    return { curve: new THREE.CatmullRomCurve3(path, false, 'centripetal'), width: 0.9 + rand() * 1.5, featured: a === 1 || b === 1, index }
  })
  const strengths = nodes.map((_, index) => index === 0 ? 2.2 : 0.55 + degree[index] * 0.18 + rand() * 0.75)
  return { nodes, curves, strengths, edges }
}

function cloudBuilder(count) {
  const position = new Float32Array(count * 3)
  const initial = new Float32Array(count * 3)
  const color = new Float32Array(count * 3)
  const size = new Float32Array(count)
  const phase = new Float32Array(count)
  const feature = new Float32Array(count)
  const rand = generator(count + 8041)
  const rgb = new THREE.Color()
  const put = (index, point, tint, brightness, diameter, featured = 0) => {
    point.toArray(position, index * 3)
    initial[index * 3] = (rand() - 0.5) * 270
    initial[index * 3 + 1] = (rand() - 0.5) * 174
    initial[index * 3 + 2] = (rand() - 0.5) * 226
    rgb.set(tint).multiplyScalar(brightness).toArray(color, index * 3)
    size[index] = diameter; phase[index] = rand() * Math.PI * 2; feature[index] = featured
  }
  const finish = () => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geometry.setAttribute('aInitial', new THREE.BufferAttribute(initial, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(color, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    geometry.setAttribute('aFeature', new THREE.BufferAttribute(feature, 1))
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 420)
    return geometry
  }
  return { put, finish }
}

export function createCosmicGeometry(network, mobile) {
  const rand = generator(246830)
  const normal = () => Math.sqrt(-2 * Math.log(Math.max(0.00001, rand()))) * Math.cos(rand() * Math.PI * 2)
  const p = new THREE.Vector3()
  const tangent = new THREE.Vector3()
  const side = new THREE.Vector3()
  const up = new THREE.Vector3()
  const axis = new THREE.Vector3(0, 1, 0)
  const fillFilaments = (count, haze) => {
    const builder = cloudBuilder(count)
    for (let i = 0; i < count; i += 1) {
      const strand = network.curves[i % network.curves.length]
      const t = rand()
      strand.curve.getPoint(t, p)
      strand.curve.getTangent(t, tangent)
      side.crossVectors(tangent, axis).normalize(); up.crossVectors(side, tangent).normalize()
      const thickness = strand.width * (0.6 + 0.6 * Math.sin(t * Math.PI) + Math.sin(t * 19 + strand.index) * 0.15)
      p.addScaledVector(side, normal() * thickness * (haze ? 1.4 : 0.7)).addScaledVector(up, normal() * thickness * (haze ? 1.4 : 0.7))
      const insideVoid = !outsideVoids(p, -1)
      const tint = haze ? '#859dcc' : rand() < 0.72 ? '#c6dbf2' : rand() < 0.7 ? '#afaeda' : '#e6d3b9'
      builder.put(i, p, tint, insideVoid ? 0 : haze ? 0.38 : 0.35 + rand() * 0.55, haze ? 6 + rand() * 9 : 0.15 + Math.pow(rand(), 5) * 0.8, strand.featured ? 1 : 0)
    }
    return builder.finish()
  }
  const filament = fillFilaments(mobile ? 12000 : 38000, false)
  const haze = fillFilaments(mobile ? 1600 : 4600, true)
  const clusterCount = mobile ? 6500 : 20000
  const clusters = cloudBuilder(clusterCount)
  for (let i = 0; i < clusterCount; i += 1) {
    const index = i % network.nodes.length
    const strength = network.strengths[index]
    const spread = Math.abs(normal()) * strength * 1.55
    p.set(normal(), normal(), normal()).normalize().multiplyScalar(spread).add(network.nodes[index])
    clusters.put(i, p, rand() < 0.73 ? '#ecf3ff' : '#e2d5ca', 0.45 + rand() * 0.55, 0.18 + Math.pow(rand(), 4) * 0.95, index === 0 ? 1 : 0)
  }
  const glow = cloudBuilder(network.nodes.length)
  network.nodes.forEach((node, index) => glow.put(index, node, '#b3c8ed', 0.75, network.strengths[index] * 14, index === 0 ? 1 : 0))
  const field = fillFilaments(mobile ? 900 : 2600, true)
  const backgroundCount = mobile ? 400 : 1200
  const background = cloudBuilder(backgroundCount)
  for (let i = 0; i < backgroundCount; i += 1) {
    p.set(normal(), normal(), normal()).normalize().multiplyScalar(190 + rand() * 210)
    background.put(i, p, '#97aacb', 0.15 + rand() * 0.22, 0.15 + rand() * 0.28)
  }
  return { filament, haze, clusters: clusters.finish(), glow: glow.finish(), field, background: background.finish() }
}

export function createVoidOutline(radius) {
  const points = []
  for (let axis = 0; axis < 3; axis += 1) for (let step = 0; step < 128; step += 1) {
    // Dashed great circles describe volume without drawing an opaque sphere.
    if (step % 8 > 4) continue
    for (let end = 0; end < 2; end += 1) {
      const angle = (step + end) / 128 * Math.PI * 2
      const xyz = [Math.cos(angle) * radius, Math.sin(angle) * radius, 0]
      points.push(xyz[axis], xyz[(axis + 1) % 3], xyz[(axis + 2) % 3])
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  return geometry
}
