import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

function createStarCorridor(count, minRadius, maxRadius, zMin, zMax, sizeScale) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const white = new THREE.Color('#ffffff')
  const coolWhite = new THREE.Color('#e7f0ff')

  for (let index = 0; index < count; index += 1) {
    const radius = minRadius + Math.pow(Math.random(), 0.72) * (maxRadius - minRadius)
    const angle = Math.random() * Math.PI * 2
    const offset = index * 3
    const color = (Math.random() < 0.9 ? white : coolWhite).clone()
    const brightness = 0.38 + Math.random() * 0.62

    positions[offset] = Math.cos(angle) * radius
    positions[offset + 1] = Math.sin(angle) * radius
    positions[offset + 2] = zMin + Math.random() * (zMax - zMin)
    color.multiplyScalar(brightness)
    colors[offset] = color.r
    colors[offset + 1] = color.g
    colors[offset + 2] = color.b
    sizes[index] = (1.15 + Math.pow(Math.random(), 3) * 3.6) * sizeScale
  }

  return { positions, colors, sizes }
}

const vertexShader = `
  attribute float size;
  varying vec3 vColor;
  void main() {
    vColor = color;
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(size * (190.0 / max(1.0, -modelViewPosition.z)), 1.15, 5.2);
    gl_Position = projectionMatrix * modelViewPosition;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  void main() {
    float radialDistance = length(gl_PointCoord - vec2(0.5));
    float core = 1.0 - smoothstep(0.03, 0.18, radialDistance);
    float halo = 1.0 - smoothstep(0.1, 0.5, radialDistance);
    gl_FragColor = vec4(vColor * (0.82 + core * 0.46), halo * 0.78);
  }
`

function StarLayer({ count, minRadius, maxRadius, zMin, zMax, sizeScale }) {
  const { positions, colors, sizes } = useMemo(
    () => createStarCorridor(count, minRadius, maxRadius, zMin, zMax, sizeScale),
    [count, maxRadius, minRadius, sizeScale, zMax, zMin],
  )

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </points>
  )
}

export default function Stars() {
  const { size } = useThree()
  const mobile = size.width < 768

  return (
    <group>
      <StarLayer count={mobile ? 480 : 950} minRadius={85} maxRadius={160} zMin={-1200} zMax={320} sizeScale={1.15} />
      <StarLayer count={mobile ? 900 : 1650} minRadius={160} maxRadius={300} zMin={-1400} zMax={420} sizeScale={0.7} />
    </group>
  )
}
