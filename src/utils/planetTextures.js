import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

// Add 1K–2K image assets here, then set VITE_USE_PLANET_TEXTURES=true to enable them.
export const planetTexturePaths = {
  sun: '/textures/planets/sun.jpg',
  mercury: '/textures/planets/mercury.jpg',
  venus: '/textures/planets/venus.jpg',
  earth: '/textures/planets/earth_day.jpg',
  earthClouds: '/textures/planets/earth_clouds.png',
  mars: '/textures/planets/mars.jpg',
  jupiter: '/textures/planets/jupiter.jpg',
  saturn: '/textures/planets/saturn.jpg',
  saturnRing: '/textures/planets/saturn_ring.png',
  uranus: '/textures/planets/uranus.jpg',
  neptune: '/textures/planets/neptune.jpg',
}

const textureCache = new Map()

function seededRandom(seed) {
  let value = seed
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
}

function paletteFor(kind) {
  return {
    sun: ['#f36f2f', '#ffb637', '#ffe68d'], mercury: ['#5f5b58', '#9c938b', '#c3bbb3'],
    venus: ['#9e793e', '#ead7a1', '#c8a35e'], earth: ['#103b72', '#1b6baa', '#8d9c58'],
    mars: ['#672b24', '#b45132', '#d77a49'], jupiter: ['#8a593d', '#d6a374', '#f1d3a1'],
    saturn: ['#a98755', '#e3d397', '#f7e8bb'], uranus: ['#73b8c7', '#b9e4df', '#8fcbd4'],
    neptune: ['#143a96', '#2c64cd', '#6c9ce8'],
  }[kind] || ['#536070', '#9aa5b5', '#d2d7df']
}

function createTexture(kind) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const context = canvas.getContext('2d')
  const random = seededRandom(kind.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0))
  const [dark, mid, light] = paletteFor(kind)

  if (kind === 'earthClouds') {
    for (let index = 0; index < 90; index += 1) {
      context.fillStyle = `rgba(255,255,255,${0.08 + random() * 0.24})`
      context.beginPath()
      context.ellipse(random() * 512, random() * 256, 14 + random() * 42, 2 + random() * 8, random() * Math.PI, 0, Math.PI * 2)
      context.fill()
    }
  } else {
    const gradient = context.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, light)
    gradient.addColorStop(0.5, mid)
    gradient.addColorStop(1, dark)
    context.fillStyle = gradient
    context.fillRect(0, 0, 512, 256)

    if (kind === 'jupiter' || kind === 'saturn' || kind === 'venus' || kind === 'sun') {
      for (let y = 0; y < 256; y += 10 + random() * 13) {
        context.fillStyle = `rgba(${kind === 'jupiter' ? '106,54,32' : '255,244,208'},${0.12 + random() * 0.26})`
        context.fillRect(0, y, 512, 4 + random() * 11)
      }
      if (kind === 'jupiter') {
        context.fillStyle = 'rgba(168,65,42,.65)'
        context.beginPath(); context.ellipse(366, 142, 28, 11, -.14, 0, Math.PI * 2); context.fill()
      }
    } else {
      for (let index = 0; index < 160; index += 1) {
        context.fillStyle = `rgba(20,20,20,${0.035 + random() * 0.11})`
        context.beginPath()
        context.arc(random() * 512, random() * 256, 1 + random() * 10, 0, Math.PI * 2)
        context.fill()
      }
      if (kind === 'earth') {
        context.fillStyle = 'rgba(82,111,55,.9)'
        for (let index = 0; index < 22; index += 1) {
          context.beginPath(); context.ellipse(random() * 512, 25 + random() * 205, 10 + random() * 32, 5 + random() * 19, random() * Math.PI, 0, Math.PI * 2); context.fill()
        }
        context.fillStyle = 'rgba(137,98,55,.63)'
        for (let index = 0; index < 12; index += 1) {
          context.beginPath(); context.ellipse(random() * 512, 30 + random() * 190, 8 + random() * 20, 4 + random() * 12, random() * Math.PI, 0, Math.PI * 2); context.fill()
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.needsUpdate = true
  return texture
}

export function getProceduralTexture(kind) {
  if (!textureCache.has(kind)) textureCache.set(kind, createTexture(kind))
  return textureCache.get(kind)
}

export function useOptionalPlanetTexture(kind) {
  const [texture, setTexture] = useState(null)
  const path = planetTexturePaths[kind]
  const enabled = import.meta.env.VITE_USE_PLANET_TEXTURES === 'true'

  useEffect(() => {
    if (!enabled || !path) return undefined
    let active = true
    const loader = new THREE.TextureLoader()
    loader.load(path, (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace
      if (active) setTexture(loaded)
    }, undefined, () => {})
    return () => { active = false }
  }, [enabled, path])

  return texture
}
