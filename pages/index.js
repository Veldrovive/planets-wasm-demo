import dynamic from 'next/dynamic'

const Pixi = dynamic(
  () => import('../components/pixi'),
  { ssr: false }
)

export default function Home() {
  return (
    <div className="App" style={{
      width: '100vw',
      height: '100vh',
      position: 'absolute',
      top: 0,
      left: 0,
    }}>
      <Pixi />
    </div>
  )
}
