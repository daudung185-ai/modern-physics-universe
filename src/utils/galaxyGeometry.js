import * as THREE from 'three'
import { GALAXY_RADIUS, spiralAngle } from '../data/galaxy'

function randomGenerator(seed) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function makeCloud(count, fill, seed) {
  const random = randomGenerator(seed)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const color = new THREE.Color()
  const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(0.0001, random()))) * Math.cos(random() * Math.PI * 2)
  for (let i = 0; i < count; i += 1) {
    fill(i, positions, colors, sizes, random, gaussian, color)
    phases[i] = random() * Math.PI * 2
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  geometry.computeBoundingSphere()
  return geometry
}

const STAR_COLORS = ['#d5e9ff', '#f2f2e6', '#93bafa', '#ffdc9c', '#dfa679']

export function createGalaxyGeometry(mobile) {
  const arms = makeCloud(mobile ? 8200 : 25500, (i, p, c, s, rand, normal, color) => {
    const arm = i % 4
    const radius = 6 + Math.pow(rand(), 0.7) * (GALAXY_RADIUS - 6)
    const t = radius / GALAXY_RADIUS
    const isDiffuse = rand() < 0.18
    const clump = 0.52 + 0.48 * Math.sin(radius * 0.59 + arm * 2.7)
    const angle = spiralAngle(radius, arm) + normal() * (isDiffuse ? 0.55 : 0.032 + t * 0.047 + clump * 0.03)
    const spread = normal() * (0.35 + t * 1.2)
    p[i * 3] = Math.cos(angle) * (radius + spread)
    p[i * 3 + 1] = normal() * (0.32 + (1 - t) * 0.85) + Math.sin(angle * 2) * t * t * 1.3
    p[i * 3 + 2] = Math.sin(angle) * (radius + spread)
    const roll = rand()
    color.set(STAR_COLORS[roll < 0.34 ? 0 : roll < 0.7 ? 1 : roll < 0.9 ? 2 : roll < 0.97 ? 3 : 4])
    color.multiplyScalar((0.3 + Math.pow(rand(), 0.7) * 0.7) * (isDiffuse ? 0.6 : 1))
    color.toArray(c, i * 3)
    s[i] = 0.12 + Math.pow(rand(), 5) * 0.52
  }, 48219)
  const core = makeCloud(mobile ? 2400 : 7800, (i, p, c, s, rand, normal, color) => {
    const r = Math.min(17, Math.abs(normal()) * 5.3)
    const angle = rand() * Math.PI * 2
    p[i * 3] = Math.cos(angle) * r * 1.35
    p[i * 3 + 1] = normal() * (0.48 + 2.6 * Math.exp(-r / 4))
    p[i * 3 + 2] = Math.sin(angle) * r * 0.72
    color.set(rand() < 0.7 ? '#ffe1a4' : '#fff4dc').multiplyScalar(0.45 + rand() * 0.5)
    color.toArray(c, i * 3)
    s[i] = 0.11 + Math.pow(rand(), 4) * 0.36
  }, 7383)
  const halo = makeCloud(mobile ? 430 : 1700, (i, p, c, s, rand, normal, color) => {
    const r = 12 + Math.pow(rand(), 0.5) * 70
    const angle = rand() * Math.PI * 2
    const elevation = (rand() - 0.5) * Math.PI
    p[i * 3] = Math.cos(angle) * Math.cos(elevation) * r
    p[i * 3 + 1] = Math.sin(elevation) * r * 0.36
    p[i * 3 + 2] = Math.sin(angle) * Math.cos(elevation) * r
    color.set(rand() < 0.7 ? '#c9d6e9' : '#edd4ab').multiplyScalar(0.3 + rand() * 0.32)
    color.toArray(c, i * 3)
    s[i] = 0.12 + rand() * 0.26
  }, 21820)
  const gas = makeCloud(mobile ? 300 : 1050, (i, p, c, s, rand, normal, color) => {
    const r = 6 + rand() * 59
    const angle = spiralAngle(r, i % 4) + normal() * 0.055
    p[i * 3] = Math.cos(angle) * r
    p[i * 3 + 1] = normal() * 0.8
    p[i * 3 + 2] = Math.sin(angle) * r
    color.set(rand() < 0.74 ? '#6584b4' : '#9c6d8c').multiplyScalar(0.7)
    color.toArray(c, i * 3)
    s[i] = 2.8 + rand() * 5.4
  }, 94942)
  const distant = makeCloud(mobile ? 28 : 75, (i, p, c, s, rand, normal, color) => {
    const angle = rand() * Math.PI * 2
    const r = 130 + rand() * 230
    p[i * 3] = Math.cos(angle) * r
    p[i * 3 + 1] = normal() * 115
    p[i * 3 + 2] = Math.sin(angle) * r
    color.set(rand() < 0.5 ? '#bacdf1' : '#eedac7')
    color.toArray(c, i * 3)
    s[i] = 0.8 + rand() * 2.2
  }, 9471)
  return { arms, core, halo, gas, distant }
}

export function createDustLanes(mobile) {
  const segments = mobile ? 130 : 220
  const positions = []
  const uvs = []
  const indices = []
  for (let arm = 0; arm < 4; arm += 1) {
    for (let j = 0; j <= segments; j += 1) {
      const t = j / segments
      const r = 7 + t * 60
      const angle = spiralAngle(r, arm) - 0.054
      const width = (0.4 + t * 1.0) * (0.85 + Math.sin(r * 0.63 + arm) * 0.15)
      for (let edge = 0; edge < 2; edge += 1) {
        const rr = r + (edge ? width : -width)
        positions.push(Math.cos(angle) * rr, 0.55 + Math.sin(angle * 2) * t * t * 1.3, Math.sin(angle) * rr)
        uvs.push(t, edge)
      }
      if (j < segments) {
        const a = arm * (segments + 1) * 2 + j * 2
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}

export function createOrbitGeometry(radius) {
  const points = []
  for (let i = 0; i <= 160; i += 1) points.push(new THREE.Vector3(Math.cos(i / 160 * Math.PI * 2) * radius, 0.7, Math.sin(i / 160 * Math.PI * 2) * radius))
  return new THREE.BufferGeometry().setFromPoints(points)
}
