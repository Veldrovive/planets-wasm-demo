// Things in this file are going to look a bit weird. This is due to the fact that these functions are called on each animation frame.
// Since we have to work around the garbage collector, we want to create as few new objects as possible.
// You will see that the only time we create a new object is during an initialization step and then we just overwrite or plain use the old objects.
// This is especially true for array buffers as they are simply a reference to linear memory. There is never any reason to create a new one (unless
// you have changed the size of the buffer) so we only very rarely call an initializer for it.


import * as planets from 'rust-planets'
import { memory } from 'rust-planets/rust_planets_bg.wasm'

const u32Getters = { }
function initu32Getter (getterId, basePtr, structSize, numStructs) {
    const structSize32 = structSize / 4 // How many u32s would fit in the struct?
    // This should be memory aligned to 4 bytes by rust I hope
    const values = new Uint32Array(memory.buffer, basePtr, numStructs * structSize32)
    const getter = (structOffset, fieldOffset) => {
        const fieldOffset32 = fieldOffset / 4 // How many u32s would fit before this field?
        return values[structOffset * structSize32 + fieldOffset32]
    }
    const indexGetter = (structOffset, fieldOffset) => {
        const fieldOffset32 = fieldOffset / 4 // How many u32s would fit before this field?
        return structOffset * structSize32 + fieldOffset32
    }
    u32Getters[getterId] = getter
    u32Getters[getterId + '_index'] = indexGetter
    u32Getters[getterId+'_values'] = values
}

const f64Getters = { }
function initf64Getter (getterId, basePtr, structSize, numStructs) {
    const structSize64 = structSize / 8 // How many floats would fit in the struct?
    // This should be memory aligned to 8 bytes by rust I hope
    const values = new Float64Array(memory.buffer, basePtr, numStructs * structSize64)
    const getter = (structOffset, fieldOffset) => {
        const fieldOffset64 = fieldOffset / 8 // How many floats would fit before this field?
        return values[structOffset * structSize64 + fieldOffset64]
    }
    const indexGetter = (structOffset, fieldOffset) => {
        const fieldOffset64 = fieldOffset / 8 // How many floats would fit before this field?
        return structOffset * structSize64 + fieldOffset64
    }
    f64Getters[getterId] = getter
    f64Getters[getterId + '_index'] = indexGetter
    f64Getters[getterId+'_values'] = values
}

let orbitOffsets, orbitSize, orbitsPtr, numOrbits
const orbits = []
const fullOrbits = []
function updateOrbits (universe, orbitsChanged=false) {
    if (!orbitOffsets || !orbitSize) {
        orbitOffsets = planets.EllipticalOrbit.offsets()
        orbitSize = planets.EllipticalOrbit.size()
    }
    if (!orbitsPtr || orbitsChanged) {
        orbitsPtr = universe.orbits()
        numOrbits = universe.num_orbits()
    }
    if (orbitsChanged || orbits.length !== numOrbits) {
        if (orbits.length < numOrbits) {
            for (let i = orbits.length; i < numOrbits; i++) {
                orbits.push({
                    id: null,
                    x: 0,
                    y: 0,
                    dir_to_focus: 0,
                    centerX: 0,
                    centerY: 0,
                    majorAxis: 0,
                    minorAxis: 0,
                    angle: 0,
                    period: 0,
                    orbitalOffset: 0,
                    eccentricity: 0
                })
            }
        }
        if (orbits.length > numOrbits) {
            for (let i = numOrbits; i < orbits.length; i++) {
                orbits[i].id = null
            }
        }
    }
    if (orbitsChanged || fullOrbits.length !== numOrbits) {
        if (fullOrbits.length < numOrbits) {
            for (let i = fullOrbits.length; i < numOrbits; i++) {
                fullOrbits.push({
                    id: null,
                    orbitLength: 0,
                    orbitX: [],
                    orbitY: []
                })
            }
        }
        if (fullOrbits.length > numOrbits) {
            for (let i = numOrbits; i < fullOrbits.length; i++) {
                fullOrbits[i].id = null
            }
        }
    }
    if (orbitsChanged || u32Getters.orbits === undefined) {
        initu32Getter('orbits', orbitsPtr, orbitSize, numOrbits)
    }
    if (orbitsChanged || f64Getters.orbits === undefined) {
        initf64Getter('orbits', orbitsPtr, orbitSize, numOrbits)
    }
}

export function getOrbits (universe, orbitsChanged=false) {
    updateOrbits(universe, orbitsChanged)
    for (let i = 0; i < numOrbits; i++) {
        const u32Getter = u32Getters.orbits
        const f64Getter = f64Getters.orbits
        const orbit = orbits[i]
        orbit.id = u32Getter(i, orbitOffsets.id)
        orbit.x = f64Getter(i, orbitOffsets.x)
        orbit.y = f64Getter(i, orbitOffsets.y)
        orbit.dir_to_focus = f64Getter(i, orbitOffsets.dir_to_focus)
        orbit.centerX = f64Getter(i, orbitOffsets.center_x)
        orbit.centerY = f64Getter(i, orbitOffsets.center_y)
        orbit.majorAxis = f64Getter(i, orbitOffsets.major_axis)
        orbit.minorAxis = f64Getter(i, orbitOffsets.minor_axis)
        orbit.angle = f64Getter(i, orbitOffsets.angle)
        orbit.period = f64Getter(i, orbitOffsets.period)
        orbit.orbitalOffset = f64Getter(i, orbitOffsets.orbital_offset)
        orbit.eccentricity = f64Getter(i, orbitOffsets.eccentricity)
    }
    return orbits
}

export function getFullOrbits (universe, orbitsChanged=false) {
    updateOrbits(universe, orbitsChanged)
    for (let i = 0; i < numOrbits; i++) {
        const orbit = fullOrbits[i]
        const u32Getter = u32Getters.orbits
        orbit.id = u32Getter(i, orbitOffsets.id)
        orbit.orbitLength = u32Getter(i, orbitOffsets.orbit_length)
        const f64IndexGetter = f64Getters.orbits_index
        const startIndex = f64IndexGetter(i, orbitOffsets.orbit)
        const f64Buffer = f64Getters.orbits_values
        for (let i = 0; i < orbit.orbitLength; i++) {
            orbit.orbitX[i] = f64Buffer[2*i + startIndex]
            orbit.orbitY[i] = f64Buffer[2*i+1 + startIndex]
        }
    }
    return fullOrbits
}

export const Universe = planets.Universe