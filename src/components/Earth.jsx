import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useOptionalPlanetTexture, getProceduralTexture } from '../utils/planetTextures'
import { getSafeSimulationDelta } from '../utils/solarMotion'

export default function Earth({ scale = 1, hovered = false, onClick, onPointerOver, onPointerOut }) {
  const surface = useRef()
  const clouds = useRef()
  const fallbackSurface = useMemo(() => getProceduralTexture('earth'), [])
  const fallbackClouds = useMemo(() => getProceduralTexture('earthClouds'), [])
  const surfaceTexture = useOptionalPlanetTexture('earth') || fallbackSurface
  const cloudTexture = useOptionalPlanetTexture('earthClouds') || fallbackClouds

  useFrame((_, delta) => {
    const safeDelta = getSafeSimulationDelta(delta)
    if (surface.current) surface.current.rotation.y += safeDelta * 0.11
    if (clouds.current) clouds.current.rotation.y += safeDelta * 0.14
  })

  return (
    <group scale={scale}>
      <mesh ref={surface} onClick={onClick} onPointerOver={onPointerOver} onPointerOut={onPointerOut}>
        <sphereGeometry args={[1.35, 48, 48]} />
        {/* Replace with real Earth texture: public/textures/planets/earth_day.jpg */}
        <meshStandardMaterial map={surfaceTexture} color="#ffffff" roughness={0.82} metalness={0.02} emissive="#07101d" emissiveIntensity={hovered ? 0.18 : 0.08} />
      </mesh>
      <mesh ref={clouds} scale={1.012}>
        <sphereGeometry args={[1.35, 40, 40]} />
        {/* Replace with real cloud texture: public/textures/planets/earth_clouds.png */}
        <meshBasicMaterial map={cloudTexture} transparent opacity={0.46} depthWrite={false} />
      </mesh>
      <mesh scale={1.045}>
        <sphereGeometry args={[1.35, 40, 40]} />
        <meshBasicMaterial color="#78aaff" transparent opacity={0.1} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}
