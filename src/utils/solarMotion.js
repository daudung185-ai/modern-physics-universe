import * as THREE from 'three'

export const SOLAR_SYSTEM_TRAVEL_SPEED = 3.2
export const PLANET_ORBIT_SPEED_SCALE = 0.48
export const CAMERA_FOLLOW_FACTOR = 0.58
export const CAMERA_TARGET_FOLLOW_FACTOR = 0.86
export const TRAIL_SAMPLE_INTERVAL = 0.075
export const TRAIL_MAX_POINTS_DESKTOP = 340
export const TRAIL_MAX_POINTS_MOBILE = 140
export const MAX_SIMULATION_DELTA = 0.08
export const SOLAR_SYSTEM_TRAVEL_DIRECTION = new THREE.Vector3(0, 0, -1)
export const ORBITAL_PLANE_ROTATION = [0.26, -0.18, 0.08]

const orbitalPlaneEuler = new THREE.Euler(...ORBITAL_PLANE_ROTATION)
const earthLocalPosition = new THREE.Vector3()
let simulationTime = 0

export function advanceSolarSimulation(delta) {
  if ((typeof document !== 'undefined' && document.hidden) || delta > 0.25) return simulationTime
  simulationTime += getSafeSimulationDelta(delta)
  return simulationTime
}

export function getSolarSimulationTime() {
  return simulationTime
}

export function getSafeSimulationDelta(delta) {
  return delta > 0.25 ? 0 : Math.min(delta, MAX_SIMULATION_DELTA)
}

export function getSolarSystemPosition(elapsedTime, target) {
  return target.copy(SOLAR_SYSTEM_TRAVEL_DIRECTION).multiplyScalar(elapsedTime * SOLAR_SYSTEM_TRAVEL_SPEED)
}

export function getEarthWorldPosition(elapsedTime, target) {
  const orbitAngle = elapsedTime * 0.82 * PLANET_ORBIT_SPEED_SCALE
  earthLocalPosition.set(Math.cos(orbitAngle) * 10, Math.sin(orbitAngle) * 10, 0)
  earthLocalPosition.applyEuler(orbitalPlaneEuler)
  getSolarSystemPosition(elapsedTime, target)
  return target.add(earthLocalPosition)
}
