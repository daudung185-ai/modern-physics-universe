import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { blackHoleConcepts } from '../data/concepts'
import { getSafeSimulationDelta } from '../utils/solarMotion'
import { BLACK_HOLE_ORIGIN } from '../utils/sceneLayout'

const conceptById = Object.fromEntries(blackHoleConcepts.map((concept) => [concept.id, concept]))

const diskLayers = [
  { id: 'outer', inner: 5.15, outer: 14.5, opacity: 0.22, amplitude: 0.2, speed: 0.026, layer: 0.15, y: -0.08, tilt: -0.018 },
  { id: 'body', inner: 4.82, outer: 12.9, opacity: 0.62, amplitude: 0.12, speed: 0.052, layer: 0.42, y: 0.03, tilt: 0.012 },
  { id: 'flow', inner: 4.68, outer: 10.7, opacity: 0.42, amplitude: 0.075, speed: 0.084, layer: 0.71, y: 0.09, tilt: -0.009 },
  { id: 'inner', inner: 4.56, outer: 6.65, opacity: 0.82, amplitude: 0.04, speed: 0.125, layer: 0.93, y: 0.01, tilt: 0.006 },
]

function createSoftFlowTexture() {
  const width = 128
  const height = 64
  const data = new Uint8Array(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / width
      const v = y / height
      const broad = Math.sin(u * Math.PI * 6 + Math.sin(v * Math.PI * 4) * 1.5)
      const medium = Math.sin(u * Math.PI * 14 - v * Math.PI * 5 + Math.sin(u * Math.PI * 2))
      const fine = Math.sin(u * Math.PI * 30 + v * Math.PI * 9)
      const softNoise = THREE.MathUtils.clamp(0.54 + broad * 0.22 + medium * 0.15 + fine * 0.09, 0, 1)
      const offset = (y * width + x) * 4
      const value = Math.round(softNoise * 255)
      data[offset] = value
      data[offset + 1] = value
      data[offset + 2] = value
      data[offset + 3] = value
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

const diskVertexShader = `
  uniform float uTime;
  uniform float uInner;
  uniform float uOuter;
  uniform float uAmplitude;
  uniform float uSpeed;
  uniform float uLayer;
  varying float vRadial;
  varying float vAngle;
  varying float vWave;

  void main() {
    vec3 transformed = position;
    float radius = length(position.xy);
    float angle = atan(position.y, position.x);
    float radial = clamp((radius - uInner) / max(0.001, uOuter - uInner), 0.0, 1.0);
    float broadWave = sin(angle * (4.0 + uLayer * 2.0) - uTime * uSpeed * 9.0 + radial * 16.0);
    float fineWave = sin(angle * 13.0 + radial * 37.0 + uTime * uSpeed * 5.0);
    float displacement = (broadWave * 0.68 + fineWave * 0.32) * uAmplitude;
    transformed.z += displacement * sin(radial * 3.14159265);
    vRadial = radial;
    vAngle = angle;
    vWave = displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`

const diskFragmentShader = `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSpeed;
  uniform float uLayer;
  uniform sampler2D uFlowMap;
  varying float vRadial;
  varying float vAngle;
  varying float vWave;

  void main() {
    float angleUv = fract(vAngle / 6.2831853 + 0.5);
    vec2 flowUvA = vec2(fract(angleUv - uTime * uSpeed), fract(vRadial * 0.82 + uLayer * 0.31));
    vec2 flowUvB = vec2(fract(angleUv * 1.85 + uTime * uSpeed * 0.37), fract(vRadial * 1.9 - uTime * 0.012));
    float noiseA = texture2D(uFlowMap, flowUvA).r;
    float noiseB = texture2D(uFlowMap, flowUvB).r;
    float flowNoise = mix(noiseA, noiseB, 0.34);

    float innerFade = smoothstep(0.0, 0.055, vRadial);
    float outerFade = 1.0 - smoothstep(0.64, 1.0, vRadial);
    float stream = 0.5 + 0.5 * sin(vAngle * (17.0 + uLayer * 5.0) - uTime * uSpeed * 25.0 + vRadial * 42.0 + flowNoise * 5.0);
    stream = 0.3 + pow(stream, 2.6) * 0.78;
    float softBands = 0.68 + 0.2 * sin(vRadial * (75.0 + uLayer * 18.0) - uTime * uSpeed * 6.0 + noiseB * 4.0);
    float plasma = clamp((0.48 + flowNoise * 0.72) * stream * softBands, 0.0, 1.45);

    vec3 whiteHot = vec3(1.0, 0.94, 0.76);
    vec3 amber = vec3(1.0, 0.43, 0.075);
    vec3 ember = vec3(0.38, 0.035, 0.006);
    vec3 color = vRadial < 0.28
      ? mix(whiteHot, amber, smoothstep(0.0, 0.28, vRadial))
      : mix(amber, ember, smoothstep(0.28, 1.0, vRadial));
    float hotEdge = pow(1.0 - vRadial, 4.0);
    color *= 0.68 + plasma * 0.88 + hotEdge * 0.82 + abs(vWave) * 0.35;

    float alpha = innerFade * outerFade * plasma * uOpacity;
    if (alpha < 0.008) discard;
    gl_FragColor = vec4(color, alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

const rimVertexShader = `
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDirection = normalize(-viewPosition.xyz);
    gl_Position = projectionMatrix * viewPosition;
  }
`

const rimFragmentShader = `
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vViewDirection;
  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vViewDirection), 0.0), 4.4);
    vec3 color = mix(vec3(0.18, 0.14, 0.18), vec3(1.0, 0.43, 0.09), fresnel);
    gl_FragColor = vec4(color, fresnel * uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

function sectionEmphasis(section, part) {
  if (section === 'horizon') return part === 'horizon' ? 1.2 : 0.45
  if (section === 'disk') return part === 'disk' ? 1.2 : 0.58
  if (section === 'time') return part === 'time' ? 1.28 : 0.62
  return 1
}

export default function BlackHole({ active, section = 'overview', onSelect }) {
  const group = useRef()
  const diskMaterials = useRef([])
  const eventHorizon = useRef()
  const eventMaterial = useRef()
  const rimMaterial = useRef()
  const lensMaterial = useRef()
  const glowMaterial = useRef()
  const timeHotspot = useRef()
  const timeHotspotMaterial = useRef()
  const timeHotspotCoreMaterial = useRef()
  const hoveredPart = useRef(null)
  const fade = useRef(0)
  const { size } = useThree()
  const mobile = size.width < 768
  const flowTexture = useMemo(createSoftFlowTexture, [])
  const diskUniforms = useMemo(() => diskLayers.map((layer) => ({
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uInner: { value: layer.inner },
    uOuter: { value: layer.outer },
    uAmplitude: { value: layer.amplitude },
    uSpeed: { value: layer.speed },
    uLayer: { value: layer.layer },
    uFlowMap: { value: flowTexture },
  })), [flowTexture])
  const rimUniforms = useMemo(() => ({ uOpacity: { value: 0 } }), [])

  useEffect(() => () => {
    flowTexture.dispose()
    if (typeof document !== 'undefined') document.body.style.cursor = 'auto'
  }, [flowTexture])

  useEffect(() => {
    if (!active && typeof document !== 'undefined') {
      hoveredPart.current = null
      document.body.style.cursor = 'auto'
    }
  }, [active])

  const setHover = useCallback((part, event) => {
    if (!active) return
    event.stopPropagation()
    hoveredPart.current = part
    document.body.style.cursor = part ? 'pointer' : 'auto'
  }, [active])

  const clearHover = useCallback((event) => {
    event.stopPropagation()
    hoveredPart.current = null
    document.body.style.cursor = 'auto'
  }, [])

  const selectConcept = useCallback((id, event) => {
    if (!active || !onSelect) return
    event.stopPropagation()
    onSelect(conceptById[id])
  }, [active, onSelect])

  useFrame((state, delta) => {
    const safeDelta = typeof document !== 'undefined' && document.hidden ? 0 : getSafeSimulationDelta(delta)
    fade.current = THREE.MathUtils.damp(fade.current, active ? 1 : 0, 1.45, delta)
    const elapsed = state.clock.elapsedTime
    const diskFocus = sectionEmphasis(section, 'disk') * (hoveredPart.current === 'accretion-disk' ? 1.16 : 1)
    const horizonFocus = sectionEmphasis(section, 'horizon') * (hoveredPart.current === 'event-horizon' ? 1.16 : 1)
    const timeFocus = sectionEmphasis(section, 'time') * (hoveredPart.current === 'time-dilation' ? 1.22 : 1)

    diskMaterials.current.forEach((material, index) => {
      if (!material) return
      material.uniforms.uTime.value = elapsed
      material.uniforms.uOpacity.value = THREE.MathUtils.damp(
        material.uniforms.uOpacity.value,
        fade.current * diskLayers[index].opacity * diskFocus,
        3.8,
        delta,
      )
    })

    if (eventMaterial.current) eventMaterial.current.opacity = Math.min(0.995, fade.current * 1.08)
    if (rimMaterial.current) {
      rimMaterial.current.uniforms.uOpacity.value = THREE.MathUtils.damp(
        rimMaterial.current.uniforms.uOpacity.value,
        fade.current * 0.56 * horizonFocus,
        4,
        delta,
      )
    }
    if (lensMaterial.current) {
      const lensFocus = hoveredPart.current === 'photon-ring' ? 1.55 : 1
      lensMaterial.current.opacity = THREE.MathUtils.damp(lensMaterial.current.opacity, fade.current * 0.38 * lensFocus, 4.2, delta)
    }
    if (glowMaterial.current) glowMaterial.current.opacity = fade.current * 0.042 * diskFocus
    if (timeHotspotMaterial.current) timeHotspotMaterial.current.opacity = fade.current * 0.62 * timeFocus
    if (timeHotspotCoreMaterial.current) timeHotspotCoreMaterial.current.opacity = fade.current * 0.72 * timeFocus
    if (eventHorizon.current) {
      const targetScale = hoveredPart.current === 'event-horizon' ? 1.012 : 1
      const scale = THREE.MathUtils.damp(eventHorizon.current.scale.x, targetScale, 5.5, delta)
      eventHorizon.current.scale.setScalar(scale)
    }
    if (safeDelta > 0 && timeHotspot.current) timeHotspot.current.rotation.y += safeDelta * 0.16
    if (group.current) group.current.scale.setScalar(0.988 + fade.current * 0.012)
  })

  const diskEvents = {
    onPointerOver: (event) => setHover('accretion-disk', event),
    onPointerOut: clearHover,
    onClick: (event) => selectConcept('accretion-disk', event),
  }

  return (
    <group ref={group} position={BLACK_HOLE_ORIGIN} name="Cảnh hố đen">
      {diskLayers.map((layer, index) => (
        <mesh
          key={layer.id}
          position-y={layer.y}
          rotation={[(-Math.PI / 2) + layer.tilt, 0, index * 0.013]}
          renderOrder={1 + index}
          {...diskEvents}
        >
          <ringGeometry args={[layer.inner, layer.outer, mobile ? 96 : 160, mobile ? 7 : 12]} />
          <shaderMaterial
            ref={(material) => { diskMaterials.current[index] = material }}
            uniforms={diskUniforms[index]}
            vertexShader={diskVertexShader}
            fragmentShader={diskFragmentShader}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      <mesh
        ref={eventHorizon}
        renderOrder={7}
        onPointerOver={(event) => setHover('event-horizon', event)}
        onPointerOut={clearHover}
        onClick={(event) => selectConcept('event-horizon', event)}
      >
        <sphereGeometry args={[4.42, mobile ? 36 : 56, mobile ? 24 : 40]} />
        <meshBasicMaterial ref={eventMaterial} color="#000000" transparent opacity={0} depthWrite />
      </mesh>

      <mesh scale={1.022} renderOrder={8}>
        <sphereGeometry args={[4.42, mobile ? 30 : 48, mobile ? 22 : 36]} />
        <shaderMaterial
          ref={rimMaterial}
          uniforms={rimUniforms}
          vertexShader={rimVertexShader}
          fragmentShader={rimFragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh scale={1.62} renderOrder={0}>
        <sphereGeometry args={[4.42, mobile ? 20 : 30, mobile ? 16 : 24]} />
        <meshBasicMaterial
          ref={glowMaterial}
          color="#d85a19"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>

      <group
        rotation={[0.22, -0.5, 0.08]}
        onPointerOver={(event) => setHover('photon-ring', event)}
        onPointerOut={clearHover}
        onClick={(event) => selectConcept('photon-ring', event)}
      >
        <mesh renderOrder={9}>
          <torusGeometry args={[4.57, 0.068, 12, mobile ? 72 : 120]} />
          <meshBasicMaterial ref={lensMaterial} color="#ffe2a6" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh renderOrder={10}>
          <torusGeometry args={[4.57, 0.26, 8, mobile ? 48 : 80]} />
          <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
        </mesh>
      </group>

      <group
        ref={timeHotspot}
        rotation={[0.16, 0, -0.12]}
        onPointerOver={(event) => setHover('time-dilation', event)}
        onPointerOut={clearHover}
        onClick={(event) => selectConcept('time-dilation', event)}
      >
        <mesh position={[8.7, 1.15, 0]} renderOrder={10}>
          <torusGeometry args={[0.34, 0.045, 8, 36]} />
          <meshBasicMaterial ref={timeHotspotMaterial} color="#ffc779" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh position={[8.7, 1.15, 0]} renderOrder={10}>
          <sphereGeometry args={[0.13, 12, 10]} />
          <meshBasicMaterial ref={timeHotspotCoreMaterial} color="#fff2c7" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  )
}
