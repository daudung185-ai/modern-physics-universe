import { useMemo, useRef, useState } from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Earth from './Earth'
import { getProceduralTexture, useOptionalPlanetTexture } from '../utils/planetTextures'
import PlanetTrail from './PlanetTrail'
import { getSafeSimulationDelta, getSolarSimulationTime, PLANET_ORBIT_SPEED_SCALE } from '../utils/solarMotion'
import Moon from './Moon'

function SaturnRings() {
  const ringTexture = useOptionalPlanetTexture('saturnRing')

  return (
    <group rotation-x={Math.PI / 2.35} rotation-z={0.18}>
      <mesh>
        <ringGeometry args={[1.48, 1.76, 64]} />
        <meshBasicMaterial map={ringTexture} color="#e8d9a7" transparent opacity={0.42} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation-z={0.01}>
        <ringGeometry args={[1.82, 2.22, 64]} />
        <meshBasicMaterial map={ringTexture} color="#b89f70" transparent opacity={0.26} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

export default function Planet({ planet, onSelect, showContext, trailsEnabled }) {
  const orbit = useRef()
  const body = useRef()
  const [hovered, setHovered] = useState(false)
  const scene = useThree((state) => state.scene)
  const fallbackTexture = useMemo(() => getProceduralTexture(planet.id), [planet.id])
  const texture = useOptionalPlanetTexture(planet.id) || fallbackTexture
  const orbitLine = useMemo(() => {
    const points = []
    for (let index = 0; index <= 96; index += 1) {
      const angle = (index / 96) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(angle) * planet.orbitRadius, Math.sin(angle) * planet.orbitRadius, 0))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [planet.orbitRadius])

  useFrame((_, delta) => {
    const simulationTime = getSolarSimulationTime()
    const safeDelta = getSafeSimulationDelta(delta)
    if (orbit.current) orbit.current.rotation.z = simulationTime * planet.orbitSpeed * PLANET_ORBIT_SPEED_SCALE
    if (body.current) {
      if (planet.id !== 'earth') body.current.rotation.y += safeDelta * planet.rotationSpeed * 0.45
      const scale = THREE.MathUtils.damp(body.current.scale.x, hovered ? 1.13 : 1, 9, safeDelta)
      body.current.scale.setScalar(scale)
    }
  })

  const handlePointerOver = (event) => {
    event.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }

  const handleClick = (event) => {
    event.stopPropagation()
    onSelect(planet)
  }

  return (
    <>
      {showContext && (
        <lineLoop geometry={orbitLine}>
          <lineBasicMaterial color="#7181a6" transparent opacity={0.022} />
        </lineLoop>
      )}
      <group ref={orbit}>
        <group position={[planet.orbitRadius, 0, 0]}>
          <group ref={body}>
            {planet.id === 'earth' ? (
              <Earth
                hovered={hovered}
                scale={planet.visualRadius / 1.35}
                onClick={handleClick}
                onPointerOut={handlePointerOut}
                onPointerOver={handlePointerOver}
              />
            ) : (
              <mesh onClick={handleClick} onPointerOut={handlePointerOut} onPointerOver={handlePointerOver}>
                <sphereGeometry args={[planet.visualRadius, 28, 28]} />
                <meshStandardMaterial map={texture} color="#ffffff" roughness={0.72} metalness={0.02} emissive={planet.color} emissiveIntensity={hovered ? 0.22 : 0.035} />
              </mesh>
            )}
            {planet.id === 'earth' && <Moon onSelect={onSelect} />}
            {planet.id === 'saturn' && <SaturnRings />}
          </group>
        </group>
      </group>
      {showContext && createPortal(
        <PlanetTrail sourceRef={body} color={planet.color} enabled={trailsEnabled} />,
        scene,
      )}
    </>
  )
}
