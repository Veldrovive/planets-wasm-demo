import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
import { createEmitter } from './emitter'
import { getOrbits, getFullOrbits } from '../planets'

const BODY_TYPES = Object.freeze({ PLANET: 0, MOON: 1, ASTEROID: 2, ORT_OBJECT: 3, COMMET: 4 })

let app
export function setupPixi (containerElem, { worldWidth, worldHeight }) {
    // Creates the pixi application and adds a viewport
    app = new PIXI.Application({
        width: containerElem.clientWidth,
        height: containerElem.clientHeight,
        backgroundColor: 0x1F282D,
        backgroundAlpha: 1,
        antialias: true,
        resolution: 1,
        // resizeTo: window
    })
    containerElem.appendChild(app.view)
    const stage = app.stage

    const viewport = new Viewport({
        screenWidth: app.screen.width,
        screenHeight: app.screen.height,
        worldWidth: worldWidth,
        worldHeight: worldHeight,
        interaction: app.renderer.plugins.interaction,
    })

    // Add the viewport to the stage
    stage.addChild(viewport)

    viewport
        .drag()
        .pinch()
        .wheel()

    return { app, viewport }
}

function randRange (min, max) {
    return Math.random() * (max - min) + min
}

function createOrbitGraphicsLines (positionsX, positionsY) {
    const graphics = new PIXI.Graphics()
    graphics.lineStyle(6, 0xFFFFFF, 0.3)
    graphics.moveTo(positionsX[0], positionsY[0])
    for (let i = 1; i < positionsX.length; i++) {
        graphics.lineTo(positionsX[i], positionsY[i])
    }
    // Close
    graphics.lineTo(positionsX[0], positionsY[0])
    graphics.endFill()
    return graphics
}

function setUpRealisticOrbits (uni, viewport, numAsteroids=500, numOrtObjects=2000, numComets=5) {
    const spriteMap = {}
    let currId = 0
    // First, create 4 planets
    const averageRockyPlanetRadius = [200, 400, 600, 800]
    const rockyAngleBias = randRange(0, Math.PI * 2)
    for (const averageRadius of averageRockyPlanetRadius) {
        const minorAxis = averageRadius * randRange(1, 1.1)
        const majorAxis = minorAxis * randRange(1.001, 1.005)
        const angle = rockyAngleBias + randRange(-Math.PI/8, Math.PI/8)
        const period = minorAxis * randRange(8, 12)
        const orbitalOffset = randRange(0, Math.PI * 2)
        const args = [currId, 0, 0, majorAxis, minorAxis, angle, period, orbitalOffset]
        uni.add_orbit(...args)
        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
        sprite.scale.set(4, 4)
        sprite.anchor.set(0.5)
        viewport.addChild(sprite)
        spriteMap[currId] = [sprite, null, {
            bodyType: BODY_TYPES.PLANET,
            defaultShowOrbit: true,
            canFollow: true,
            mouseOverOrbit: true,
            cometaryTail: false
        }]
        currId++
    }

    // Then create astroid belt
    const astroidBeltRadius = 1200
    for (let i = 0; i < numAsteroids; i++) {
        const minorAxis = astroidBeltRadius * randRange(0.95, 1.05)
        const majorAxis = minorAxis * randRange(1, 1.0025)
        const angle = randRange(0, Math.PI * 2)
        const period = minorAxis * randRange(8, 12)
        const orbitalOffset = randRange(0, 2*Math.PI)
        const args = [currId, 0, 0, majorAxis, minorAxis, angle, period, orbitalOffset]
        uni.add_orbit(...args)
        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
        sprite.anchor.set(0.5)
        viewport.addChild(sprite)
        spriteMap[currId] = [sprite, null, {
            bodyType: BODY_TYPES.ASTEROID,
            defaultShowOrbit: false,
            canFollow: true,
            mouseOverOrbit: true,
            cometaryTail: false
        }]
        currId++
    }

    // Then create the gas giant orbits
    const averageGasGiantRadius = [1600, 2400, 3000, 4000]
    const gasAngleBias = randRange(0, Math.PI * 2)
    for (const averageRadius of averageGasGiantRadius) {
        const minorAxis = averageRadius * randRange(1, 1.1)
        const majorAxis = minorAxis * randRange(1, 1.001)
        const angle = gasAngleBias + randRange(-Math.PI/8, Math.PI/8)
        const period = minorAxis * randRange(8, 12)
        const orbitalOffset = randRange(0, 2*Math.PI)
        const args = [currId, 0, 0, majorAxis, minorAxis, angle, period, orbitalOffset]
        uni.add_orbit(...args)
        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
        sprite.scale.set(10, 10)
        sprite.anchor.set(0.5)
        viewport.addChild(sprite)
        spriteMap[currId] = [sprite, null, {
            bodyType: BODY_TYPES.PLANET,
            defaultShowOrbit: true,
            canFollow: true,
            mouseOverOrbit: true,
            cometaryTail: false
        }]
        currId++
    }

    // Then create the ort cloud
    const averageOrbitCloudRadius = 6000
    for (let i = 0; i < numOrtObjects; i++) {
        const minorAxis = averageOrbitCloudRadius * randRange(1, 1.1)
        const majorAxis = minorAxis * randRange(1, 1.005)
        const angle = randRange(0, Math.PI * 2)
        const period = minorAxis * randRange(8, 12)
        const orbitalOffset = randRange(0, 2*Math.PI)
        const args = [currId, 0, 0, majorAxis, minorAxis, angle, period, orbitalOffset]
        uni.add_orbit(...args)
        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
        if (randRange(0, 1) > 0.98) {
            // Make this a dwarf planet
            const scale = randRange(1.5, 3)
            sprite.scale.set(scale, scale)
        }
        sprite.anchor.set(0.5)
        viewport.addChild(sprite)
        spriteMap[currId] = [sprite, null, {
            bodyType: BODY_TYPES.ORT_OBJECT,
            defaultShowOrbit: false,
            canFollow: true,
            mouseOverOrbit: true,
            cometaryTail: false
        }]
        currId++
    }

    // Then create astroids
    const avgCometMajorAxis = 9000
    for (let i = 0; i < numComets; i++) {
        const majorAxis = avgCometMajorAxis * randRange(0.9, 1.3)
        const minorAxis = majorAxis * randRange(0.1, 0.3) // Highly eliptical orbits
        const angle = randRange(0, Math.PI * 2)
        const period = majorAxis * randRange(8, 12)
        const orbitalOffset = randRange(0, 2*Math.PI)
        const args = [currId, 0, 0, majorAxis, minorAxis, angle, period, orbitalOffset]
        uni.add_orbit(...args)
        const sprite = new PIXI.Sprite(PIXI.Texture.WHITE)
        sprite.scale.set(4, 4)
        sprite.anchor.set(0.5)
        viewport.addChild(sprite)
        spriteMap[currId] = [sprite, null, {
            bodyType: BODY_TYPES.COMET,
            defaultShowOrbit: false,
            canFollow: true,
            mouseOverOrbit: true,
            cometaryTail: true // Need some way to actually create this emitter. Not sure if rust should do computations for angle to focus.
        }]
        currId++
    }

    const fullOrbits = getFullOrbits(uni)
    for (let { id, orbitX, orbitY } of fullOrbits) {
        let orbitSprite = createOrbitGraphicsLines(orbitX, orbitY)
        viewport.addChild(orbitSprite)
        spriteMap[id][1] = orbitSprite
    }

    return spriteMap
}

export function animate (app, viewport, universe) {
    // Set up sprites
    // const orbitSpriteMap = setUpOrbits(universe, viewport, 5000)
    const orbitSpriteMap = setUpRealisticOrbits(universe, viewport)
    for (let [id, [sprite, orbitSprite, meta]] of Object.entries(orbitSpriteMap)) {
        const { bodyType, defaultShowOrbit, canFollow, mouseOverOrbit, cometaryTail } = meta
        orbitSprite.visible = defaultShowOrbit
        sprite.interactive = true
        const hitRadius = Math.min(sprite.width, 40)
        sprite.hitArea = new PIXI.Circle(0, 0, hitRadius)
        let following = false
        sprite.on('mouseover', () => {
            if (mouseOverOrbit) {
                orbitSprite.visible = true
            }
        })
        sprite.on('mouseout', () => {
            if (!following && !defaultShowOrbit) {
                orbitSprite.visible = false
            }
        })
        sprite.on('mouseup', (e) => {
            if (canFollow) {
                viewport.follow(sprite, { speed: 10, acceleration: 0.1 })
                orbitSprite.visible = true
                following = true
            }
        })
        viewport.on('mousedown', () => {
            orbitSprite.visible = defaultShowOrbit
            viewport.plugins.remove('follow')
            following = false
        })
    }

    // Setup up sun
    const sun = new PIXI.Sprite(PIXI.Texture.WHITE)
    sun.anchor.set(0.5)
    sun.tint = 0xffff00
    viewport.addChild(sun)
    sun.position.set(0, 0)
    sun.scale.set(10, 10)

    // Animate
    let elapsed = 0
    let deltaQueue = []
    let queueLength = 10
    let rateSum = 0
    let rateStable = false
    app.ticker.add(delta => {
        rateSum += delta
        deltaQueue.push(delta)
        if (deltaQueue.length > queueLength) {
            const shifted = deltaQueue.shift()
            rateSum -= shifted
        }
        const avgRate = rateSum / deltaQueue.length
        if (Math.abs(delta - avgRate) < 0.02 && elapsed > 0.1) {
            // Then frame rate is stable
            rateStable = true
        } else {
            // Then frame rate is unstable
            // console.log("Unstable frame rate:", delta, avgRate)
            rateStable = false
        }

        const orbits = getOrbits(universe)
        for (let { id, x, y } of orbits) {
            if (id != null) {
                // Due to optimization, the id is sometimes undefined if the orbit has been deleted
                const [bodySprite, orbitSprite] = orbitSpriteMap[id]
                if (rateStable) {
                    bodySprite.position.set(x, y)
                }
            }
        }

        elapsed += delta
        universe.tick(delta, elapsed)
    })
}