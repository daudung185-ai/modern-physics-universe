import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RELATIVITY_ORIGIN } from '../utils/sceneLayout'

const visualTargets = {
  overview: { lattice: 0.84, mass: 0.82, coordinates: 0, timeRail: 0 },
  spacetime: { lattice: 0.12, mass: 0.1, coordinates: 1, timeRail: 1 },
  curvature: { lattice: 1, mass: 1, coordinates: 0, timeRail: 0 },
  geodesic: { lattice: 0.42, mass: 0.78, coordinates: 0, timeRail: 0 },
  light: { lattice: 0.42, mass: 0.78, coordinates: 0, timeRail: 0 },
  time: { lattice: 0.42, mass: 0.62, coordinates: 0, timeRail: 0 },
  equivalence: { lattice: 0.1, mass: 0.2, coordinates: 0, timeRail: 0 },
  equation: { lattice: 0.1, mass: 0.2, coordinates: 0, timeRail: 0 },
  history: { lattice: 0.1, mass: 0.2, coordinates: 0, timeRail: 0 },
  modern: { lattice: 0.1, mass: 0.2, coordinates: 0, timeRail: 0 },
}

function range(count, extent) {
  if (count === 1) return [0]
  return Array.from({ length: count }, (_, index) => -extent + (index / (count - 1)) * extent)
}

function createVolumetricLattice(mobile) {
  const xExtent = 26
  const yExtent = 14
  const zExtent = 23
  const xLevels = range(mobile ? 7 : 11, xExtent)
  const yLevels = range(mobile ? 5 : 7, yExtent)
  const zLevels = range(mobile ? 7 : 10, zExtent)
  const resolution = mobile ? 18 : 27
  const base = []
  const colors = []
  const axisColors = [new THREE.Color('#a8b7ff'), new THREE.Color('#7186d9'), new THREE.Color('#d2d8ff')]

  const pushVertex = (x, y, z, color) => {
    base.push(x, y, z)
    colors.push(color.r, color.g, color.b)
  }

  const pushLine = (start, end, color) => {
    for (let segment = 0; segment < resolution; segment += 1) {
      const from = segment / resolution
      const to = (segment + 1) / resolution
      pushVertex(
        THREE.MathUtils.lerp(start[0], end[0], from),
        THREE.MathUtils.lerp(start[1], end[1], from),
        THREE.MathUtils.lerp(start[2], end[2], from),
        color,
      )
      pushVertex(
        THREE.MathUtils.lerp(start[0], end[0], to),
        THREE.MathUtils.lerp(start[1], end[1], to),
        THREE.MathUtils.lerp(start[2], end[2], to),
        color,
      )
    }
  }

  yLevels.forEach((y) => zLevels.forEach((z) => pushLine([-xExtent, y, z], [xExtent, y, z], axisColors[0])))
  xLevels.forEach((x) => zLevels.forEach((z) => pushLine([x, -yExtent, z], [x, yExtent, z], axisColors[1])))
  xLevels.forEach((x) => yLevels.forEach((y) => pushLine([x, y, -zExtent], [x, y, zExtent], axisColors[2])))

  const basePositions = new Float32Array(base)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(basePositions.slice(), 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.userData.basePositions = basePositions
  return geometry
}

function updateVolumetricLattice(geometry, mass) {
  const base = geometry.userData.basePositions
  const position = geometry.attributes.position
  const target = position.array

  for (let offset = 0; offset < base.length; offset += 3) {
    const x = base[offset]
    const y = base[offset + 1]
    const z = base[offset + 2]
    const radiusSquared = x * x + y * y * 1.15 + z * z
    const influence = mass * Math.exp(-radiusSquared / 235)
    const compression = 1 - Math.min(0.32, influence * 0.17)
    const twist = influence * 0.075
    const cosine = Math.cos(twist)
    const sine = Math.sin(twist)

    target[offset] = (x * cosine - z * sine) * compression + Math.sin(y * 0.23) * influence * 0.23
    target[offset + 1] = y * (1 - Math.min(0.24, influence * 0.14)) - influence * 1.18 + Math.sin((x + z) * 0.13) * influence * 0.17
    target[offset + 2] = (x * sine + z * cosine) * compression + Math.cos(y * 0.22) * influence * 0.21
  }

  position.needsUpdate = true
  geometry.computeBoundingSphere()
}

function createSegmentGeometry(pathCount, segments) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pathCount * segments * 2 * 3), 3))
  return geometry
}

function geodesicPoint(progress, mass, pathIndex, target) {
  const x = -22 + progress * 44
  const influence = mass * Math.exp(-(x * x) / 115)
  const side = pathIndex === 1 ? -1 : 1
  const baseY = pathIndex === 0 ? 6.8 : pathIndex === 1 ? -7.5 : 8.8
  const baseZ = pathIndex === 0 ? 6.4 : pathIndex === 1 ? -5.5 : -8.2
  target.set(
    x,
    baseY - side * influence * (pathIndex === 2 ? 1.3 : 1.75),
    baseZ + side * influence * 1.55 + (progress - 0.5) * side * 2.2,
  )
  return target
}

function updateGeodesics(geometry, mass, segments) {
  const position = geometry.attributes.position
  const array = position.array
  const from = new THREE.Vector3()
  const to = new THREE.Vector3()
  let offset = 0

  for (let pathIndex = 0; pathIndex < 3; pathIndex += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      geodesicPoint(segment / segments, mass, pathIndex, from)
      geodesicPoint((segment + 1) / segments, mass, pathIndex, to)
      array[offset] = from.x
      array[offset + 1] = from.y
      array[offset + 2] = from.z
      array[offset + 3] = to.x
      array[offset + 4] = to.y
      array[offset + 5] = to.z
      offset += 6
    }
  }
  position.needsUpdate = true
  geometry.computeBoundingSphere()
}

function lightPoint(progress, mass, pathIndex, passDistance, target) {
  const x = -24 + progress * 48
  const lane = pathIndex === 0 ? 0 : pathIndex === 1 ? 2.45 : -2.25
  const clearance = 5.4 + (passDistance - 1.4) * 1.8 + lane
  const sign = pathIndex === 2 ? -1 : 1
  const strength = mass * 2.5 / (passDistance + 0.8 + Math.abs(lane) * 0.18)
  const accumulatedBend = strength * (0.5 + 0.5 * Math.tanh((x - 3) / 6))
  const nearBend = mass * 0.55 / (passDistance + 0.6) * Math.exp(-(x * x) / 70)
  target.set(x, clearance - sign * (accumulatedBend + nearBend), pathIndex === 0 ? 0 : pathIndex === 1 ? -3.8 : 4.1)
  return target
}

function updateLightPath(geometry, guideGeometry, mass, passDistance, segments) {
  const position = geometry.attributes.position
  const array = position.array
  const guides = guideGeometry.attributes.position.array
  const from = new THREE.Vector3()
  const to = new THREE.Vector3()
  let offset = 0

  for (let pathIndex = 0; pathIndex < 3; pathIndex += 1) {
    for (let segment = 0; segment < segments; segment += 1) {
      lightPoint(segment / segments, mass, pathIndex, passDistance, from)
      lightPoint((segment + 1) / segments, mass, pathIndex, passDistance, to)
      array[offset] = from.x
      array[offset + 1] = from.y
      array[offset + 2] = from.z
      array[offset + 3] = to.x
      array[offset + 4] = to.y
      array[offset + 5] = to.z
      offset += 6
    }
    const lane = pathIndex === 0 ? 0 : pathIndex === 1 ? 2.45 : -2.25
    const guideOffset = pathIndex * 6
    guides[guideOffset] = -24
    guides[guideOffset + 1] = 5.4 + (passDistance - 1.4) * 1.8 + lane
    guides[guideOffset + 2] = pathIndex === 0 ? 0 : pathIndex === 1 ? -3.8 : 4.1
    guides[guideOffset + 3] = 24
    guides[guideOffset + 4] = guides[guideOffset + 1]
    guides[guideOffset + 5] = guides[guideOffset + 2]
  }
  position.needsUpdate = true
  guideGeometry.attributes.position.needsUpdate = true
  geometry.computeBoundingSphere()
  guideGeometry.computeBoundingSphere()
}

function createCoordinateGeometry() {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -25, 0, 0, 25, 0, 0,
    0, -12, 0, 0, 12, 0,
    0, 0, -20, 0, 0, 20,
  ], 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute([
    0.92, 0.38, 0.52, 0.92, 0.38, 0.52,
    0.42, 0.86, 1, 0.42, 0.86, 1,
    0.68, 0.55, 1, 0.68, 0.55, 1,
  ], 3))
  return geometry
}

const sliceCenters = [-17, -8.5, 0, 8.5, 17]

function createTemporalSliceGeometry(mobile) {
  const extent = 5.4
  const levels = range(mobile ? 3 : 4, extent)
  const vertices = []
  const line = (a, b) => vertices.push(...a, ...b)
  levels.forEach((y) => levels.forEach((z) => line([-extent, y, z], [extent, y, z])))
  levels.forEach((x) => levels.forEach((z) => line([x, -extent, z], [x, extent, z])))
  levels.forEach((x) => levels.forEach((y) => line([x, y, -extent], [x, y, extent])))
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
}

function createTimeRailGeometry() {
  const vertices = [-18, -9.8, 0, 18, -9.8, 0]
  sliceCenters.forEach((x) => vertices.push(x, -9.3, 0, x, -10.3, 0))
  return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
}

function createAxisLabel(label, color) {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  context.font = '600 76px Arial'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.shadowColor = color
  context.shadowBlur = 18
  context.fillStyle = color
  context.fillText(label, 64, 65)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function createSoftGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 62)
  gradient.addColorStop(0, 'rgba(255,255,255,0.65)')
  gradient.addColorStop(0.28, 'rgba(255,255,255,0.28)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(canvas)
}

export default function RelativityScene({ active, mass, section, geodesicVisible, geodesicReplay, lightPassDistance = 1.4, multipleLightRays = true }) {
  const group = useRef()
  const latticeMaterial = useRef()
  const latticeGlowMaterial = useRef()
  const geodesicMaterial = useRef()
  const geodesicGlowMaterial = useRef()
  const geodesicMarkerMaterial = useRef()
  const lightPathMaterial = useRef()
  const lightGlowMaterial = useRef()
  const lightGuideMaterial = useRef()
  const photonMaterial = useRef()
  const coordinateMaterial = useRef()
  const axisLabelMaterials = useRef([])
  const timeRailMaterial = useRef()
  const timeMarkerMaterial = useRef()
  const timeLabelMaterials = useRef([])
  const sliceMaterials = useRef([])
  const sliceCoreMaterials = useRef([])
  const sliceCoreMeshes = useRef([])
  const geodesicMarkerGeometry = useRef()
  const photonGeometry = useRef()
  const timeMarkerGeometry = useRef()
  const coreMaterial = useRef()
  const haloMaterial = useRef()
  const softGlowMaterial = useRef()
  const orbitMaterial = useRef()
  const light = useRef()
  const massObject = useRef()
  const fade = useRef(0)
  const modeFade = useRef({ lattice: 1, mass: 1, geodesic: 0, light: 0, coordinates: 0, timeRail: 0 })
  const geodesicStart = useRef(null)
  const lastReplay = useRef(geodesicReplay)
  const previousSection = useRef(section)
  const geodesicTarget = useRef(new THREE.Vector3())
  const photonTarget = useRef(new THREE.Vector3())
  const warmColor = useMemo(() => new THREE.Color('#ffe4ad'), [])
  const coolColor = useMemo(() => new THREE.Color('#dce2ff'), [])
  const warmEmissive = useMemo(() => new THREE.Color('#a56f47'), [])
  const coolEmissive = useMemo(() => new THREE.Color('#6879d2'), [])
  const { size } = useThree()
  const mobile = size.width < 768
  const pathSegments = mobile ? 56 : 92
  const latticeGeometry = useMemo(() => createVolumetricLattice(mobile), [mobile])
  const geodesicGeometry = useMemo(() => createSegmentGeometry(3, pathSegments), [pathSegments])
  const lightPathGeometry = useMemo(() => createSegmentGeometry(3, pathSegments), [pathSegments])
  const lightGuideGeometry = useMemo(() => createSegmentGeometry(3, 1), [])
  const coordinateGeometry = useMemo(() => createCoordinateGeometry(), [])
  const temporalSliceGeometry = useMemo(() => createTemporalSliceGeometry(mobile), [mobile])
  const timeRailGeometry = useMemo(() => createTimeRailGeometry(), [])
  const geodesicMarkerPositions = useMemo(() => new Float32Array(9), [])
  const photonPosition = useMemo(() => new Float32Array(9), [])
  const timeMarkerPosition = useMemo(() => new Float32Array(3), [])
  const axisTextures = useMemo(() => [
    createAxisLabel('X', '#f9a6ba'),
    createAxisLabel('Y', '#9aeaff'),
    createAxisLabel('Z', '#c9b7ff'),
  ], [])
  const timeTextures = useMemo(() => sliceCenters.map((_, index) => createAxisLabel(`t${index}`, '#f2d9a7')), [])
  const softGlowTexture = useMemo(() => createSoftGlowTexture(), [])

  useEffect(() => {
    updateVolumetricLattice(latticeGeometry, mass)
    updateGeodesics(geodesicGeometry, mass, pathSegments)
    updateLightPath(lightPathGeometry, lightGuideGeometry, mass, lightPassDistance, pathSegments)
    const rayCount = multipleLightRays ? 3 : 1
    lightPathGeometry.setDrawRange(0, rayCount * pathSegments * 2)
    lightGuideGeometry.setDrawRange(0, rayCount * 2)
    if (photonGeometry.current) photonGeometry.current.setDrawRange(0, rayCount)
    const warmth = THREE.MathUtils.clamp((mass - 0.5) / 1.5, 0, 1)
    if (coreMaterial.current) {
      coreMaterial.current.color.copy(coolColor).lerp(warmColor, warmth)
      coreMaterial.current.emissive.copy(coolEmissive).lerp(warmEmissive, warmth)
    }
    if (softGlowMaterial.current) softGlowMaterial.current.color.copy(coolColor).lerp(warmColor, warmth)
  }, [coolColor, coolEmissive, geodesicGeometry, latticeGeometry, lightGuideGeometry, lightPassDistance, lightPathGeometry, mass, multipleLightRays, pathSegments, warmColor, warmEmissive])

  useEffect(() => () => axisTextures.forEach((texture) => texture.dispose()), [axisTextures])
  useEffect(() => () => timeTextures.forEach((texture) => texture.dispose()), [timeTextures])
  useEffect(() => () => softGlowTexture.dispose(), [softGlowTexture])

  useFrame((state, delta) => {
    fade.current = THREE.MathUtils.damp(fade.current, active ? 1 : 0, 1.45, delta)
    const visibility = fade.current
    const elapsed = state.clock.elapsedTime

    const targets = visualTargets[section] || visualTargets.overview
    modeFade.current.lattice = THREE.MathUtils.damp(modeFade.current.lattice, targets.lattice, 4.4, delta)
    modeFade.current.mass = THREE.MathUtils.damp(modeFade.current.mass, targets.mass, 4.4, delta)
    modeFade.current.coordinates = THREE.MathUtils.damp(modeFade.current.coordinates, targets.coordinates, 4.4, delta)
    modeFade.current.timeRail = THREE.MathUtils.damp(modeFade.current.timeRail, targets.timeRail, 4.4, delta)
    modeFade.current.geodesic = THREE.MathUtils.damp(modeFade.current.geodesic, section === 'geodesic' && geodesicVisible ? 1 : section === 'light' ? 0.12 : 0, 4.4, delta)
    modeFade.current.light = THREE.MathUtils.damp(modeFade.current.light, section === 'light' ? 1 : 0, 4.4, delta)

    if (latticeMaterial.current) latticeMaterial.current.opacity = visibility * modeFade.current.lattice * 0.29
    if (latticeGlowMaterial.current) latticeGlowMaterial.current.opacity = visibility * modeFade.current.lattice * 0.055
    if (geodesicMaterial.current) geodesicMaterial.current.opacity = visibility * modeFade.current.geodesic * 0.88
    if (geodesicGlowMaterial.current) geodesicGlowMaterial.current.opacity = visibility * modeFade.current.geodesic * 0.14
    if (geodesicMarkerMaterial.current) geodesicMarkerMaterial.current.opacity = visibility * modeFade.current.geodesic
    if (lightPathMaterial.current) lightPathMaterial.current.opacity = visibility * modeFade.current.light * 0.94
    if (lightGlowMaterial.current) lightGlowMaterial.current.opacity = visibility * modeFade.current.light * 0.18
    if (lightGuideMaterial.current) lightGuideMaterial.current.opacity = visibility * modeFade.current.light * 0.12
    if (photonMaterial.current) photonMaterial.current.opacity = visibility * modeFade.current.light
    if (coordinateMaterial.current) coordinateMaterial.current.opacity = visibility * modeFade.current.coordinates * 0.82
    axisLabelMaterials.current.forEach((material) => { if (material) material.opacity = visibility * modeFade.current.coordinates * 0.9 })
    if (timeRailMaterial.current) timeRailMaterial.current.opacity = visibility * modeFade.current.timeRail * 0.65
    timeLabelMaterials.current.forEach((material) => { if (material) material.opacity = visibility * modeFade.current.timeRail * 0.75 })
    const sliceProgress = (elapsed * 0.22) % sliceCenters.length
    if (timeMarkerMaterial.current) {
      const resetFade = Math.min(1, sliceProgress * 4, (sliceCenters.length - sliceProgress) * 4)
      timeMarkerMaterial.current.opacity = visibility * modeFade.current.timeRail * resetFade
    }
    sliceMaterials.current.forEach((material, index) => {
      if (!material) return
      const separation = Math.min(Math.abs(index - sliceProgress), sliceCenters.length - Math.abs(index - sliceProgress))
      material.opacity = visibility * modeFade.current.timeRail * (0.2 + 0.5 * Math.exp(-separation * separation * 1.45))
      if (sliceCoreMaterials.current[index]) sliceCoreMaterials.current[index].opacity = visibility * modeFade.current.timeRail * (0.14 + 0.55 * Math.exp(-separation * separation * 1.45))
      if (sliceCoreMeshes.current[index]) {
        sliceCoreMeshes.current[index].scale.setScalar(0.48 + index * 0.07 + 0.16 * Math.exp(-separation * separation * 1.45))
        sliceCoreMeshes.current[index].rotation.y = elapsed * 0.13 + index * 0.34
      }
    })

    if (geodesicStart.current === null || lastReplay.current !== geodesicReplay || (section === 'geodesic' && previousSection.current !== 'geodesic')) {
      geodesicStart.current = elapsed
      lastReplay.current = geodesicReplay
    }
    previousSection.current = section
    const geodesicElapsed = elapsed - geodesicStart.current

    if (geodesicMarkerGeometry.current) {
      const attribute = geodesicMarkerGeometry.current.attributes.position
      for (let index = 0; index < 3; index += 1) {
        const progress = (geodesicElapsed * (0.08 + index * 0.016) + index * 0.47) % 1
        geodesicPoint(progress, mass, index, geodesicTarget.current)
        const offset = index * 3
        attribute.array[offset] = geodesicTarget.current.x
        attribute.array[offset + 1] = geodesicTarget.current.y
        attribute.array[offset + 2] = geodesicTarget.current.z
      }
      attribute.needsUpdate = true
    }

    if (photonGeometry.current) {
      const attribute = photonGeometry.current.attributes.position
      for (let index = 0; index < 3; index += 1) {
        lightPoint((elapsed * (0.07 + index * 0.008) + index * 0.31) % 1, mass, index, lightPassDistance, photonTarget.current)
        const offset = index * 3
        attribute.array[offset] = photonTarget.current.x
        attribute.array[offset + 1] = photonTarget.current.y
        attribute.array[offset + 2] = photonTarget.current.z
      }
      attribute.needsUpdate = true
    }

    if (timeMarkerGeometry.current) {
      const attribute = timeMarkerGeometry.current.attributes.position
      attribute.array[0] = THREE.MathUtils.lerp(sliceCenters[0], sliceCenters[sliceCenters.length - 1], Math.min(1, sliceProgress / (sliceCenters.length - 1)))
      attribute.array[1] = -9.8
      attribute.array[2] = 0
      attribute.needsUpdate = true
    }

    if (coreMaterial.current) {
      coreMaterial.current.opacity = visibility * modeFade.current.mass
      coreMaterial.current.emissiveIntensity = 0.19 + mass * 0.13
    }
    if (haloMaterial.current) haloMaterial.current.opacity = visibility * modeFade.current.mass * (0.035 + mass * 0.012)
    if (softGlowMaterial.current) softGlowMaterial.current.opacity = visibility * modeFade.current.mass * 0.1
    if (orbitMaterial.current) orbitMaterial.current.opacity = visibility * modeFade.current.mass * 0.2
    if (light.current) light.current.intensity = visibility * modeFade.current.mass * (5 + mass * 3.5)
    if (massObject.current) {
      const scale = 0.87 + mass * 0.22
      massObject.current.scale.setScalar(scale)
      massObject.current.rotation.y = elapsed * 0.07
      massObject.current.rotation.x = Math.sin(elapsed * 0.16) * 0.035
    }
    if (group.current) group.current.scale.setScalar(1.68)
  })

  return (
    <group ref={group} position={RELATIVITY_ORIGIN} name="RelativityScene">
      <lineSegments geometry={latticeGeometry} renderOrder={-2}>
        <lineBasicMaterial ref={latticeGlowMaterial} color="#7487ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <lineSegments geometry={latticeGeometry} renderOrder={-1}>
        <lineBasicMaterial ref={latticeMaterial} vertexColors transparent opacity={0} depthWrite={false} />
      </lineSegments>

      <lineSegments geometry={coordinateGeometry} renderOrder={2}>
        <lineBasicMaterial ref={coordinateMaterial} vertexColors transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <sprite position={[25.7, 0, 0]} scale={[2.1, 2.1, 1]}>
        <spriteMaterial ref={(value) => { axisLabelMaterials.current[0] = value }} map={axisTextures[0]} transparent opacity={0} depthWrite={false} />
      </sprite>
      <sprite position={[0, 12.7, 0]} scale={[2.1, 2.1, 1]}>
        <spriteMaterial ref={(value) => { axisLabelMaterials.current[1] = value }} map={axisTextures[1]} transparent opacity={0} depthWrite={false} />
      </sprite>
      <sprite position={[0, 0, 20.7]} scale={[2.1, 2.1, 1]}>
        <spriteMaterial ref={(value) => { axisLabelMaterials.current[2] = value }} map={axisTextures[2]} transparent opacity={0} depthWrite={false} />
      </sprite>
      <lineSegments geometry={timeRailGeometry} renderOrder={2}>
        <lineBasicMaterial ref={timeRailMaterial} color="#f2c985" transparent opacity={0} depthWrite={false} />
      </lineSegments>
      {sliceCenters.map((x, index) => (
        <sprite key={`time-label-${x}`} position={[x, -11.5, 0]} scale={[1.7, 1.7, 1]}>
          <spriteMaterial ref={(value) => { timeLabelMaterials.current[index] = value }} map={timeTextures[index]} transparent opacity={0} depthWrite={false} />
        </sprite>
      ))}
      <points frustumCulled={false} renderOrder={3}>
        <bufferGeometry ref={timeMarkerGeometry}>
          <bufferAttribute attach="attributes-position" args={[timeMarkerPosition, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={timeMarkerMaterial} color="#ffe5ae" size={0.34} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      {sliceCenters.map((x, index) => (
        <group key={x} position={[x, 1.2, 0]} rotation={[0.07 * index, -0.15 + index * 0.075, 0]}>
          <lineSegments geometry={temporalSliceGeometry} scale={0.59} renderOrder={2}>
            <lineBasicMaterial
              ref={(value) => { sliceMaterials.current[index] = value }}
              color={index % 2 ? '#a0baff' : '#8ce1fa'}
              transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending}
            />
          </lineSegments>
          <mesh ref={(value) => { sliceCoreMeshes.current[index] = value }} renderOrder={3}>
            <icosahedronGeometry args={[1.15, mobile ? 1 : 2]} />
            <meshBasicMaterial
              ref={(value) => { sliceCoreMaterials.current[index] = value }}
              color={index % 2 ? '#d6c5ff' : '#b4eeff'}
              wireframe transparent opacity={0} depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      <lineSegments geometry={geodesicGeometry} renderOrder={1}>
        <lineBasicMaterial ref={geodesicGlowMaterial} color="#75b9ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <lineSegments geometry={geodesicGeometry} renderOrder={1}>
        <lineBasicMaterial ref={geodesicMaterial} color="#aeeaff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <points frustumCulled={false} renderOrder={2}>
        <bufferGeometry ref={geodesicMarkerGeometry}>
          <bufferAttribute attach="attributes-position" args={[geodesicMarkerPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={geodesicMarkerMaterial} color="#d6f7ff" size={0.28} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <lineSegments geometry={lightGuideGeometry} renderOrder={1}>
        <lineBasicMaterial ref={lightGuideMaterial} color="#ffffff" transparent opacity={0} depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={lightPathGeometry} renderOrder={2}>
        <lineBasicMaterial ref={lightGlowMaterial} color="#eeb270" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <lineSegments geometry={lightPathGeometry} renderOrder={2}>
        <lineBasicMaterial ref={lightPathMaterial} color="#fff0be" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </lineSegments>
      <points frustumCulled={false} renderOrder={3}>
        <bufferGeometry ref={photonGeometry}>
          <bufferAttribute attach="attributes-position" args={[photonPosition, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={photonMaterial} color="#fff8d7" size={0.36} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      <group ref={massObject}>
        <sprite scale={[8.4, 8.4, 1]}>
          <spriteMaterial ref={softGlowMaterial} map={softGlowTexture} color="#aebfff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        <mesh>
          <sphereGeometry args={[1.55, mobile ? 24 : 40, mobile ? 16 : 28]} />
          <meshStandardMaterial
            ref={coreMaterial}
            color="#dce2ff"
            emissive="#6771d9"
            emissiveIntensity={0.3}
            roughness={0.58}
            metalness={0.03}
            transparent
            opacity={0}
          />
        </mesh>
        <mesh scale={1.4}>
          <sphereGeometry args={[1.55, mobile ? 20 : 28, mobile ? 14 : 20]} />
          <meshBasicMaterial ref={haloMaterial} color="#6978ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.BackSide} />
        </mesh>
        <mesh rotation={[0.32, 0.1, 0]}>
          <torusGeometry args={[2.9, 0.012, 3, mobile ? 64 : 96]} />
          <meshBasicMaterial ref={orbitMaterial} color="#a5bcff" transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      <pointLight ref={light} position={[2, 5, 4]} color="#9eacff" intensity={0} distance={43} decay={1.8} />
    </group>
  )
}
