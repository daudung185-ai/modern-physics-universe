import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, useCursor } from '@react-three/drei'
import * as THREE from 'three'
import { ARM_ANCHOR, GALAXY_ORIGIN, HALO_ANCHOR, SOLAR_ANCHOR, galaxyConcepts } from '../data/galaxy'
import { createDustLanes, createGalaxyGeometry, createOrbitGeometry } from '../utils/galaxyGeometry'

const starVertex = `
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPointScale;
  uniform float uMaxSize;
  varying vec3 vColor;
  varying float vShimmer;
  void main() {
    vColor = color;
    vShimmer = 0.94 + 0.06 * sin(uTime * 0.45 + aPhase);
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * uPointScale / max(1.0, -viewPosition.z), 0.7, uMaxSize);
    gl_Position = projectionMatrix * viewPosition;
  }
`
const starFragment = `
  uniform float uOpacity;
  uniform float uCloud;
  varying vec3 vColor;
  varying float vShimmer;
  void main() {
    float radius = length(gl_PointCoord - 0.5) * 2.0;
    if (radius > 1.0) discard;
    float edge = 1.0 - smoothstep(0.5, 1.0, radius);
    float halo = exp(-radius * radius * 5.8) * edge;
    float core = exp(-radius * radius * 42.0);
    float alpha = mix(halo * 0.62 + core * 0.64, halo * 0.24, uCloud);
    gl_FragColor = vec4(vColor * (1.0 + core * (1.0 - uCloud) * 0.5), alpha * uOpacity * vShimmer);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`
const dustVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const dustFragment = `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float crossSection = sin(vUv.y * 3.14159265);
    float wisps = 0.66 + 0.17 * sin(vUv.x * 96.0 + sin(vUv.y * 17.0)) + 0.12 * sin(vUv.x * 217.0 + vUv.y * 9.0);
    float ends = smoothstep(0.0, 0.08, vUv.x) * (1.0 - smoothstep(0.8, 1.0, vUv.x));
    gl_FragColor = vec4(0.016, 0.012, 0.024, pow(crossSection, 1.7) * wisps * ends * uOpacity);
  }
`
const haloVertex = `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-p.xyz);
    gl_Position = projectionMatrix * p;
  }
`
const haloFragment = `
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.7);
    gl_FragColor = vec4(0.34, 0.4, 0.7, (0.025 + rim * 0.2) * uOpacity);
  }
`

function makeGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.12, 'rgba(255,249,231,0.75)')
  gradient.addColorStop(0.4, 'rgba(255,226,185,0.16)')
  gradient.addColorStop(1, 'rgba(255,214,176,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const HOTSPOTS = [
  { id: 'core', position: [0, 5, 0], radius: 7, label: 'Lõi thiên hà', sections: ['overview', 'structure', 'core'] },
  { id: 'arms', position: ARM_ANCHOR, radius: 4, label: 'Nhánh xoắn', sections: ['structure', 'arms'] },
  { id: 'solar', position: SOLAR_ANCHOR, radius: 2.2, label: 'Vị trí xấp xỉ của Hệ Mặt Trời', sections: ['overview', 'structure', 'solar'] },
  { id: 'darkMatter', position: HALO_ANCHOR, radius: 5, label: 'Quầng vật chất tối · minh họa', sections: ['darkMatter'] },
]
const ORBITS = [17, 35, 56]
const ROTATION_SPEEDS = [0.38, 0.23, 0.14]
const ORBIT_COLORS = ['#f2d4a1', '#a9cee9', '#adaee3']

export default function GalaxyScene({ active, interactive, section, onSelect }) {
  const { size, camera, gl } = useThree()
  const mobile = size.width < 768
  const geometry = useMemo(() => createGalaxyGeometry(mobile), [mobile])
  const dustGeometry = useMemo(() => createDustLanes(mobile), [mobile])
  const orbitGeometry = useMemo(() => ORBITS.map(createOrbitGeometry), [])
  const glowTexture = useMemo(makeGlowTexture, [])
  const materials = useRef({})
  const coreGlow = useRef()
  const bulgeGlow = useRef()
  const solarRing = useRef()
  const solarMaterial = useRef()
  const solarCore = useRef()
  const orbitMaterials = useRef([])
  const tracers = useRef([])
  const tracerMaterials = useRef([])
  const opacity = useRef(0)
  const origin = useMemo(() => new THREE.Vector3(...GALAXY_ORIGIN), [])
  const [hovered, setHovered] = useState(null)
  useCursor(Boolean(hovered) && interactive)
  const starUniforms = useMemo(() => Object.fromEntries(['core', 'arms', 'halo', 'gas', 'distant'].map((key) => [key, {
    uTime: { value: 0 }, uOpacity: { value: 0 }, uPointScale: { value: 1 },
    uMaxSize: { value: key === 'gas' ? (mobile ? 80 : 150) : 12 },
    uCloud: { value: key === 'gas' || key === 'distant' ? 1 : 0 },
  }])), [mobile])
  const dustUniforms = useMemo(() => ({ uOpacity: { value: 0 } }), [])
  const haloUniforms = useMemo(() => ({ uOpacity: { value: 0 } }), [])

  useEffect(() => () => {
    Object.values(geometry).forEach((item) => item.dispose())
    dustGeometry.dispose()
  }, [geometry, dustGeometry])
  useEffect(() => () => {
    glowTexture.dispose()
    orbitGeometry.forEach((item) => item.dispose())
  }, [glowTexture, orbitGeometry])
  useEffect(() => { if (!interactive) setHovered(null) }, [interactive])

  useFrame((state, delta) => {
    const proximity = 1 - THREE.MathUtils.smoothstep(camera.position.distanceTo(origin), 320, 720)
    opacity.current = THREE.MathUtils.damp(opacity.current, active ? proximity : 0, 1.8, Math.min(delta, 0.1))
    const visibility = opacity.current
    const elapsed = state.clock.elapsedTime
    const pointScale = size.height * gl.getPixelRatio() / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
    for (const key of ['core', 'arms', 'halo', 'gas', 'distant']) {
      const material = materials.current[key]
      if (!material) continue
      let emphasis = 1
      if (key === 'core') emphasis = section === 'arms' ? 0.62 : hovered === 'core' ? 1.18 : 1
      if (key === 'arms') emphasis = section === 'core' ? 0.5 : section === 'arms' || hovered === 'arms' ? 1.2 : 1
      if (key === 'halo') emphasis = section === 'structure' ? 1.4 : 0.5
      if (key === 'gas') emphasis = section === 'core' ? 0.48 : 1.1
      if (key === 'distant') emphasis = section === 'modern' ? 1.2 : 0.04
      material.uniforms.uTime.value = elapsed
      material.uniforms.uPointScale.value = pointScale
      material.uniforms.uOpacity.value = THREE.MathUtils.damp(material.uniforms.uOpacity.value, visibility * emphasis, 3.2, delta)
    }
    dustUniforms.uOpacity.value = visibility * (section === 'structure' || section === 'arms' ? 0.82 : 0.64)
    haloUniforms.uOpacity.value = THREE.MathUtils.damp(haloUniforms.uOpacity.value, visibility * (section === 'darkMatter' ? 0.8 : section === 'structure' ? 0.12 : 0), 2.3, delta)
    if (coreGlow.current) coreGlow.current.opacity = visibility * (hovered === 'core' ? 0.46 : 0.34)
    if (bulgeGlow.current) bulgeGlow.current.opacity = visibility * 0.14
    const markerVisible = visibility * (section === 'solar' ? 1 : section === 'overview' || section === 'structure' ? 0.7 : 0.12)
    if (solarMaterial.current) solarMaterial.current.opacity = markerVisible * (0.7 + Math.sin(elapsed * 1.7) * 0.18)
    if (solarCore.current) solarCore.current.opacity = markerVisible
    if (solarRing.current) {
      solarRing.current.quaternion.copy(camera.quaternion)
      solarRing.current.scale.setScalar(1 + Math.sin(elapsed * 1.7) * 0.09)
    }
    for (let i = 0; i < ORBITS.length; i += 1) {
      const showRotation = section === 'rotation' ? 1 : 0
      if (orbitMaterials.current[i]) orbitMaterials.current[i].opacity = THREE.MathUtils.damp(orbitMaterials.current[i].opacity, visibility * showRotation * 0.28, 3.4, delta)
      if (tracerMaterials.current[i]) tracerMaterials.current[i].opacity = visibility * showRotation
      if (tracers.current[i]) {
        const angle = elapsed * ROTATION_SPEEDS[i] + i * 1.7
        tracers.current[i].position.set(Math.cos(angle) * ORBITS[i], 1, Math.sin(angle) * ORBITS[i])
      }
    }
  })

  function select(id) {
    if (interactive) onSelect(galaxyConcepts[id])
  }

  return (
    <group position={GALAXY_ORIGIN} name="Thiên hà xoắn ốc">
      {['core', 'arms', 'halo', 'gas', 'distant'].map((key) => (
        <points key={key} geometry={geometry[key]} renderOrder={key === 'gas' ? 0 : 1}>
          <shaderMaterial
            ref={(material) => { materials.current[key] = material }}
            uniforms={starUniforms[key]} vertexShader={starVertex} fragmentShader={starFragment}
            vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending}
          />
        </points>
      ))}
      <sprite scale={[37, 27, 1]} renderOrder={1}>
        <spriteMaterial ref={coreGlow} map={glowTexture} color="#ffe0a1" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite scale={[71, 40, 1]} renderOrder={0}>
        <spriteMaterial ref={bulgeGlow} map={glowTexture} color="#ba9977" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh geometry={dustGeometry} renderOrder={2}>
        <shaderMaterial uniforms={dustUniforms} vertexShader={dustVertex} fragmentShader={dustFragment} transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh scale={[1, 0.75, 1]} renderOrder={0}>
        <sphereGeometry args={[83, mobile ? 24 : 40, mobile ? 16 : 24]} />
        <shaderMaterial uniforms={haloUniforms} vertexShader={haloVertex} fragmentShader={haloFragment} transparent depthWrite={false} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>
      {ORBITS.map((radius, index) => (
        <group key={radius}>
          <line geometry={orbitGeometry[index]}>
            <lineBasicMaterial ref={(v) => { orbitMaterials.current[index] = v }} color={ORBIT_COLORS[index]} transparent opacity={0} depthWrite={false} />
          </line>
          <mesh ref={(v) => { tracers.current[index] = v }}>
            <sphereGeometry args={[0.65, 12, 8]} />
            <meshBasicMaterial ref={(v) => { tracerMaterials.current[index] = v }} color={ORBIT_COLORS[index]} transparent opacity={0} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <group position={SOLAR_ANCHOR}>
        <mesh ref={solarRing}>
          <torusGeometry args={[1.35, 0.045, 6, 48]} />
          <meshBasicMaterial ref={solarMaterial} color="#bce6da" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.25, 12, 8]} />
          <meshBasicMaterial ref={solarCore} color="#e1fff1" transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      {interactive && HOTSPOTS.filter((spot) => spot.sections.includes(section)).map((spot) => (
        <group key={spot.id} position={spot.position}>
          <mesh
            onPointerOver={(event) => { event.stopPropagation(); setHovered(spot.id) }}
            onPointerOut={() => setHovered(null)}
            onClick={(event) => { event.stopPropagation(); if (event.delta <= 5) select(spot.id) }}
          >
            <sphereGeometry args={[spot.radius, 12, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
          </mesh>
          <Html position={[0, spot.id === 'solar' ? 2.8 : spot.radius + 1, 0]} center zIndexRange={[2, 1]}>
            <button
              type="button" className={`galaxy-hotspot${spot.id === 'solar' ? ' galaxy-hotspot--solar' : ''}`}
              onPointerEnter={() => setHovered(spot.id)} onPointerLeave={() => setHovered(null)}
              onClick={() => select(spot.id)}
            ><i aria-hidden="true" />{spot.label}<span aria-hidden="true">↗</span></button>
          </Html>
        </group>
      ))}
    </group>
  )
}
