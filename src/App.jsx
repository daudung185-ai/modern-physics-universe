import { Suspense, useCallback, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Preload } from '@react-three/drei'
import UniverseScene from './components/UniverseScene'
import CameraRig from './components/CameraRig'
import Navigation from './components/Navigation'
import LoadingScreen from './components/LoadingScreen'
import SolarSystem from './components/SolarSystem'
import RelativityScene from './components/RelativityScene'
import BlackHole from './components/BlackHole'
import GalaxyScene from './components/GalaxyScene'
import CosmicWebScene from './components/CosmicWebScene'
import InfoPanel from './components/InfoPanel'
import Hero from './sections/Hero'
import EarthOverlay from './sections/EarthOverlay'
import RelativityOverlay from './sections/RelativityOverlay'
import BlackHoleOverlay from './sections/BlackHoleOverlay'
import GalaxyOverlay from './sections/GalaxyOverlay'
import CosmicWebOverlay from './sections/CosmicWebOverlay'

export default function App() {
  const [currentScene, setCurrentScene] = useState('hero')
  const [targetScene, setTargetScene] = useState('hero')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [cameraRequest, setCameraRequest] = useState(0)
  const [selectedInfo, setSelectedInfo] = useState(null)
  const [relativityMass, setRelativityMass] = useState(1.1)
  const [relativitySection, setRelativitySection] = useState('overview')
  const [blackHoleSection, setBlackHoleSection] = useState('overview')
  const [galaxySection, setGalaxySection] = useState('overview')
  const [galaxyCameraRequest, setGalaxyCameraRequest] = useState(0)
  const [cosmicSection, setCosmicSection] = useState('overview')
  const [cosmicCameraRequest, setCosmicCameraRequest] = useState(0)
  const cosmicSimulation = useRef({ formation: 1, expansion: 0 })
  const [geodesicVisible, setGeodesicVisible] = useState(true)
  const [geodesicReplay, setGeodesicReplay] = useState(0)
  const [lightPassDistance, setLightPassDistance] = useState(1.4)
  const [multipleLightRays, setMultipleLightRays] = useState(true)
  const [isReady, setIsReady] = useState(false)

  const solarSystemInvolved = ['earth', 'solarSystem'].includes(currentScene) || ['earth', 'solarSystem'].includes(targetScene)
  const relativityInvolved = currentScene === 'relativity' || targetScene === 'relativity'
  const blackHoleInvolved = currentScene === 'blackHole' || targetScene === 'blackHole'
  const galaxyInvolved = currentScene === 'galaxy' || targetScene === 'galaxy'
  const cosmicInvolved = currentScene === 'cosmicWeb' || targetScene === 'cosmicWeb'

  const handleCreated = useCallback(() => setIsReady(true), [])
  const navigateTo = useCallback((scene) => {
    if (isTransitioning || (scene === targetScene && scene !== 'earth')) return
    setSelectedInfo(null)
    if (scene === 'galaxy') setGalaxySection('overview')
    if (scene === 'cosmicWeb') setCosmicSection('overview')
    setTargetScene(scene)
    setIsTransitioning(true)
    setCameraRequest((request) => request + 1)
  }, [isTransitioning, targetScene])

  const finishTransition = useCallback((scene) => {
    setCurrentScene(scene)
    setIsTransitioning(false)
  }, [])

  return (
    <main className="universe-app">
      <Canvas
        className="universe-canvas"
        camera={{ position: [0, 0, 8], fov: 48, near: 0.1, far: 1600 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={handleCreated}
      >
        <Suspense fallback={null}>
          <UniverseScene heroActive={currentScene === 'hero' && !isTransitioning} />
          {solarSystemInvolved && (
            <SolarSystem
              onPlanetSelect={setSelectedInfo}
              showContext={currentScene === 'solarSystem' || targetScene === 'solarSystem'}
              trailsEnabled={currentScene === 'solarSystem' && !isTransitioning}
            />
          )}
          {relativityInvolved && (
            <RelativityScene
              active={targetScene === 'relativity'}
              mass={relativityMass}
              section={relativitySection}
              geodesicVisible={geodesicVisible}
              geodesicReplay={geodesicReplay}
              lightPassDistance={lightPassDistance}
              multipleLightRays={multipleLightRays}
            />
          )}
          {blackHoleInvolved && (
            <BlackHole
              active={targetScene === 'blackHole'}
              section={blackHoleSection}
              onSelect={setSelectedInfo}
            />
          )}
          {galaxyInvolved && (
            <GalaxyScene
              active={targetScene === 'galaxy' || targetScene === 'cosmicWeb'}
              interactive={currentScene === 'galaxy' && !isTransitioning}
              section={galaxySection}
              onSelect={setSelectedInfo}
            />
          )}
          {cosmicInvolved && (
            <CosmicWebScene
              active={targetScene === 'cosmicWeb'}
              interactive={currentScene === 'cosmicWeb' && !isTransitioning}
              section={cosmicSection}
              simulation={cosmicSimulation}
              onSelect={setSelectedInfo}
            />
          )}
          <CameraRig
            currentScene={currentScene}
            targetScene={targetScene}
            isTransitioning={isTransitioning}
            cameraRequest={cameraRequest}
            relativitySection={relativitySection}
            galaxySection={galaxySection}
            galaxyCameraRequest={galaxyCameraRequest}
            cosmicSection={cosmicSection}
            cosmicCameraRequest={cosmicCameraRequest}
            onTransitionComplete={finishTransition}
          />
          <Preload all />
        </Suspense>
      </Canvas>

      {isTransitioning && targetScene === 'galaxy' && <div key={cameraRequest} className="galaxy-transit" aria-hidden="true"><span>ĐANG ĐẾN MIỀN THIÊN HÀ</span></div>}

      <Hero isVisible={currentScene === 'hero' && !isTransitioning} onStart={() => navigateTo('earth')} />
      <EarthOverlay
        isVisible={currentScene === 'earth' && !isTransitioning}
        onExplore={() => navigateTo('solarSystem')}
      />
      <RelativityOverlay
        isVisible={currentScene === 'relativity' && !isTransitioning && !selectedInfo}
        mass={relativityMass}
        activeSection={relativitySection}
        geodesicVisible={geodesicVisible}
        lightPassDistance={lightPassDistance}
        multipleLightRays={multipleLightRays}
        onMassChange={setRelativityMass}
        onLightPassDistanceChange={setLightPassDistance}
        onMultipleLightRaysChange={setMultipleLightRays}
        onSectionChange={setRelativitySection}
        onGeodesicToggle={() => setGeodesicVisible((visible) => !visible)}
        onGeodesicReplay={() => setGeodesicReplay((request) => request + 1)}
        onSelect={setSelectedInfo}
      />
      <BlackHoleOverlay
        isVisible={currentScene === 'blackHole' && !isTransitioning && !selectedInfo}
        activeSection={blackHoleSection}
        onSectionChange={setBlackHoleSection}
        onSelect={setSelectedInfo}
      />
      <GalaxyOverlay
        isVisible={currentScene === 'galaxy' && !isTransitioning && !selectedInfo}
        section={galaxySection}
        onSectionChange={setGalaxySection}
        onSelect={setSelectedInfo}
        onResetView={() => { setGalaxySection('overview'); setGalaxyCameraRequest((request) => request + 1) }}
      />
      <CosmicWebOverlay
        isVisible={currentScene === 'cosmicWeb' && !isTransitioning && !selectedInfo}
        section={cosmicSection}
        simulation={cosmicSimulation}
        onSectionChange={setCosmicSection}
        onSelect={setSelectedInfo}
        onResetView={() => { setCosmicSection('overview'); setCosmicCameraRequest((request) => request + 1) }}
      />
      <Navigation
        activeScene={isTransitioning ? targetScene : currentScene}
        isTransitioning={isTransitioning}
        onNavigate={navigateTo}
      />
      <InfoPanel item={selectedInfo} onClose={() => setSelectedInfo(null)} />
      <LoadingScreen isReady={isReady} />
    </main>
  )
}
