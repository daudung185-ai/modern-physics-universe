import { useEffect, useState } from 'react'

export default function LoadingScreen({ isReady }) {
  const [progress, setProgress] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!isReady) return undefined

    const start = performance.now()
    const duration = 650
    let frameId

    const advance = (now) => {
      const nextProgress = Math.min(100, Math.round(((now - start) / duration) * 100))
      setProgress(nextProgress)
      if (nextProgress < 100) {
        frameId = requestAnimationFrame(advance)
      } else {
        window.setTimeout(() => setIsVisible(false), 280)
      }
    }

    frameId = requestAnimationFrame(advance)
    return () => cancelAnimationFrame(frameId)
  }, [isReady])

  if (!isVisible) return null

  return (
    <div className={`loading-screen${isReady ? ' is-complete' : ''}`} aria-live="polite">
      <p>Đang khởi tạo Vũ trụ...</p>
      <div className="loading-track" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress / 100})` }} />
      </div>
      <strong>{progress}%</strong>
    </div>
  )
}
