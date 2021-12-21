import { useState, useEffect, useRef, useCallback } from 'react'

/*
These hooks allow you to have access to the exact size of elements on the screen without much overhead.
Since we are doing native animations, such pixel values are very useful

To use getWindowDimensions, just do const { width: windowWidth, height: windowHeight } = getWindowDimensions()

For getRefDimensions, you can access the values as const [elemRef, { width: elemWidth, height: elemHeight }] = getRefDimensions()
but be sure to also add ref={elemRef} to your element or this hook will do nothing.
*/

function getWindowDimensions () {
  const { innerWidth: width, innerHeight: height } = window
  return {
    width,
    height
  }
}

function useWindowDimensions () {
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    function handleResize () {
      setWindowDimensions(getWindowDimensions())
    }

    window.addEventListener('resize', handleResize)
    setWindowDimensions(getWindowDimensions())
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowDimensions
}

function getRefDimensions (ref) {
  if (!ref) {
    return { width: 0, height: 0 }
  }
  return { width: ref.clientWidth, height: ref.clientHeight }
}

// Uses https://stackoverflow.com/questions/6492683/how-to-detect-divs-dimension-changed to avoid running on every rerender
function useRefDimensions () {
  // Store a referrence to the element as well as its dimensions
  const ref = useRef()
  const resizeObserver = useRef()

  const [refDimensions, setRefDimensions] = useState({ width: 0, height: 0 })
  function handleResize () {
    const dims = getRefDimensions(ref.current)
    setRefDimensions(dims)
  }

  const setRef = useCallback(elem => {
    if (elem == null) {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect()
      }
      ref.current = null
    }

    if (elem && elem !== ref.current) {
      ref.current = elem
      // Remove the observer
      if (resizeObserver.current) {
        resizeObserver.current.disconnect()
      }
      resizeObserver.current = new window.ResizeObserver(handleResize)
      resizeObserver.current.observe(ref.current)
    }
  }, [])

  // We return the reference so it can be assigned as well as the dimension state
  return [setRef, refDimensions, ref]
}

export { useWindowDimensions, useRefDimensions }
