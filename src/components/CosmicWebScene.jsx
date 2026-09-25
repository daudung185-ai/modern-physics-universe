import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, useCursor } from '@react-three/drei'
import * as THREE from 'three'
import { COSMIC_CLUSTER, COSMIC_DARK_HINT, COSMIC_EXPANSION, COSMIC_FILAMENT, COSMIC_ORIGIN, COSMIC_SCALE, COSMIC_VOIDS, cosmicConcepts } from '../data/cosmicWeb.js'
import { createCosmicGeometry, createCosmicNetwork, createVoidOutline } from '../utils/cosmicWebGeometry.js'

const LAYERS = ['filament', 'clusters', 'haze', 'glow', 'field', 'background']
const vertexShader = `
  attribute vec3 aInitial;
  attribute float aSize;
  attribute float aPhase;
  attribute float aFeature;
  uniform float uFormation;
  uniform float uPointScale;
  uniform float uDiameter;
  uniform float uMaxSize;
  uniform float uTime;
  uniform float uHighlight;
  uniform float uFogEnd;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    vec3 p = mix(aInitial, position, uFormation);
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(aSize * uDiameter * uPointScale / max(1.0, -viewPosition.z), 0.8, uMaxSize);
    vColor = color * (1.0 + aFeature * uHighlight);
    vFade = (0.96 + 0.04 * sin(uTime * 0.3 + aPhase)) * (1.0 - smoothstep(650.0, uFogEnd, -viewPosition.z) * 0.72);
  }
`
const fragmentShader = `
  uniform float uOpacity;
  uniform float uSoft;
  uniform vec3 uTint;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    float radius = length(gl_PointCoord - 0.5) * 2.0;
    if (radius > 1.0) discard;
    float edge = 1.0 - smoothstep(0.65, 1.0, radius);
    float cloud = exp(-radius * radius * 5.8) * edge;
    float core = exp(-radius * radius * 38.0);
    float alpha = mix(cloud * 0.55 + core * 0.65, cloud * 0.2, uSoft);
    gl_FragColor = vec4(vColor * uTint, alpha * uOpacity * vFade);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const HOTSPOTS = [
  { id: 'filaments', position: COSMIC_FILAMENT, radius: 8, label: 'Sợi vật chất', sections: ['overview', 'filaments'] },
  { id: 'clusters', position: COSMIC_CLUSTER, radius: 7, label: 'Cụm thiên hà', sections: ['overview', 'clusters', 'observations'] },
  { id: 'voids', position: COSMIC_VOIDS[0].center, radius: 14, label: 'Một vùng thưa vật chất', sections: ['voids'] },
  { id: 'darkMatter', position: COSMIC_DARK_HINT, radius: 9, label: 'Khung hấp dẫn · minh họa', sections: ['darkMatter'] },
  { id: 'expansion', position: COSMIC_EXPANSION, radius: 9, label: 'Khoảng cách giữa hai vùng', sections: ['expansion'] },
]

export default function CosmicWebScene({ active, interactive, section, simulation, onSelect }) {
  const { size, camera, gl } = useThree()
  const mobile = size.width < 768
  const network = useMemo(createCosmicNetwork, [])
  const geometry = useMemo(() => createCosmicGeometry(network, mobile), [network, mobile])
  const voidGeometry = useMemo(() => createVoidOutline(COSMIC_VOIDS[0].radius), [])
  const expansionLine = useMemo(() => {
    const result = new THREE.BufferGeometry()
    result.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    return result
  }, [])
  const layerMaterials = useRef({})
  const voidMaterial = useRef()
  const expansionGroup = useRef()
  const expansionPoints = useRef([])
  const expansionMaterials = useRef([])
  const expansionLineMaterial = useRef()
  const opacity = useRef(0)
  const origin = useMemo(() => new THREE.Vector3(...COSMIC_ORIGIN), [])
  const [hovered, setHovered] = useState(null)
  useCursor(interactive && Boolean(hovered))
  const uniforms = useMemo(() => Object.fromEntries(LAYERS.map((key) => [key, {
    uTime: { value: 0 }, uFormation: { value: 1 }, uPointScale: { value: 1 },
    uDiameter: { value: (key === 'field' ? 2.2 : 1) * (mobile ? 1.55 : 1) },
    uFogEnd: { value: mobile ? 9500 : 4800 },
    uMaxSize: { value: ['haze', 'glow', 'field'].includes(key) ? (mobile ? 90 : 160) : 9 },
    uOpacity: { value: 0 }, uHighlight: { value: 0 },
    uSoft: { value: ['haze', 'glow', 'field'].includes(key) ? 1 : 0 },
    uTint: { value: new THREE.Color(key === 'field' ? '#b8a2e5' : '#ffffff') },
  }])), [mobile])

  useEffect(() => () => { Object.values(geometry).forEach((item) => item.dispose()) }, [geometry])
  useEffect(() => () => { voidGeometry.dispose(); expansionLine.dispose() }, [expansionLine, voidGeometry])
  useEffect(() => { if (!interactive) setHovered(null) }, [interactive])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const distance = camera.position.distanceTo(origin)
    // Galaxy scale and network scale overlap; no opaque transition curtain.
    const reveal = THREE.MathUtils.smoothstep(distance, 215, 740)
    opacity.current = THREE.MathUtils.damp(opacity.current, active ? (interactive ? 1 : reveal) : 0, 2.6, dt)
    const visible = opacity.current
    const formation = section === 'formation' ? simulation.current.formation : 1
    const pointScale = size.height * gl.getPixelRatio() * COSMIC_SCALE / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
    for (const key of LAYERS) {
      const material = layerMaterials.current[key]
      if (!material) continue
      let intensity = 1
      if (key === 'filament') intensity = section === 'clusters' ? 0.34 : section === 'filaments' ? 1.45 : 1
      if (key === 'clusters' || key === 'glow') intensity = section === 'filaments' ? 0.45 : section === 'clusters' ? 1.25 : 1
      if (key === 'haze') intensity = section === 'clusters' ? 0.22 : section === 'voids' ? 0.56 : 0.66
      if (key === 'glow') intensity *= THREE.MathUtils.smoothstep(formation, 0.35, 1) * 2.1
      if (key === 'field') intensity = section === 'darkMatter' ? (hovered === 'darkMatter' ? 0.85 : 0.58) : 0
      if (key === 'background') intensity = section === 'observations' ? 1 : 0.35
      material.uniforms.uOpacity.value = THREE.MathUtils.damp(material.uniforms.uOpacity.value, visible * intensity, 3.5, dt)
      material.uniforms.uFormation.value = THREE.MathUtils.damp(material.uniforms.uFormation.value, formation, 12, dt)
      material.uniforms.uTime.value = state.clock.elapsedTime
      material.uniforms.uPointScale.value = pointScale
      const highlight = (key === 'filament' && (hovered === 'filaments' || section === 'filaments')) || ((key === 'clusters' || key === 'glow') && (hovered === 'clusters' || section === 'clusters'))
      material.uniforms.uHighlight.value = THREE.MathUtils.damp(material.uniforms.uHighlight.value, highlight ? 0.65 : 0, 5, dt)
    }
    if (voidMaterial.current) voidMaterial.current.opacity = THREE.MathUtils.damp(voidMaterial.current.opacity, visible * (section === 'voids' ? (hovered === 'voids' ? 0.38 : 0.21) : 0), 4, dt)
    if (expansionGroup.current) expansionGroup.current.visible = section === 'expansion'
    if (section === 'expansion') {
      const halfDistance = 22 * (1 + simulation.current.expansion * 0.28)
      const positions = expansionLine.attributes.position
      positions.setXYZ(0, -halfDistance, 0, 0); positions.setXYZ(1, halfDistance, 0, 0)
      positions.needsUpdate = true
      for (let i = 0; i < 2; i += 1) {
        if (expansionPoints.current[i]) expansionPoints.current[i].position.x = halfDistance * (i ? 1 : -1)
        if (expansionMaterials.current[i]) expansionMaterials.current[i].opacity = visible * (hovered === 'expansion' ? 1 : 0.8)
      }
      if (expansionLineMaterial.current) expansionLineMaterial.current.opacity = visible * 0.6
    }
  })

  const select = (id) => { if (interactive) onSelect(cosmicConcepts[id]) }
  return <group position={COSMIC_ORIGIN} scale={COSMIC_SCALE} name="Mạng lưới vũ trụ">
    {LAYERS.map((key) => <points key={key} geometry={geometry[key]} renderOrder={key === 'filament' || key === 'clusters' ? 1 : 0}>
      <shaderMaterial ref={(value) => { layerMaterials.current[key] = value }} uniforms={uniforms[key]} vertexShader={vertexShader} fragmentShader={fragmentShader} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>)}
    <lineSegments geometry={voidGeometry} position={COSMIC_VOIDS[0].center}>
      <lineBasicMaterial ref={voidMaterial} color="#9eafcd" transparent opacity={0} depthWrite={false} />
    </lineSegments>
    <group ref={expansionGroup} position={COSMIC_EXPANSION} visible={false}>
      <line geometry={expansionLine} frustumCulled={false}><lineBasicMaterial ref={expansionLineMaterial} color="#aecfda" transparent opacity={0} depthWrite={false} /></line>
      {[0, 1].map((index) => <mesh key={index} ref={(value) => { expansionPoints.current[index] = value }}>
        <icosahedronGeometry args={[2.6, 1]} />
        <meshBasicMaterial ref={(value) => { expansionMaterials.current[index] = value }} color={index ? '#d0bfea' : '#b2e0e5'} wireframe transparent opacity={0} depthWrite={false} />
      </mesh>)}
    </group>
    {interactive && HOTSPOTS.filter((spot) => spot.sections.includes(section)).map((spot) => <group key={spot.id} position={spot.position}>
      <mesh
        onPointerOver={(event) => { event.stopPropagation(); setHovered(spot.id) }}
        onPointerOut={() => setHovered(null)}
        onClick={(event) => { event.stopPropagation(); if (event.delta <= 5) select(spot.id) }}
      >
        <sphereGeometry args={[spot.radius, 12, 8]} /><meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
      </mesh>
      <Html center position={[0, spot.radius + 2, 0]} zIndexRange={[2, 1]}>
        <button className={`cosmic-hotspot cosmic-hotspot--${spot.id}`} type="button" onPointerEnter={() => setHovered(spot.id)} onPointerLeave={() => setHovered(null)} onClick={() => select(spot.id)}><i aria-hidden="true" />{spot.label}<span aria-hidden="true">↗</span></button>
      </Html>
    </group>)}
  </group>
}
