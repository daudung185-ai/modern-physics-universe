import test from 'node:test'
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { cosmicSections, cosmicConcepts, getCosmicCameraPose, COSMIC_ORIGIN } from '../src/data/cosmicWeb.js'
import { createCosmicNetwork, createCosmicGeometry, outsideVoids, createVoidOutline } from '../src/utils/cosmicWebGeometry.js'

const network = createCosmicNetwork()
test('all 64 nodes form one connected, non-planar, reproducible network', () => {
  assert.equal(network.nodes.length, 64)
  assert.ok(network.edges.length > 75 && network.edges.length < 150)
  const reached = new Set([0])
  for (let pass = 0; pass < network.nodes.length; pass += 1) for (const [a, b] of network.edges) {
    if (reached.has(a)) reached.add(b)
    if (reached.has(b)) reached.add(a)
  }
  assert.equal(reached.size, network.nodes.length)
  assert.ok(Math.max(...network.nodes.map((p) => p.y)) - Math.min(...network.nodes.map((p) => p.y)) > 120)
  assert.ok(network.nodes.every((p) => outsideVoids(p)))
  assert.deepEqual(createCosmicNetwork().edges, network.edges)
  assert.deepEqual(createCosmicNetwork().nodes, network.nodes)
})

test('splines connect actual nodes, have finite samples, and include branching', () => {
  const point = new THREE.Vector3()
  network.curves.forEach(({ curve }, index) => {
    const [a, b] = network.edges[index]
    assert.ok(curve.getPoint(0).distanceTo(network.nodes[a]) < 1e-6)
    assert.ok(curve.getPoint(1).distanceTo(network.nodes[b]) < 1e-6)
    for (let t = 0; t <= 1; t += 0.02) { curve.getPoint(t, point); assert.ok(point.toArray().every(Number.isFinite)) }
  })
  assert.ok(network.curves.some((strand) => strand.featured))
})

test('desktop/mobile clouds are bounded, finite and keep void interiors dark', () => {
  const counts = []
  const point = new THREE.Vector3()
  for (const mobile of [false, true]) {
    const geometry = createCosmicGeometry(network, mobile)
    let total = 0
    for (const cloud of Object.values(geometry)) {
      const { position } = cloud.attributes
      total += position.count
      for (const attribute of Object.values(cloud.attributes)) assert.ok(attribute.array.every(Number.isFinite))
      assert.equal(cloud.attributes.aInitial.count, position.count)
      for (let i = 0; i < position.count; i += 1) { point.fromBufferAttribute(position, i); assert.ok(point.length() < 421) }
    }
    const { position, color } = geometry.filament.attributes
    for (let i = 0; i < position.count; i += 1) {
      point.fromBufferAttribute(position, i)
      if (!outsideVoids(point, -1.01)) assert.equal(color.getX(i) + color.getY(i) + color.getZ(i), 0)
    }
    counts.push(total)
    Object.values(geometry).forEach((item) => item.dispose())
  }
  assert.ok(counts[0] < 70000)
  assert.ok(counts[1] < counts[0] * 0.4)
  console.log(`Cosmic point totals: desktop ${counts[0]}, mobile ${counts[1]}`)
})

test('eight camera presets remain finite and fit constrained orbit distances', () => {
  assert.equal(cosmicSections.length, 8)
  assert.equal(new Set(cosmicSections.map((item) => item.id)).size, 8)
  for (const aspect of [1365 / 860, 768 / 1024, 390 / 844, 320 / 740]) for (const { id } of cosmicSections) {
    const pose = getCosmicCameraPose(id, aspect)
    assert.ok([...pose.position, ...pose.target].every(Number.isFinite))
    const distance = new THREE.Vector3(...pose.position).distanceTo(new THREE.Vector3(...pose.target))
    assert.ok(distance >= 300 && distance <= (aspect < 0.7 ? 5400 : aspect < 1 ? 4200 : 2600), `${id}: ${distance}`)
    assert.ok(new THREE.Vector3(...pose.position).distanceTo(new THREE.Vector3(...COSMIC_ORIGIN)) < 6000)
  }
})

test('all five hotspot concepts have Vietnamese educational data', () => {
  assert.equal(Object.keys(cosmicConcepts).length, 5)
  for (const concept of Object.values(cosmicConcepts)) {
    assert.equal(concept.category, 'cosmicWeb')
    assert.ok(concept.name && concept.description && concept.notableFeatures && concept.disclaimer)
  }
  const outline = createVoidOutline(39)
  assert.ok(outline.attributes.position.array.every(Number.isFinite))
  assert.equal(outline.attributes.position.count % 2, 0)
  outline.dispose()
})
