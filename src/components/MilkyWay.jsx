import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function createSeededRandom(seed) {
  let value = seed
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

function createHazeTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 256
  const context = canvas.getContext('2d')
  const random = createSeededRandom(1409)
  context.globalCompositeOperation = 'lighter'

  for (let index = 0; index < 34; index += 1) {
    const x = random() * canvas.width
    const y = canvas.height * (0.32 + random() * 0.36)
    const radius = 45 + random() * 125
    const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
    const warmth = random() > 0.82
    gradient.addColorStop(0, warmth ? 'rgba(225,218,202,.12)' : 'rgba(188,201,224,.105)')
    gradient.addColorStop(0.42, 'rgba(132,145,174,.048)')
    gradient.addColorStop(1, 'rgba(40,45,58,0)')
    context.fillStyle = gradient
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

function createBandParticles(count) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const random = createSeededRandom(8201)
  const white = new THREE.Color('#f4f6ff')
  const cool = new THREE.Color('#cbd5eb')

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3
    const x = (random() - 0.5) * 390
    const centerY = Math.sin(x * 0.022) * 7
    const spread = (random() + random() + random() - 1.5) * 25
    const color = (random() > 0.88 ? cool : white).clone().multiplyScalar(0.3 + random() * 0.52)
    positions[offset] = x
    positions[offset + 1] = centerY + spread
    positions[offset + 2] = (random() - 0.5) * 65
    colors[offset] = color.r
    colors[offset + 1] = color.g
    colors[offset + 2] = color.b
    sizes[index] = 1 + Math.pow(random(), 2.6) * 5.8
  }
  return { positions, colors, sizes }
}

const vertexShader = `
  attribute float size;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(size * (235.0 / max(1.0, -viewPosition.z)), 0.9, 5.8);
    gl_Position = projectionMatrix * viewPosition;
  }
`

const fragmentShader = `
  uniform float uOpacity;
  varying vec3 vColor;
  void main() {
    float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
    float glow = 1.0 - smoothstep(0.08, 0.5, distanceFromCenter);
    gl_FragColor = vec4(vColor, glow * uOpacity);
  }
`

export default function MilkyWay({ active }) {
  const group = useRef()
  const pointsMaterial = useRef()
  const haze = useRef()
  const secondaryHaze = useRef()
  const { pointer, size } = useThree()
  const texture = useMemo(() => createHazeTexture(), [])
  const count = size.width < 768 ? 380 : 820
  const { positions, colors, sizes } = useMemo(() => createBandParticles(count), [count])
  const uniforms = useMemo(() => ({ uOpacity: { value: 0 } }), [])

  useFrame((_, delta) => {
    const targetOpacity = active ? 1 : 0
    if (pointsMaterial.current) {
      pointsMaterial.current.uniforms.uOpacity.value = THREE.MathUtils.damp(pointsMaterial.current.uniforms.uOpacity.value, targetOpacity, 2.2, delta)
    }
    if (haze.current) haze.current.opacity = THREE.MathUtils.damp(haze.current.opacity, active ? 0.22 : 0, 2.2, delta)
    if (secondaryHaze.current) secondaryHaze.current.opacity = THREE.MathUtils.damp(secondaryHaze.current.opacity, active ? 0.09 : 0, 2.2, delta)
    if (group.current) {
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, -0.04 + pointer.y * 0.012, 1.3, delta)
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, pointer.x * 0.018, 1.3, delta)
    }
  })

  return (
    <group ref={group} position={[12, -5, -255]} rotation={[0, 0, -0.31]}>
      <mesh position={[0, 0, -12]}>
        <planeGeometry args={[430, 92]} />
        <meshBasicMaterial ref={haze} map={texture} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[-18, 4, -28]} rotation-z={0.055} scale={[0.88, 1.35, 1]}>
        <planeGeometry args={[430, 92]} />
        <meshBasicMaterial ref={secondaryHaze} map={texture} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial ref={pointsMaterial} uniforms={uniforms} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} vertexShader={vertexShader} fragmentShader={fragmentShader} />
      </points>
    </group>
  )
}
