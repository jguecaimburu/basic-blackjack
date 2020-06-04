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

  const MIN_CARDS_TO_RESHUFFLE = 15 // DEFINE
  const HOUSE_PLAYER_ID = 0
  const PLAYER_ID = 1
  const DEALING_ID = -1


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
    gameState.house = createHouse()
    gameState.housePlayer = createPlayer(HOUSE_PLAYER_ID)
    gameState.player = createPlayer(PLAYER_ID)
    gameState.house.addPlayer(gameState.player)
    gameState.house.addPlayer(gameState.housePlayer)
  }

  function createHouse () {
    const dealer = createDealer()
    const players = {}
    const playerSums = {}
    let turn
    let isRoundActive
    
    function addPlayer (player) {
      players[player.id] = player
      player.addHouse(this)
    }
    
    function dealCard () {
      if (isRoundActive) return dealer.dealCard()
    }
    
    function checkPlayerState ({ id, handSums, done }) {
      if (!isRoundActive) return ;
      savePlayerSums({ id, handSums })
      if (!done) {
        if (handSums.soft <= 21) return playerActive({ sum: handSums.soft, id })
        if (handSums.hard <= 21) return playerActive({ sum: handSums.hard, id })
        playerBust({ sum: handSums.soft, id })
      } else {
        playerStands({
          sum: handSums.hard <= 21 ? handSums.hard : handSums.soft,
          id
        })
      }
    }
    
    function startNextRound () {
      if (isRoundActive) return;
      cleanTable()
      activateRound()
      takeDealingControl()
      prepareDealer()
      dealNewHand()
      checkBlackJack()
    }
    
    function savePlayerSums ({ id, handSums }) {
      playerSums[id] = handSums
    }
    
    function playerActive ({ sum, id }) {
      if (isHouse(id) && isHouseTurn()) continueHouseHand(sum)
    }
    
    function isHouse (id) {
      return !id
    }

    function isHouseTurn () {
      return !turn
    }
    
    function continueHouseHand (sum) {
      console.log('House is', sum)
      if (sum < 17) {
        players[HOUSE_PLAYER_ID].hit()
      } else {
        players[HOUSE_PLAYER_ID].stand()
      }
    }
    
    function playerBust ({ sum, id }) {
      if (isHouse(id)) {
        console.log(`House busted. Sum ${sum}`)
        finishRound()
      } else {
        console.log(`Player busted. Sum ${sum}`)
        finishRound()
      }
    }
    
    function playerStands({ sum, id }) {
      if (isHouse(id)) {
        console.log(`House stands on ${sum}`)
        finishRound()
      } else {
        console.log(`Player stands on ${sum}`)
        startOwnHand()
      }
    }
    
    function startOwnHand () {
      takePlayingControl()
      continueHouseHand(playerSums[HOUSE_PLAYER_ID].soft)
    }

    function takePlayingControl () {
      turn = HOUSE_PLAYER_ID
    }
    
    function finishRound () {
      checkWinner()
      deactivateRound()
    }

    function checkWinner() {
      if (playerSums[PLAYER_ID].soft > 21) return console.log('House wins')
      const houseSum = playerSums[HOUSE_PLAYER_ID].soft
      if (houseSum > 21) return console.log('Player wins')
      const playerSum = playerSums[PLAYER_ID].hard <= 21 ?
        playerSums[PLAYER_ID].hard :
        playerSums[PLAYER_ID].soft
      if (playerSum > houseSum) {
        console.log('Player wins!')
      } else if (playerSum < houseSum) {
        console.log('House wins!')
      } else {
        console.log("It's a push!")
      }
    }
    
    function deactivateRound () {
      isRoundActive = false
    }
    
    function cleanTable () {
      for (let id = PLAYER_ID; id >= 0; id--) {
        players[id].emptyHand()
      }
    }
    
    function activateRound () {
      isRoundActive = true
    }
    
    function takeDealingControl () {
      turn = DEALING_ID
    }
    
    function prepareDealer () {
      dealer.prepareForRound()
    }
    
    function dealNewHand () {
      for (let i = 1; i <= 2; i++) {
        for (let id = PLAYER_ID; id >= 0; id--) {
          players[id].hit()
        }
      }
    }
    
    function checkBlackJack () {
      for (let id = PLAYER_ID; id >= 0; id--) {
        if (playerSums[id].hard === 21) {
          console.log('BlackJack!')
          return finishRound()
        }
      }
      givePlayerControl()
    }

    function givePlayerControl () {
      turn = PLAYER_ID
    }
    
    return {
      addPlayer,
      dealCard,
      checkPlayerState,
      startNextRound
    }
  }
  
  function createDealer () {
    const cards = []
    let reshuffle
    createNewCards()
    
    function createNewCards () {
      emptyCards()
      addDecksToCards()
      shuffleCards()
    }
    
    function emptyCards () {
      cards.splice(0, cards.length)
    }
    
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
    
    // Durstenfeld version of the Fisher–Yates shuffle algorithm
    // Check https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
    function shuffleCards () {
      for (let i = cards.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1))
        let temp = cards[j]
        cards[j] = cards[i]
        cards[i] = temp
      }
      reshuffle = false
    }
    
    function prepareForRound () {
      if (reshuffle) {
        createNewCards()
      }
    }
    
    function dealCard () {
      let topCard = cards.pop()
      if (cards.length < MIN_CARDS_TO_RESHUFFLE) reshuffle = true
      // EREASE OR CHANGE
      console.log(cards.length)
      return topCard
    }
    
    return {
      dealCard,
      prepareForRound
    }
  }

  function createPlayer (id) {
    const hand = []
    let handSums = { soft: 0, hard: 0 }
    let house

    function addHouse (playerHouse) {
      house = playerHouse
    }

    function getID () {
      return id
    }

    function hit () {
      askForCard()
      updateHandSums()
      // EREASE OR CHANGE
      console.log('player', id, ...hand.map(card => card.symbol))
      //
      sendStateToHouse()

    }

    function askForCard () {
      const newCard = house.dealCard()
      newCard && hand.push(newCard)
    }

    function updateHandSums () {
      handSums = hand.reduce((sums, card) => {
        for (const type in card.value) {
          sums[type] += card.value[type]
        }
        return sums
      }, { soft: 0, hard: 0 })
    }

    function sendStateToHouse (done = false) {
      house.checkPlayerState({
        id,
        handSums,
        done
      })
    }

    function stand () {
      const done = true
      sendStateToHouse(done)
    }

    function nextRound () {
      house.startNextRound()
    }

    function emptyHand () {
      hand.splice(0, hand.length)
    }

    return {
      id: getID(),
      addHouse,
      hit,
      stand,
      nextRound,
      emptyHand
    }
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

console.log('Vegas bb!')
