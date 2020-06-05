'use strict';

const BJ = (function () {

  /*  CONFIGURATION VALUES
  ----------------------------------------------- */

  const DECK_QUANTITY = 8
  const MIN_CARDS_TO_RESHUFFLE = 50
  
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

  const HOUSE_PLAYER_ID = 0
  const PLAYER_ID = 1
  const DEALING_ID = -1
  
  const DOM_SELECTORS = {
    hand: {
      containerPrefix: '.hand--player-',
      cardContainer: '.hand__card',
      receivedCard: '.hand__card--received',
      discardedCard: '.hand__card--discarded'
    },
    card: {
      basic: '.hand__card-content',
      frontRed: '.hand__card--red',
      frontBlack: '.hand__card--black',
      back: '.hand__card--back'
    },
    buttons: {
      hit: '.btn--hit',
      stand: '.btn--stand',
      nextRound: 'btn--deal'
    }
  }
    
  

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

  /*  HOUSE
  ----------------------------------------------- */

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
    
    // Hit on soft 17 rule is applied
    function checkPlayerState ({ id, handSums, done }) {
      if (!isRoundActive) return ;
      savePlayerSums({ id, handSums })
      if (!done) {
        if (playerHasSoft21(id, handSums)) {
          return playerStands({ sum: 21, id })
        } 
        if (handSums.soft <= 7) return playerActive({ sum: handSums.soft, id })
        if (handSums.soft <= 11) return playerActive({ sum: handSums.hard, id })
        if (handSums.soft < 21) return playerActive({ sum: handSums.soft, id })
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

    function playerHasSoft21 (id, handSums) {
      return turn === PLAYER_ID &&
        id === PLAYER_ID &&
        (handSums.soft === 21 || handSums.hard === 21) 
    }
    
    function playerActive ({ sum, id }) {
      if (isHouse(id) && isHouseTurn()) continueHouseHand(sum)
    }
    
    
    function isHouseTurn () {
      return turn === HOUSE_PLAYER_ID
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
        askHousePlayerToFlipCard()
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
      askHousePlayerToFlipCard()
      continueHouseHand(playerSums[HOUSE_PLAYER_ID].soft)
    }

    function takePlayingControl () {
      turn = HOUSE_PLAYER_ID
    }

    function askHousePlayerToFlipCard () {
      players[HOUSE_PLAYER_ID].flipSecondCard()
    }
    
    function finishRound () {
      checkWinner()
      deactivateRound()
    }

    function checkWinner() {
      if (playerSums[PLAYER_ID].soft > 21) return console.log('House wins')
      const houseSum = getBestSum(playerSums[HOUSE_PLAYER_ID])
      if (houseSum > 21) return console.log('Player wins')
      const playerSum = getBestSum(playerSums[PLAYER_ID])
      if (playerSum > houseSum) {
        console.log('Player wins!')
      } else if (playerSum < houseSum) {
        console.log('House wins!')
      } else {
        console.log("It's a push!")
      }
    }

    function getBestSum (playerSum) {
      return playerSum.hard <= 21 ?
        playerSum.hard :
        playerSum.soft
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

  /*  DEALER
  ----------------------------------------------- */
  
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
  
  /*  CARD
  ----------------------------------------------- */
  
  function createCard (suit, rank) {
    const data = {
      suit: suit.name,
      rank: rank.figure,
      value: rank.value,
      symbol: getCardSymbol(suit, rank)
    }

    function createElement () {
      let cardElement = document.createElement('div')
      let cardContent = document.createTextNode(data.symbol)
      cardElement.appendChild(cardContent)
      cardElement.classList.add(DOM_SELECTORS.card.basic.slice(1))
      return cardElement
    }
    
    function getValue () {
      return { ... data.value }
    }

    function getFrontSelector () {
      return (suit.name === 'spades' || suit.name === 'clubs') ?
        DOM_SELECTORS.card.frontBlack :
        DOM_SELECTORS.card.frontRed
    }

    function getCardSymbol (suit, rank) {
      return String.fromCodePoint(suit.aceUnicode + rank.aceIndex)
    }
    
    return {
      createElement,
      value: getValue(),
      frontSelector: getFrontSelector()
    }

  }
  
  
  /*  PLAYER
  ----------------------------------------------- */
  
  function createPlayer (id) {
    const hand = createHand(id)
    let house
    
    function getID () {
      return id
    }

    function addHouse (playerHouse) {
      house = playerHouse
    }
    
    function hit () {
      askForCard()
      sendStateToHouse()
    }
    
    function stand () {
      const done = true
      sendStateToHouse(done)
    }

    function flipSecondCard () {
      hand.flipSecondCard()
    }
    
    function nextRound () {
      house.startNextRound()
    }
    
    function emptyHand () {
      hand.empty()
    }

    function askForCard () {
      const newCard = house.dealCard()
      newCard && hand.addCard(newCard)
    }
    
    function sendStateToHouse (done = false) {
      house.checkPlayerState({
        id,
        handSums: hand.sums(),
        done
      })
    }
    
    return {
      id: getID(),
      addHouse,
      hit,
      stand,
      flipSecondCard,
      nextRound,
      emptyHand
    }
  }
  
  /*  HAND
  ----------------------------------------------- */
  
  function createHand (id) {
    const cards = []
    let handSums = { soft: 0, hard: 0 }
    const domContainer = selectDomContainer(id)
    
    function addCard (card) {
      cards.push(card)
      updateHandSums()
      renderNew(card)
      
      // EREASE OR CHANGE
      console.log('player', id, ...cards.map(card => card.symbol))
      //
    }
    
    function sums () {
      return { ...handSums }
    }

    function flipSecondCard () {
      const secondCard = cards.slice(-1)[0]
      const secondCardElement = domContainer.lastChild.firstChild
      const secondCardFrontClass = secondCard.frontSelector.slice(1)
      secondCardElement.classList.replace(
        DOM_SELECTORS.card.back.slice(1),
        secondCardFrontClass
      )
    }
    
    function empty () {
      emptyCards()
      emptyDomContainer()
    }
    
    function selectDomContainer (id) {
      return document.querySelector(DOM_SELECTORS.hand.containerPrefix + id)
    }
    
    function updateHandSums () {
      handSums = cards.reduce((sums, card) => {
        for (const type in card.value) {
          sums[type] += card.value[type]
        }
        return sums
      }, { soft: 0, hard: 0 })
    }
    
    function renderNew (card) {
      const newCardElement = getAndStyleCardElement(card)
      const wrappedCard = wrapCardElement(newCardElement)
      wrappedCard.classList.add(DOM_SELECTORS.hand.receivedCard.slice(1))
      domContainer.appendChild(wrappedCard)
    }
    
    function getAndStyleCardElement (card) {
      const newCardElement = card.createElement()
      const newCardClass = defineNewCardClass(card)
      newCardElement.classList.add(newCardClass)
      return newCardElement
    }

    function wrapCardElement (cardElement) {
      const cardContainer = document.createElement('li')
      cardContainer.appendChild(cardElement)
      cardContainer.classList.add(DOM_SELECTORS.hand.cardContainer.slice(1))
      return cardContainer
    } 
    
    function defineNewCardClass (card) {
      if (isHouse(id) && cards.length === 2) {
        return DOM_SELECTORS.card.back.slice(1)
      }
      else {
        return card.frontSelector.slice(1)
      }
    }

    function emptyCards () {
      cards.splice(0, cards.length)
    }

    function emptyDomContainer () {
      while (domContainer.lastChild) {
        domContainer.lastChild.classList.replace(
          DOM_SELECTORS.hand.receivedCard.slice(1),
          DOM_SELECTORS.hand.discardedCard.slice(1)
        )
        domContainer.removeChild(element.lastChild);
      }
    }
    
    return {
      addCard,
      sums,
      flipSecondCard,
      empty
    }
  }

  /*  HELPERS
  ----------------------------------------------- */
  
  function isHouse (id) {
    return id === HOUSE_PLAYER_ID
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

  init()
  return gameState
}())

console.log('Vegas bb!')
