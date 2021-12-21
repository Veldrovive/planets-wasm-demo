import * as PIXI from 'pixi.js'
import * as particles from '@pixi/particle-emitter'
import particleTypes from './emitterTypes.json' 

export function createEmitter (container, particleType, overrides = {}) {
    if (!(particleType in particleTypes)) {
        throw new Error(`Unknown particle type: ${particleType}`)
    }
    const texture = PIXI.Texture.from('particle.png')
    const particleConfig = { ...particleTypes[particleType], ...overrides }
    const emitter = new particles.Emitter(container, particles.upgradeConfig(particleConfig, [texture]))
    return emitter
}