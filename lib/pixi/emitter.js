import * as PIXI from 'pixi.js'
import * as particles from '@pixi/particle-emitter'
import particleTypes from './emitterTypes.json' 

export function createEmitter (container, particleType, overrides = {}, updateConfig=true) {
    if (!(particleType in particleTypes)) {
        throw new Error(`Unknown particle type: ${particleType}`)
    }
    const texture = PIXI.Texture.from('particle.png')
    let particleConfig = { ...particleTypes[particleType], ...overrides }
    if (updateConfig) {
        particleConfig = particles.upgradeConfig(particleConfig, [texture])
    } else {
        particleConfig.behaviors.push({
            type: 'textureSingle',
            config: {
                texture: texture
            }
        })
    }
    const emitter = new particles.Emitter(container, particleConfig)
    return emitter
}