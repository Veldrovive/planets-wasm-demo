import { Universe, getBodies } from '../lib/planets'

let n = 100000

const uni = Universe.new(100, 100)
uni.add_body(1, 0, 0, 100, 5000)
uni.add_body(2, 0, 0, 120, 9000)
uni.add_body(3, 0, 0, 140, 10000)
uni.add_body(4, 0, 0, 160, 15000)
uni.add_body(5, 0, 0, 180, 20000)
uni.add_body(6, 0, 0, 200, 25000)
uni.add_body(7, 0, 0, 220, 30000)
uni.add_body(8, 0, 0, 240, 35000)
uni.add_body(9, 0, 0, 260, 40000)
uni.add_body(10, 0, 0, 280, 45000)
uni.add_body(11, 0, 0, 300, 50000)
let time = 0

const testUpdate = () => {
    uni.tick(1, time)
    time += 1
}

const testBodies = () => {
    const bodies = getBodies(uni)
    // uni.tick(1, time)
    // time += 1
}

for (let i = 0; i < 500; i++) {
    console.log(getBodies(uni)[0])
    time += 10
    uni.tick(10, time)
}

let start, end, elapsed;

start = performance.now()
for (let i = 0; i < n; i++) {
    testUpdate()
}
end = performance.now()
elapsed = end - start
console.log(`testUpdate: ${elapsed}ms. Per tick: ${1000 * elapsed / n}micros`)

start = performance.now()
for (let i = 0; i < n; i++) {
    testBodies()
}
end = performance.now()
elapsed = end - start
console.log(`getBodies: ${elapsed}ms. Per body: ${1000 * elapsed / n}micros`)

console.log(`${60 * elapsed / n} milliseconds per second spent simulation`)

console.log(getBodies(uni))