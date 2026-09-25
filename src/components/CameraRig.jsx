import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'
import { GALAXY_ORIGIN, getGalaxyCameraPose } from '../data/galaxy'
import { COSMIC_ORIGIN, getCosmicCameraPose } from '../data/cosmicWeb.js'
import {
  CAMERA_FOLLOW_FACTOR,
  CAMERA_TARGET_FOLLOW_FACTOR,
  getEarthWorldPosition,
  getSolarSimulationTime,
  getSolarSystemPosition,
} from '../utils/solarMotion'
import {
  BLACK_HOLE_CAMERA_POSITION,
  BLACK_HOLE_CAMERA_TARGET,
  RELATIVITY_CAMERA_POSITION,
  RELATIVITY_CAMERA_TARGET,
} from '../utils/sceneLayout'

const cameraViews = {
  hero: { position: [0, 0, 8], target: [0, 0, 0], duration: 2.7 },
  earth: { position: [0, 0, 0], target: [0, 0.05, 0], duration: 3.2 },
  solarSystem: { position: [44, 26, 62], target: [0, 0, 0], duration: 4.8 },
  relativity: { position: RELATIVITY_CAMERA_POSITION, target: RELATIVITY_CAMERA_TARGET, duration: 4.4 },
  blackHole: { position: BLACK_HOLE_CAMERA_POSITION, target: BLACK_HOLE_CAMERA_TARGET, duration: 4.7 },
}

const ORIGIN_TARGET = [0, 0, 0]
const RELATIVITY_FOCUS_VIEWS = {
  overview: { offset: [38, 31, 57], targetOffset: [0, 0, 0] },
  spacetime: { offset: [34, 28, 62], targetOffset: [0, 0, 0] },
  curvature: { offset: [30, 24, 51], targetOffset: [0, 0, 0] },
  geodesic: { offset: [37, 27, 57], targetOffset: [0, 0, 0] },
  light: { offset: [31, 21, 60], targetOffset: [0, 4, 0] },
  time: { offset: [38, 26, 61], targetOffset: [0, 0, 0] },
  equivalence: { offset: [46, 32, 66], targetOffset: [0, 0, 0] },
  equation: { offset: [46, 32, 66], targetOffset: [0, 0, 0] },
  history: { offset: [46, 32, 66], targetOffset: [0, 0, 0] },
  modern: { offset: [46, 32, 66], targetOffset: [0, 0, 0] },
}

export default function CameraRig({ currentScene, targetScene, isTransitioning, cameraRequest, relativitySection, galaxySection, galaxyCameraRequest, cosmicSection, cosmicCameraRequest, onTransitionComplete }) {
  const pointer = useRef(new THREE.Vector2())
  const controls = useRef()
  const viewTarget = useRef(new THREE.Vector3(0, 0, 0))
  const followPosition = useRef(new THREE.Vector3())
  const previousFollowPosition = useRef(new THREE.Vector3())
  const followDelta = useRef(new THREE.Vector3())
  const cameraOffset = useRef(new THREE.Vector3())
  const desiredCameraPosition = useRef(new THREE.Vector3())
  const blackHoleCenter = useRef(new THREE.Vector3(...BLACK_HOLE_CAMERA_TARGET))
  const controlTargetOffset = useRef(new THREE.Vector3())
  const relativityFocusTween = useRef(null)
  const galaxyFocusTween = useRef(null)
  const cosmicFocusTween = useRef(null)
  const [cosmicFocusing, setCosmicFocusing] = useState(false)
  const previousCosmicView = useRef({ section: cosmicSection, request: cosmicCameraRequest, aspect: 0 })
  const [galaxyFocusing, setGalaxyFocusing] = useState(false)
  const previousGalaxyView = useRef({ section: galaxySection, request: galaxyCameraRequest, aspect: 0 })
  const previousRelativitySection = useRef(relativitySection)
  const relativityWasActive = useRef(false)
  const transitioningNow = useRef(isTransitioning)
  const hasFollowPosition = useRef(false)
  const { camera, pointer: mouse, size } = useThree()
  const galaxyAspect = size.width / Math.max(1, size.height)
  transitioningNow.current = isTransitioning

  useEffect(() => {
    camera.far = currentScene === 'cosmicWeb' || targetScene === 'cosmicWeb' ? 12000 : 1600
    camera.updateProjectionMatrix()
  }, [camera, currentScene, targetScene])

  useEffect(() => {
    if (!isTransitioning) return undefined

    relativityFocusTween.current?.kill()
    relativityFocusTween.current = null
    galaxyFocusTween.current?.kill()
    galaxyFocusTween.current = null
    setGalaxyFocusing(false)
    cosmicFocusTween.current?.kill()
    cosmicFocusTween.current = null
    setCosmicFocusing(false)

    if (targetScene === 'cosmicWeb') {
      const pose = getCosmicCameraPose('overview', camera.aspect)
      const start = camera.position.clone()
      const startFocus = viewTarget.current.clone()
      const focus = new THREE.Vector3(...pose.target)
      const destination = new THREE.Vector3(...pose.position)
      const offset = start.clone().sub(startFocus).normalize()
      const pullback = start.clone().addScaledVector(offset, currentScene === 'galaxy' ? 440 : 200)
      pullback.y += 50
      const reveal = focus.clone().lerp(destination, 0.73)
      reveal.y += 120
      const path = new THREE.CatmullRomCurve3([start, pullback, reveal, destination], false, 'centripetal')
      const progress = { value: 0 }
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1.2 : 6.8
      const intro = gsap.to(progress, {
        value: 1, duration, ease: 'sine.inOut',
        onUpdate: () => {
          path.getPoint(progress.value, camera.position)
          viewTarget.current.lerpVectors(startFocus, focus, THREE.MathUtils.smoothstep(progress.value, 0, 0.8))
          controls.current?.target.copy(viewTarget.current)
          camera.lookAt(viewTarget.current)
        },
        onComplete: () => onTransitionComplete('cosmicWeb'),
      })
      return () => intro.kill()
    }

    if (targetScene === 'galaxy') {
      const pose = getGalaxyCameraPose('overview', camera.aspect)
      const start = camera.position.clone()
      const startFocus = viewTarget.current.clone()
      const finalFocus = new THREE.Vector3(...pose.target)
      const finalPosition = new THREE.Vector3(...pose.position)
      const farPosition = finalPosition.clone().sub(finalFocus).multiplyScalar(1.55).add(finalFocus)
      const withdrawal = start.clone().add(camera.position.clone().sub(startFocus).normalize().multiplyScalar(34))
      withdrawal.y += 12
      const departure = { value: 0 }
      const passage = { value: 0 }
      const arrival = { value: 0 }
      const syncLook = () => {
        controls.current?.target.copy(viewTarget.current)
        camera.lookAt(viewTarget.current)
      }
      const intro = gsap.timeline({ onComplete: () => onTransitionComplete('galaxy') })
      intro.to(departure, { value: 1, duration: 1, ease: 'sine.inOut', onUpdate: () => {
        camera.position.lerpVectors(start, withdrawal, departure.value)
        viewTarget.current.copy(startFocus)
        syncLook()
      } })
      intro.to(passage, { value: 1, duration: 3.5, ease: 'power2.inOut', onUpdate: () => {
        camera.position.lerpVectors(withdrawal, farPosition, passage.value)
        camera.position.y += Math.sin(passage.value * Math.PI) * 40
        viewTarget.current.lerpVectors(startFocus, finalFocus, passage.value)
        syncLook()
      } })
      intro.to(arrival, { value: 1, duration: 1.7, ease: 'sine.inOut', onUpdate: () => {
        camera.position.lerpVectors(farPosition, finalPosition, arrival.value)
        viewTarget.current.copy(finalFocus)
        syncLook()
      } })
      return () => intro.kill()
    }

    const view = cameraViews[targetScene]
    const [targetX, targetY, targetZ] = view.target
    const simulationTime = getSolarSimulationTime()
    const focusAngle = 0.35 + Math.sin(simulationTime * 0.17) * 0.42
    const earthOffset = new THREE.Vector3(Math.sin(focusAngle) * 2.9, 1.05 + Math.cos(focusAngle) * 0.28, Math.cos(focusAngle) * 4.5)
    const startPosition = camera.position.clone()
    const startTarget = viewTarget.current.clone()
    const movingTarget = new THREE.Vector3()
    const destination = new THREE.Vector3()
    const progress = { value: 0 }
    const includesDeepScene = ['relativity', 'blackHole', 'galaxy', 'cosmicWeb'].includes(currentScene) || ['relativity', 'blackHole', 'galaxy', 'cosmicWeb'].includes(targetScene)
    hasFollowPosition.current = false

    const transition = gsap.to(progress, {
      value: 1,
      duration: includesDeepScene ? Math.max(view.duration, 4.25) : view.duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        if (targetScene === 'earth') {
          getEarthWorldPosition(getSolarSimulationTime(), movingTarget)
          destination.copy(movingTarget).add(earthOffset)
          movingTarget.y += targetY
        } else if (targetScene === 'solarSystem') {
          getSolarSystemPosition(getSolarSimulationTime(), movingTarget)
          destination.set(view.position[0] + movingTarget.x, view.position[1] + movingTarget.y, view.position[2] + movingTarget.z)
        } else {
          movingTarget.set(targetX, targetY, targetZ)
          destination.set(view.position[0], view.position[1], view.position[2])
        }
        camera.position.lerpVectors(startPosition, destination, progress.value)
        viewTarget.current.lerpVectors(startTarget, movingTarget, progress.value)
        if (controls.current) controls.current.target.copy(viewTarget.current)
      },
      onComplete: () => {
        if (controls.current) controls.current.target.copy(viewTarget.current)
        onTransitionComplete(targetScene)
      },
    })

    return () => transition.kill()
  }, [camera, cameraRequest, currentScene, isTransitioning, onTransitionComplete, targetScene])

  useEffect(() => {
    if (currentScene !== 'relativity' || isTransitioning || !controls.current) {
      relativityWasActive.current = false
      return undefined
    }

    const enteringSavedTab = !relativityWasActive.current && relativitySection !== 'overview'
    relativityWasActive.current = true
    if (!enteringSavedTab && previousRelativitySection.current === relativitySection) return undefined
    previousRelativitySection.current = relativitySection
    const view = RELATIVITY_FOCUS_VIEWS[relativitySection] || RELATIVITY_FOCUS_VIEWS.overview
    const startPosition = camera.position.clone()
    const startTarget = controls.current.target.clone()
    const destination = new THREE.Vector3(
      RELATIVITY_CAMERA_TARGET[0] + view.offset[0],
      RELATIVITY_CAMERA_TARGET[1] + view.offset[1],
      RELATIVITY_CAMERA_TARGET[2] + view.offset[2],
    )
    const target = new THREE.Vector3(
      RELATIVITY_CAMERA_TARGET[0] + view.targetOffset[0],
      RELATIVITY_CAMERA_TARGET[1] + view.targetOffset[1],
      RELATIVITY_CAMERA_TARGET[2] + view.targetOffset[2],
    )
    const progress = { value: 0 }

    relativityFocusTween.current?.kill()
    controls.current.enabled = false
    relativityFocusTween.current = gsap.to(progress, {
      value: 1,
      duration: 2.15,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.lerpVectors(startPosition, destination, progress.value)
        viewTarget.current.lerpVectors(startTarget, target, progress.value)
        controls.current?.target.copy(viewTarget.current)
        camera.lookAt(viewTarget.current)
      },
      onComplete: () => {
        relativityFocusTween.current = null
        if (controls.current && !transitioningNow.current) controls.current.enabled = true
      },
    })

    return () => {
      relativityFocusTween.current?.kill()
      relativityFocusTween.current = null
      if (controls.current && !transitioningNow.current) controls.current.enabled = true
    }
  }, [camera, currentScene, isTransitioning, relativitySection])

  useEffect(() => {
    const previous = previousGalaxyView.current
    const changed = previous.section !== galaxySection || previous.request !== galaxyCameraRequest || Math.abs(previous.aspect - galaxyAspect) > 0.08
    previousGalaxyView.current = { section: galaxySection, request: galaxyCameraRequest, aspect: galaxyAspect }
    if (currentScene !== 'galaxy' || isTransitioning || !controls.current || !changed) return undefined
    const pose = getGalaxyCameraPose(galaxySection, galaxyAspect)
    const startPosition = camera.position.clone()
    const startFocus = controls.current.target.clone()
    const destination = new THREE.Vector3(...pose.position)
    const focus = new THREE.Vector3(...pose.target)
    const progress = { value: 0 }
    setGalaxyFocusing(true)
    galaxyFocusTween.current = gsap.to(progress, {
      value: 1, duration: 2, ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.lerpVectors(startPosition, destination, progress.value)
        viewTarget.current.lerpVectors(startFocus, focus, progress.value)
        controls.current?.target.copy(viewTarget.current)
        camera.lookAt(viewTarget.current)
      },
      onComplete: () => { galaxyFocusTween.current = null; setGalaxyFocusing(false) },
    })
    return () => {
      galaxyFocusTween.current?.kill()
      galaxyFocusTween.current = null
      setGalaxyFocusing(false)
    }
  }, [camera, currentScene, galaxyAspect, galaxyCameraRequest, galaxySection, isTransitioning])

  useEffect(() => {
    const previous = previousCosmicView.current
    const changed = previous.section !== cosmicSection || previous.request !== cosmicCameraRequest || Math.abs(previous.aspect - galaxyAspect) > 0.08
    previousCosmicView.current = { section: cosmicSection, request: cosmicCameraRequest, aspect: galaxyAspect }
    if (currentScene !== 'cosmicWeb' || isTransitioning || !controls.current || !changed) return undefined
    const pose = getCosmicCameraPose(cosmicSection, galaxyAspect)
    const start = camera.position.clone()
    const startFocus = controls.current.target.clone()
    const destination = new THREE.Vector3(...pose.position)
    const focus = new THREE.Vector3(...pose.target)
    const progress = { value: 0 }
    setCosmicFocusing(true)
    cosmicFocusTween.current = gsap.to(progress, {
      value: 1, duration: 2.4, ease: 'power2.inOut',
      onUpdate: () => {
        camera.position.lerpVectors(start, destination, progress.value)
        viewTarget.current.lerpVectors(startFocus, focus, progress.value)
        controls.current?.target.copy(viewTarget.current)
        camera.lookAt(viewTarget.current)
      },
      onComplete: () => { cosmicFocusTween.current = null; setCosmicFocusing(false) },
    })
    return () => { cosmicFocusTween.current?.kill(); cosmicFocusTween.current = null; setCosmicFocusing(false) }
  }, [camera, currentScene, cosmicSection, cosmicCameraRequest, galaxyAspect, isTransitioning])

  useFrame((state, delta) => {
    if (!isTransitioning && currentScene === 'hero') {
      pointer.current.lerp(mouse, 1 - Math.exp(-delta * 2.4))

      const driftX = Math.sin(state.clock.elapsedTime * 0.12) * 0.035
      const driftY = Math.cos(state.clock.elapsedTime * 0.16) * 0.025
      camera.position.x = THREE.MathUtils.damp(camera.position.x, driftX + pointer.current.x * 0.16, 3, delta)
      camera.position.y = THREE.MathUtils.damp(camera.position.y, driftY + pointer.current.y * 0.1, 3, delta)
      camera.position.z = THREE.MathUtils.damp(camera.position.z, 8, 2.1, delta)
      viewTarget.current.set(0, 0, 0)
    }

    if (!isTransitioning && (currentScene === 'earth' || currentScene === 'solarSystem')) {
      if (currentScene === 'earth') {
        getEarthWorldPosition(getSolarSimulationTime(), followPosition.current)
      } else {
        getSolarSystemPosition(getSolarSimulationTime(), followPosition.current)
      }

      if (currentScene === 'solarSystem' && controls.current) {
        cameraOffset.current.subVectors(camera.position, controls.current.target)
        desiredCameraPosition.current.copy(followPosition.current).add(cameraOffset.current)
        camera.position.lerp(desiredCameraPosition.current, 1 - Math.exp(-CAMERA_FOLLOW_FACTOR * delta))
        controls.current.target.lerp(followPosition.current, 1 - Math.exp(-CAMERA_TARGET_FOLLOW_FACTOR * delta))
        viewTarget.current.copy(controls.current.target)
        controls.current.update()
      } else {
        if (hasFollowPosition.current) {
          followDelta.current.subVectors(followPosition.current, previousFollowPosition.current)
          camera.position.add(followDelta.current)
        }
        previousFollowPosition.current.copy(followPosition.current)
        hasFollowPosition.current = true
        viewTarget.current.copy(followPosition.current)
        viewTarget.current.y += 0.05
        camera.lookAt(viewTarget.current)
      }
    } else if (!isTransitioning && currentScene === 'blackHole' && controls.current) {
      controlTargetOffset.current.subVectors(controls.current.target, blackHoleCenter.current)
      if (controlTargetOffset.current.lengthSq() > 6.25) {
        controlTargetOffset.current.setLength(2.5).add(blackHoleCenter.current)
        followDelta.current.subVectors(controlTargetOffset.current, controls.current.target)
        controls.current.target.copy(controlTargetOffset.current)
        camera.position.add(followDelta.current)
      }
      viewTarget.current.copy(controls.current.target)
      controls.current.update()
      hasFollowPosition.current = false
    } else if (!isTransitioning && currentScene === 'cosmicWeb' && controls.current) {
      if (!cosmicFocusTween.current) viewTarget.current.copy(controls.current.target)
      hasFollowPosition.current = false
    } else if (!isTransitioning && currentScene === 'galaxy' && controls.current) {
      if (!galaxyFocusTween.current) viewTarget.current.copy(controls.current.target)
      hasFollowPosition.current = false
    } else if (!isTransitioning && currentScene === 'relativity' && controls.current) {
      if (!relativityFocusTween.current) viewTarget.current.copy(controls.current.target)
      hasFollowPosition.current = false
    } else {
      if (isTransitioning || currentScene === 'hero') hasFollowPosition.current = false
      camera.lookAt(viewTarget.current)
    }
  })

  return (
    <OrbitControls
      ref={controls}
      enabled={['solarSystem', 'blackHole', 'relativity', 'galaxy', 'cosmicWeb'].includes(currentScene) && !isTransitioning && !galaxyFocusing && !cosmicFocusing}
      enableRotate
      enableZoom
      enablePan={currentScene === 'blackHole'}
      enableDamping
      dampingFactor={currentScene === 'cosmicWeb' || currentScene === 'galaxy' ? 0.075 : currentScene === 'blackHole' || currentScene === 'relativity' ? 0.075 : 0.06}
      rotateSpeed={currentScene === 'cosmicWeb' ? 0.32 : currentScene === 'galaxy' ? 0.38 : currentScene === 'blackHole' || currentScene === 'relativity' ? 0.42 : 0.7}
      zoomSpeed={currentScene === 'cosmicWeb' ? 0.52 : currentScene === 'galaxy' ? 0.55 : currentScene === 'blackHole' || currentScene === 'relativity' ? 0.58 : 0.8}
      panSpeed={0.16}
      screenSpacePanning={false}
      minDistance={isTransitioning && ['relativity', 'galaxy', 'cosmicWeb'].some((scene) => currentScene === scene || targetScene === scene) ? 0.1 : currentScene === 'cosmicWeb' ? 300 : currentScene === 'galaxy' ? 36 : currentScene === 'blackHole' ? 9.8 : currentScene === 'relativity' ? 21 : 38}
      maxDistance={isTransitioning && ['relativity', 'galaxy', 'cosmicWeb'].some((scene) => currentScene === scene || targetScene === scene) ? 10000 : currentScene === 'cosmicWeb' ? (galaxyAspect < 0.7 ? 5400 : galaxyAspect < 1 ? 4200 : 2600) : currentScene === 'galaxy' ? (galaxyAspect < 1 ? 420 : 285) : currentScene === 'blackHole' ? 64 : currentScene === 'relativity' ? 112 : 105}
      minPolarAngle={currentScene === 'cosmicWeb' || currentScene === 'galaxy' ? 0.09 : currentScene === 'blackHole' || currentScene === 'relativity' ? 0.22 : 0.65}
      maxPolarAngle={currentScene === 'cosmicWeb' || currentScene === 'galaxy' ? Math.PI - 0.09 : currentScene === 'blackHole' || currentScene === 'relativity' ? Math.PI - 0.22 : 2.35}
      target={currentScene === 'cosmicWeb' ? COSMIC_ORIGIN : currentScene === 'galaxy' ? GALAXY_ORIGIN : currentScene === 'blackHole' ? BLACK_HOLE_CAMERA_TARGET : currentScene === 'relativity' ? RELATIVITY_CAMERA_TARGET : ORIGIN_TARGET}
    />
  )
}
