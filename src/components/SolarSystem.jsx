import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { planets, sun } from '../data/planets'
import { getProceduralTexture, useOptionalPlanetTexture } from '../utils/planetTextures'
import { advanceSolarSimulation, getSafeSimulationDelta, getSolarSystemPosition, ORBITAL_PLANE_ROTATION } from '../utils/solarMotion'
import Planet from './Planet'

export default function SolarSystem({ onPlanetSelect, showContext, trailsEnabled }) {
  const group = useRef()
  const sunSurface = useRef()
  const motionPosition = useMemo(() => new THREE.Vector3(), [])
  const [sunHovered, setSunHovered] = useState(false)
  const sunFallback = useMemo(() => getProceduralTexture('sun'), [])
  const sunTexture = useOptionalPlanetTexture('sun') || sunFallback

  useFrame((_, delta) => {
    const simulationTime = advanceSolarSimulation(delta)
    if (group.current) group.current.position.copy(getSolarSystemPosition(simulationTime, motionPosition))
    if (sunSurface.current) sunSurface.current.rotation.y += getSafeSimulationDelta(delta) * 0.06
  }, -1)

  const onSunOver = (event) => {
    event.stopPropagation()
    setSunHovered(true)
    document.body.style.cursor = 'pointer'
  }

  const onSunOut = () => {
    setSunHovered(false)
    document.body.style.cursor = 'auto'
  }

  return (
    <group ref={group} name="SolarSystemGroup">
      <pointLight intensity={240} distance={95} decay={1.65} color="#ffd49a" />
      {showContext && (
        <>
          <mesh ref={sunSurface} onClick={(event) => { event.stopPropagation(); onPlanetSelect(sun) }} onPointerOver={onSunOver} onPointerOut={onSunOut}>
            <sphereGeometry args={[sun.visualRadius, 36, 36]} />
            <meshBasicMaterial map={sunTexture} color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh scale={1.2}>
            <sphereGeometry args={[sun.visualRadius, 28, 28]} />
            <meshBasicMaterial color={sunHovered ? '#ffd07e' : '#ff9d4b'} transparent opacity={sunHovered ? 0.15 : 0.08} depthWrite={false} />
          </mesh>
        </>
      )}
      <group rotation={ORBITAL_PLANE_ROTATION} name="OrbitalPlane">
        {planets.filter((planet) => showContext || planet.id === 'earth').map((planet) => (
          <Planet key={planet.id} planet={planet} onSelect={onPlanetSelect} showContext={showContext} trailsEnabled={trailsEnabled} />
        ))}
      </group>
    </group>
  )
}
