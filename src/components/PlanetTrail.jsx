import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getSolarSimulationTime, TRAIL_MAX_POINTS_DESKTOP, TRAIL_MAX_POINTS_MOBILE, TRAIL_SAMPLE_INTERVAL } from '../utils/solarMotion'

const vertexShader = `
  attribute float trailAlpha;
  varying float vTrailAlpha;
  void main() {
    vTrailAlpha = trailAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform vec3 trailColor;
  varying float vTrailAlpha;
  void main() {
    gl_FragColor = vec4(trailColor, vTrailAlpha);
  }
`

export default function PlanetTrail({ sourceRef, color, enabled }) {
  const { size } = useThree()
  const maxPoints = size.width < 768 ? TRAIL_MAX_POINTS_MOBILE : TRAIL_MAX_POINTS_DESKTOP
  const lastSample = useRef(-1)
  const initialized = useRef(false)
  const worldPosition = useRef(new THREE.Vector3())
  const geometry = useMemo(() => {
    const lineGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(maxPoints * 3)
    const alpha = new Float32Array(maxPoints)
    for (let index = 0; index < maxPoints; index += 1) {
      alpha[index] = Math.pow(index / (maxPoints - 1), 1.8) * 0.52
    }
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    lineGeometry.setAttribute('trailAlpha', new THREE.BufferAttribute(alpha, 1))
    lineGeometry.setDrawRange(0, 0)
    return lineGeometry
  }, [maxPoints])
  const uniforms = useMemo(() => ({ trailColor: { value: new THREE.Color(color) } }), [color])

  useEffect(() => {
    initialized.current = false
    lastSample.current = -1
    geometry.setDrawRange(0, 0)
  }, [enabled, geometry])

  useFrame((_, delta) => {
    const simulationTime = getSolarSimulationTime()
    if (!enabled || !sourceRef.current || document.hidden || delta > 0.25 || simulationTime - lastSample.current < TRAIL_SAMPLE_INTERVAL) return
    lastSample.current = simulationTime
    sourceRef.current.getWorldPosition(worldPosition.current)
    const attribute = geometry.attributes.position
    const points = attribute.array

    if (!initialized.current) {
      for (let index = 0; index < maxPoints; index += 1) {
        const offset = index * 3
        points[offset] = worldPosition.current.x
        points[offset + 1] = worldPosition.current.y
        points[offset + 2] = worldPosition.current.z
      }
      initialized.current = true
      geometry.setDrawRange(0, maxPoints)
    } else {
      points.copyWithin(0, 3)
      const offset = (maxPoints - 1) * 3
      points[offset] = worldPosition.current.x
      points[offset + 1] = worldPosition.current.y
      points[offset + 2] = worldPosition.current.z
    }

    attribute.needsUpdate = true
  })

  if (!enabled) return null

  return (
    <line geometry={geometry} frustumCulled={false} renderOrder={-1}>
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </line>
  )
}
