import Stars from './Stars'
import MilkyWay from './MilkyWay'

export default function UniverseScene({ heroActive }) {
  return (
    <>
      <ambientLight intensity={0.045} />
      <Stars />
      <MilkyWay active={heroActive} />
    </>
  )
}
