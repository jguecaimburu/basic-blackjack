'use strict';

const BJ = (function () {

  /*  CONFIGURATION VALUES
  ----------------------------------------------- */

  const DECK_QUANTITY = 1
  
  const SUITS = [
    {name: 'spades', aceUnicode: 0x1F0A1 },
    {name: 'hearts', aceUnicode: 0x1F0B1 },
    {name: 'diamonds', aceUnicode: 0x1F0C1 },
    {name: 'clubs:', aceUnicode: 0x1F0D1 }
  ]
  
  const RANKS = [
    {figure: 'A', value: {soft: 1, hard: 11}, aceIndex: 0},
    {figure: '2', value: { soft: 2, hard: 2}, aceIndex: 1 },
    {figure: '3', value: { soft: 3, hard: 3}, aceIndex: 2 },
    {figure: '4', value: { soft: 4, hard: 4}, aceIndex: 3 },
    {figure: '5', value: { soft: 5, hard: 5}, aceIndex: 4 },
    {figure: '6', value: { soft: 6, hard: 6}, aceIndex: 5 },
    {figure: '7', value: { soft: 7, hard: 7}, aceIndex: 6 },
    {figure: '8', value: { soft: 8, hard: 8}, aceIndex: 7 },
    {figure: '9', value: { soft: 9, hard: 9}, aceIndex: 8 },
    {figure: '10', value: { soft: 10, hard: 10}, aceIndex: 9 },
    {figure: 'J', value: { soft: 10, hard: 10}, aceIndex: 10 },
    // aceIndex 11 gets unicode for rank C
    {figure: 'Q', value: { soft: 10, hard: 10}, aceIndex: 12 },
    {figure: 'K', value: { soft: 10, hard: 10}, aceIndex: 13 },
  ]



  /*  GLOBALS
  ----------------------------------------------- */

  const gameState = {}
  

  /*  CONSTRUCTION
  ----------------------------------------------- */

  function init () {
    configureState()
    // setupEventListeners()
    
  }

  
  /*  SETUP
  ----------------------------------------------- */
  
  function configureState () {
    gameState.dealer = createDealer()
  }

  function createDealer () {
    const cards = []
    addDecksToCards()
    // shuffleCards()

    function addDecksToCards () {
      for (let i = 0; i < DECK_QUANTITY; i++) {
        addDeck()
      }
    }

    function addDeck () {
      for (const suit of SUITS) {
        addSuit(suit)
      }
    }

    function addSuit (suit) {
      for (const rank of RANKS) {
        let card = createCard(suit, rank)
        cards.push(card)
      }
    }

    function createCard (suit, rank) {
      return {
        suit: suit.name,
        rank: rank.figure,
        value: rank.value,
        symbol: getCardSymbol(suit, rank)
      }
    }

    function getCardSymbol (suit, rank) {
      return String.fromCodePoint(suit.aceUnicode + rank.aceIndex)
    }


    // function shuffleDeck () {

    // }

    // function deal () {

    // }

    // return {
    //   deal
    // }
  }

  // function setupEventListeners () {
  // }

  // function buildDomElementsObject () {
  //   selectors.forEach(selector => {
  //     domElements[selector] = setupElementParameters(selector)
  //   })
  // }


  // function buildStateObject () {
  // }

  /*  GAME ENGINE
  ----------------------------------------------- */

  // function applyClassChange ({ element, classChange: { add, remove } }) {
  //   element.classList.add(add)
  //   element.classList.remove(remove)
  // }

  // function applyContentChange ({ element, animationValues }) {
  //   element.textContent = animationValues.percent
  // }

  // function applyStyleChanges ({ element, animationValues }) {
  //   const {
  //     rotate = 0,
  //     translateX = 0,
  //     translateY = 0,
  //     opacity = 1,
  //     scaleX = 1,
  //     scaleY = 1,
  //     fontSize = ''
  //   } = animationValues
  //   const rotateString = `rotate(${rotate}deg)`
  //   const translateString = `translate3d(${translateX}px, ${translateY}px, 0px)`
  //   const scaleString = `scale3D(${scaleX}, ${scaleY}, 1)`
  //   element.style.opacity = opacity
  //   element.style.transform =
  //     rotateString +
  //     ' ' +
  //     translateString +
  //     ' ' +
  //     scaleString
  //   if (fontSize) {
  //     element.style.fontSize = fontSize + 'rem'
  //   }
  // }

  /*  HELPERS
  ----------------------------------------------- */

  // function debounce (func, delay) {
  //   let inDebounce
  //   return function () {
  //     clearTimeout(inDebounce)
  //     inDebounce = setTimeout(() => { func() }, delay)
  //   }
  // }

  // function flushCss(element) {
  //   element.offsetHeight
  // }

  // function throttle(func, limit) {
  //   let inThrottle = false
  //   return function () {
  //     if (!inThrottle) {
  //       func()
  //       inThrottle = true
  //       setTimeout(() => { inThrottle = false }, limit)
  //     }
  //   }
  // }

  // function vhToPx (vh) {
  //   return vh / 100 * lastScreenSize.height
  // }

  // function vwToPx (vw) {
  //   return vw / 100 * lastScreenSize.width
  // }

  // function inRange ({ limits: { low, high }, value }) {
  //   return value >= low && value <= high
  // }

  // function correctToRange ({ limits: { low, high }, value }) {
  //   if (value <= low) {
  //     return low
  //   } else if (value >= high) {
  //     return high
  //   } else {
  //     return value
  //   }
  // }

  init()
  return gameState
}())

console.log(
  `Hi there! ${String.fromCodePoint(0x1F637)}`
)
