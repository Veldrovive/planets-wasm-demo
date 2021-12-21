export default function createCamera (consumerContext, { sceneWidth = 1000, sceneHeight = 1000 }) {
    // creates an offscreen canvas that will house the full-size image
    // A virtual camera is then used to set the rotation and position of the consumer
    // On every frame, we draw the offscreen canvas to the consumer with the given rotation and position
    // The transformation matrix of the consumer is then used to find the clipping plane of the camera to allow for more efficient rendering of the full-size image
    // Returns two functions, one to set the position and rotation of the camera and one to cancel the animation and remove the offscreen canvas
    // Also returns the context that is used to render the full-size image so that it can be written to by the animation computations
    //   - This should actually be done through a set of animation functions that only draw the object if it falls in the clipping plane

    // create the offscreen canvas
    const seedCanvas = document.createElement('canvas')
    const seedContext = seedCanvas.getContext('2d')
    seedCanvas.width = sceneWidth
    seedCanvas.height = sceneHeight

    // create the virtual camera helper function
    consumerContext.translate(consumerContext.canvas.width / 2, consumerContext.canvas.height / 2)
    let currentRotation = 0
    let currentScale = 1000
    let currentPosition = { x: sceneWidth/2, y: sceneHeight/2 }
    const computePerspectiveTransform = (cameraPosition, cameraRotation) => {
        // Uses context.translate and context.rotate to change the view consumerContext sees
        if (currentRotation !== cameraRotation) {
            // Do the computations to figure out what the camera rotation should be
            consumerContext.rotate(cameraRotation)
            // const currentTransform = consumerContext.getTransform()
            currentRotation = cameraRotation
        }
        if (currentPosition.x !== cameraPosition.x || currentPosition.y !== cameraPosition.y) {
            // Do the computations to figure out what the camera position should be
            // consumerContext.translate(cameraPosition.x, cameraPosition.y)
            currentPosition = cameraPosition
        }
    }

    const setPerspective = ({ x, y, rot }) => {
        let newPosition = { x, y }
        let newRotation = rot
        computePerspectiveTransform(newPosition, newRotation)
    }

    // Animate
    let animate = true
    const handleAnimationFrame = () => {
        if (animate) {
            const ratio = consumerContext.canvas.height / consumerContext.canvas.width
            const halfWidth = currentScale/2
            const halfHeight = halfWidth * ratio
            const s = {sx: currentPosition.x - halfWidth*3, sy: currentPosition.y - halfHeight*3, sWidth: 2*halfWidth*3, sHeight: 2*halfHeight*3}
            const d = {dx: -consumerContext.canvas.width/2 * 3, dy: -consumerContext.canvas.height/2 * 3, dWidth: consumerContext.canvas.width * 3, dHeight: consumerContext.canvas.height * 3}
            console.log("Drawing", JSON.stringify(s), JSON.stringify(d))
            consumerContext.clearRect(0, 0, consumerContext.canvas.width, consumerContext.canvas.height)
            consumerContext.drawImage(seedCanvas, ...Object.values(s), ...Object.values(d))
            requestAnimationFrame(handleAnimationFrame)
        }
    }
    requestAnimationFrame(handleAnimationFrame)

    const stopAnimation = () => {
        animate = false
    }

    const test = (horizLines, vertLines) => {
        const { width, height } = seedCanvas
        seedContext.fillStyle = '#aaa'
        seedContext.fillRect(0, 0, width, height)
        // Draw a grid across the canvas
        seedContext.fillStyle = '#000'
        seedContext.lineWidth = 1
        seedContext.beginPath()
        for (let x_ind = 0; x_ind < width + 1; x_ind += width / (horizLines)) {
            seedContext.moveTo(x_ind, 0)
            seedContext.lineTo(x_ind, height)
        }
        for (let y_ind = 0; y_ind < height + 1; y_ind += height / (vertLines)) {
            seedContext.moveTo(0, y_ind)
            seedContext.lineTo(width, y_ind)
        }
        seedContext.stroke()

        // Draw 4 circles half way to the edges of the canvas
        seedContext.fillStyle = '#f00'
        seedContext.beginPath()
        seedContext.arc(width / 2, height/2 + height / 8, 10, 0, 2 * Math.PI)
        seedContext.fill()
        seedContext.fillStyle = '#0f0'
        seedContext.beginPath()
        seedContext.arc(width / 2, height/2 - height / 8, 10, 0, 2 * Math.PI)
        seedContext.fill()
        seedContext.fillStyle = '#00f'
        seedContext.beginPath()
        seedContext.arc(width / 2 + width / 8, height / 2, 10, 0, 2 * Math.PI)
        seedContext.fill()
        seedContext.fillStyle = '#ff0'
        seedContext.beginPath()
        seedContext.arc(width / 2 - width / 8, height / 2, 10, 0, 2 * Math.PI)
        seedContext.fill()


        let continueAnimating = true
        const handler = () => {
            if (continueAnimating) {
                setPerspective({ x: currentPosition.x, y: currentPosition.y, rot: currentRotation + 0.001 })
                // console.log(consumerContext.getTransform())
                requestAnimationFrame(handler)
            }
        }
        requestAnimationFrame(handler)

        setTimeout(() => {
            continueAnimating = false
        }, 1000)
    }

    return {
        setPerspective,
        stopAnimation,
        test,
        seedContext
    }
}