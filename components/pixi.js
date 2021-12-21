import { useRef, useState, useEffect } from 'react'
import { setupPixi, animate } from '../lib/pixi'
import { useRefDimensions } from '../lib/useDimensions'

import { Universe } from '../lib/planets'
// import benchmark from '../benchmarks/wasm'

export default function Pixi () {
    const [app, setApp] = useState(null)
    const [viewport, setViewport] = useState(null)

    const [setContainerRef, { width, height }, containerRef] = useRefDimensions()

    useEffect(() => {
        const container = containerRef.current
        if (container) {
            const { app, viewport } = setupPixi(container, { worldWidth: container.clientWidth, worldHeight: container.clientHeight })
            setApp(app)
            setViewport(viewport)
        }
    }, [containerRef])

    useEffect(() => {
        if (app && viewport) {
            const uni = Universe.new(viewport.worldWidth, viewport.worldHeight)
            animate(app, viewport, uni)
        }
    }, [app, viewport])

    useEffect(() => {
        if (app && viewport) {
            // set the size of app and viewport to the new dimensions
            app.renderer.resize(width, height)
            viewport.resize(width, height)
        }
    }, [width, height, app, viewport])

    return <div ref={setContainerRef} style={{
        width: '100%',
        height: '100%'
    }}></div>
}