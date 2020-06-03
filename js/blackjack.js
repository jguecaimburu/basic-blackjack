'use strict';

const BJ = (function () {

  /*  CONFIGURATION VALUES
  ----------------------------------------------- */

  const SOME_CONF = 10

  /*  GLOBALS
  ----------------------------------------------- */

  let someGlobal = 0
  

  /*  CONSTRUCTION
  ----------------------------------------------- */

  function init () {
    setupParameters()
    setupEventListeners()
  }

  function setupParameters () {
    buildDomElementsObject()
    buildStateObject()
  }

  function setupEventListeners () {
  }

  /*  SETUP
  ----------------------------------------------- */

  function buildDomElementsObject () {
    selectors.forEach(selector => {
      domElements[selector] = setupElementParameters(selector)
    })
  }


  function buildStateObject () {
  }

  /*  GAME ENGINE
  ----------------------------------------------- */

  function applyClassChange ({ element, classChange: { add, remove } }) {
    element.classList.add(add)
    element.classList.remove(remove)
  }

  function applyContentChange ({ element, animationValues }) {
    element.textContent = animationValues.percent
  }

  function applyStyleChanges ({ element, animationValues }) {
    const {
      rotate = 0,
      translateX = 0,
      translateY = 0,
      opacity = 1,
      scaleX = 1,
      scaleY = 1,
      fontSize = ''
    } = animationValues
    const rotateString = `rotate(${rotate}deg)`
    const translateString = `translate3d(${translateX}px, ${translateY}px, 0px)`
    const scaleString = `scale3D(${scaleX}, ${scaleY}, 1)`
    element.style.opacity = opacity
    element.style.transform =
      rotateString +
      ' ' +
      translateString +
      ' ' +
      scaleString
    if (fontSize) {
      element.style.fontSize = fontSize + 'rem'
    }
  }

  /*  HELPERS
  ----------------------------------------------- */

  function debounce (func, delay) {
    let inDebounce
    return function () {
      clearTimeout(inDebounce)
      inDebounce = setTimeout(() => { func() }, delay)
    }
  }

  function flushCss(element) {
    element.offsetHeight
  }

  function throttle(func, limit) {
    let inThrottle = false
    return function () {
      if (!inThrottle) {
        func()
        inThrottle = true
        setTimeout(() => { inThrottle = false }, limit)
      }
    }
  }

  function vhToPx (vh) {
    return vh / 100 * lastScreenSize.height
  }

  function vwToPx (vw) {
    return vw / 100 * lastScreenSize.width
  }

  function inRange ({ limits: { low, high }, value }) {
    return value >= low && value <= high
  }

  function correctToRange ({ limits: { low, high }, value }) {
    if (value <= low) {
      return low
    } else if (value >= high) {
      return high
    } else {
      return value
    }
  }

  init()
}())

console.log(
  `Hi there! ${String.fromCodePoint(0x1F637)}`
)
