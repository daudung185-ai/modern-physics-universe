import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { moon } from '../data/planets'
import { getSolarSimulationTime } from '../utils/solarMotion'

const MOON_ORBIT_RADIUS = 1.35
const MOON_ORBIT_SPEED = 0.78

export default function Moon({ onSelect }) {
  const orbit = useRef()
  const [hovered, setHovered] = useState(false)
  const orbitGeometry = useMemo(() => {
    const points = []
    for (let index = 0; index <= 48; index += 1) {
      const angle = (index / 48) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(angle) * MOON_ORBIT_RADIUS, Math.sin(angle) * MOON_ORBIT_RADIUS, 0))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])

  useFrame(() => {
    if (orbit.current) orbit.current.rotation.z = getSolarSimulationTime() * MOON_ORBIT_SPEED
  })

  const handleOver = (event) => {
    event.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }

  const handleOut = () => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }

  return (
    <>
      <lineLoop geometry={orbitGeometry}>
        <lineBasicMaterial color="#aeb4c5" transparent opacity={0.065} />
      </lineLoop>
      <group ref={orbit}>
        <mesh
          position={[MOON_ORBIT_RADIUS, 0, 0]}
          scale={hovered ? 1.12 : 1}
          onClick={(event) => { event.stopPropagation(); onSelect(moon) }}
          onPointerOver={handleOver}
          onPointerOut={handleOut}
        >
          <sphereGeometry args={[0.145, 18, 18]} />
          <meshStandardMaterial color="#aaa9a3" roughness={0.94} emissive="#292a2d" emissiveIntensity={hovered ? 0.18 : 0.04} />
        </mesh>
      </group>
    </>
  )
}
