'use strict';

const BJ = (function () {

  /*  CONFIGURATION VALUES
  ----------------------------------------------- */

  const DECK_QUANTITY = 8
  const MIN_CARDS_TO_RESHUFFLE = 50
  
  const SUITS = [
    {name: 'spades', unicode: 0x2660 },
    {name: 'hearts', unicode: 0x2665 },
    {name: 'diamonds', unicode: 0x2666 },
    {name: 'clubs', unicode: 0x2663 }
  ]
  
  const RANKS = [
    {figure: 'A', value: {soft: 1, hard: 11} },
    {figure: '2', value: { soft: 2, hard: 2} },
    {figure: '3', value: { soft: 3, hard: 3} },
    {figure: '4', value: { soft: 4, hard: 4} },
    {figure: '5', value: { soft: 5, hard: 5} },
    {figure: '6', value: { soft: 6, hard: 6} },
    {figure: '7', value: { soft: 7, hard: 7} },
    {figure: '8', value: { soft: 8, hard: 8} },
    {figure: '9', value: { soft: 9, hard: 9} },
    {figure: '10', value: { soft: 10, hard: 10} },
    {figure: 'J', value: { soft: 10, hard: 10} },
    {figure: 'Q', value: { soft: 10, hard: 10} },
    {figure: 'K', value: { soft: 10, hard: 10} }
  ]

  // CSS hand selectors depend on these ids
  const HOUSE_PLAYER_ID = 0
  const PLAYER_ID = 1
  const DEALER_ID = -1
  
  const DOM_SELECTORS = {
    house: {
      message: '.house-message'
    },
    hand: {
      containerPrefix: '.hand--player-',
      cardsStack: '.hand__cards-stack',
      sumsDisplay: '.hand__sums-display',
      cardContainer: '.hand__card',
      receivedCard: '.hand__card--received',
      discardedCard: '.hand__card--discarded'
    },
    card: {
      content: '.hand__card-content',
      flex: '.hand__card-flex',
      data: '.hand__card-data',
      frontRed: '.hand__card--red',
      frontBlack: '.hand__card--black',
      back: '.hand__card--back'
    },
    buttons: {
      hit: '.btn--hit',
      stand: '.btn--stand',
      nextRound: '.btn--deal'
    }
  }

  const BTN_THROTTLE_TIME_MS = 400
  const AUTO_DEALING_DELAY_MS = 600
  let AUTO_HIT_IN_THROTTLE = false    
  

  /*  GLOBALS
  ----------------------------------------------- */

  const gameState = {}
  let house
  let dealer
  let housePlayer
  let player
  let gameInterface

  /*  CONSTRUCTION
  ----------------------------------------------- */

  function init () {
    buildGameObjects()
    buildGameInterface()
    connectInterface()
  }

  
  /*  BUILD GAME OBJECTS
  ----------------------------------------------- */
  
  function buildGameObjects () {
    house = createHouse()
    dealer = createDealer(DEALER_ID)
    housePlayer = createPlayer({
      id: HOUSE_PLAYER_ID,
      isHousePlayer: true
    })
    player = createPlayer({
      id: PLAYER_ID,
      isHousePlayer: false
    })
    house.addDealer(dealer)
    house.addPlayer(housePlayer)
    house.addPlayer(player)
  }

  /*  BUILD GAME INTERFACE
  ----------------------------------------------- */

  function buildGameInterface () {
    gameInterface = createInterface()
  }

  /*  CONNECT INTERFACE
  ----------------------------------------------- */

  function connectInterface () {
    house.addInterface(gameInterface)
    house.connectInterface()
  }

  /*  GAME OBJECT FACTORIES
  ----------------------------------------------- */

  /*  HOUSE
  ----------------------------------------------- */

  function createHouse () {
    const HOUSE_PLAYER_ROLE = 'house'
    const PLAYER_ROLE = 'player'
    const DEALER_ROLE = 'dealer'
    
    const roles = {}
    let dealer
    const players = {}
    
    const state = {
      turn: '',
      isRoundActive: false,
      playerSums: {}
    }

    const messageDisplayElement = selectMessageDisplay()
    let userInterface
    
    function addPlayer (player) {
      players[player.id] = player
      if (player.isHouse) {
        roles[HOUSE_PLAYER_ROLE] = player.id
      } else {
        roles[PLAYER_ROLE] = player.id
      }
      player.addHouse(this)
    }

    function addDealer (dealerObj) {
      dealer = dealerObj
      roles[DEALER_ROLE] = dealer.id
    }

    function addInterface (interfaceObject) {
      userInterface = interfaceObject
    }

    function connectInterface () {
      userInterface.connectPlayerToGameActions(
        players[roles[PLAYER_ROLE]]
      )
      userInterface.connectToNextRoundBtn(this)
    }
    
    function dealCard () {
      if (state.isRoundActive) return dealer.dealCard()
    }
    
    // Hit on soft 17 rule is applied
    function checkPlayerState ({ id, handSums, done }) {
      if (!state.isRoundActive) return ;
      savePlayerSums({ id, handSums })
      if (!done) {
        if (playerHasSoft21(id, handSums)) {
          return playerStands({ sum: 21, id })
        } 
        if (handSums.soft <= 7) return playerActive({ sum: handSums.soft, id })
        if (handSums.soft <= 11) return playerActive({ sum: handSums.hard, id })
        if (handSums.soft <= 21) return playerActive({ sum: handSums.soft, id })
        playerBust({ sum: handSums.soft, id })
      } else {
        playerStands({
          sum: handSums.hard <= 21 ? handSums.hard : handSums.soft,
          id
        })
      }
    }
    
    function startNextRound () {
      if (state.isRoundActive) return;
      clearMessageDisplay()
      askAllPlayersToHideSums()
      cleanTable()
      activateRound()
      takeDealingControl()
      prepareDealer()
      dealNewHand()
      checkBlackJack()
    }

    function selectMessageDisplay () {
      return document.querySelector(DOM_SELECTORS.house.message)
    }
    
    function savePlayerSums ({ id, handSums }) {
      state.playerSums[id] = handSums
    }

    function playerHasSoft21 (id, handSums) {
      return state.turn === PLAYER_ROLE &&
        (handSums.soft === 21 || handSums.hard === 21) 
    }
    
    function playerActive ({ sum, id }) {
      if (isHouse(id) && isHouseTurn()) continueHouseHand(sum)
    }
    
    
    function isHouseTurn () {
      return state.turn === HOUSE_PLAYER_ROLE
    }
    
    function isHouse (id) {
      return id === roles[HOUSE_PLAYER_ROLE]
    }
    
    function continueHouseHand (sum) {
      if (sum < 17) {
        players[roles[HOUSE_PLAYER_ROLE]].hit()
      } else {
        players[roles[HOUSE_PLAYER_ROLE]].stand()
      }
    }
    
    function playerBust ({ sum, id }) {
      if (isHouse(id)) {
        addMessageToDisplay('House busted. ')
        finishRound()
      } else {
        addMessageToDisplay('Player busted. ')
        hideGameActions()
        askHousePlayerToFlipCard()
        finishRound()
      }
    }

    function addMessageToDisplay (message) {
      messageDisplayElement.textContent += message 
    }
    
    function playerStands({ sum, id }) {
      if (isHouse(id)) {
        addMessageToDisplay(`House stands on ${sum}. `)
        finishRound()
      } else {
        addMessageToDisplay(`Player stands on ${sum}. `)
        startOwnHand()
      }
    }
    
    function startOwnHand () {
      takePlayingControl()
      askHousePlayerToFlipCard()
      continueHouseHand(getLastSoftSum(roles[HOUSE_PLAYER_ROLE]))
    }
    
    function takePlayingControl () {
      state.turn = HOUSE_PLAYER_ROLE
      askPlayerToShowSums(roles[HOUSE_PLAYER_ROLE])
      hideGameActions()
    }
    
    function askPlayerToShowSums (id) {
      players[id].showHandSums()
    }

    function hideGameActions () {
      userInterface.hideGameActions()
    }

    function askHousePlayerToFlipCard () {
      players[roles[HOUSE_PLAYER_ROLE]].flipSecondCard()
    }

    function getLastSoftSum (id) {
      return state.playerSums[id].soft
    }
    
    function finishRound () {
      askAllPlayersToShowSums()
      checkWinner()
      deactivateRound()
    }

    function askAllPlayersToShowSums () {
      for (const id of listPlayersIds()) {
        askPlayerToShowSums(id)
      }
    }
    
    function checkWinner() {
      if (getLastSoftSum(roles[PLAYER_ROLE]) > 21) {
        return addMessageToDisplay('House wins!')
      }
      const houseSum = getBestSum(state.playerSums[HOUSE_PLAYER_ID])
      if (houseSum > 21) return addMessageToDisplay('Player wins!')
      const playerSum = getBestSum(state.playerSums[PLAYER_ID])
      if (playerSum > houseSum) {
        addMessageToDisplay('Player wins!')
      } else if (playerSum < houseSum) {
        addMessageToDisplay('House wins!')
      } else {
        addMessageToDisplay("It's a push!")
      }
    }

    function getBestSum (playerSum) {
      return playerSum.hard <= 21 ?
        playerSum.hard :
        playerSum.soft
    }
    
    function deactivateRound () {
      state.isRoundActive = false
      showNextRoundBtn()
    }

    function showNextRoundBtn() {
      userInterface.showNextRoundBtn()
    }
    
    function clearMessageDisplay () {
      messageDisplayElement.textContent = ''
    }
    
    function askAllPlayersToHideSums () {
      for (const id of listPlayersIds()) {
        players[id].hideHandSums()
      }
    }

    function cleanTable () {
      for (let id = PLAYER_ID; id >= 0; id--) {
        players[id].emptyHand()
      }
    }
    
    function activateRound () {
      state.isRoundActive = true
      hideNextRoundBtn()
    }
    
    function hideNextRoundBtn () {
      userInterface.hideNextRoundBtn()
    }
    
    function takeDealingControl () {
      state.turn = DEALER_ROLE
    }

    
    function prepareDealer () {
      dealer.prepareForRound()
    }
    
    function dealNewHand () {
      for (let i = 1; i <= 2; i++) {
        for (const id of listPlayersIds()) {
          players[id].hit()
        }      
      }
    }

    // Player goes first in dealing and cleaning operations.
    function listPlayersIds () {
      return [roles[PLAYER_ROLE], roles[HOUSE_PLAYER_ROLE]]
    }
    
    function checkBlackJack () {
      for (const id of listPlayersIds()) {
        if (state.playerSums[id].hard === 21) {
          addMessageToDisplay('BlackJack! ')
          askHousePlayerToFlipCard()
          return finishRound()
        }
      }
      givePlayerControl()
    }
    
    function givePlayerControl () {
      state.turn = PLAYER_ROLE
      askPlayerToShowSums(roles[PLAYER_ROLE])
      showGameActions()
    }

    function showGameActions () {
      userInterface.showGameActions()
    }


    return {
      addPlayer,
      addDealer,
      addInterface,
      connectInterface,
      startNextRound,
      dealCard,
      checkPlayerState
    }
  }

  /*  DEALER
  ----------------------------------------------- */
  
  function createDealer (id) {
    const cards = []
    let reshuffle
    createNewCards()

    function getID() {
      return id
    }
    
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
      return topCard
    }
    
    return {
      id: getID(),
      dealCard,
      prepareForRound
    }
  }
  
  /*  CARD
  ----------------------------------------------- */
  
  function createCard (suit, rank) {
    const data = {
      suit: suit.name,
      suitSymbol: getCardSymbol(suit),
      rank: rank.figure,
      value: rank.value
    }

    function createElement () {
      const cardElement = document.createElement('div')
      const cardFlexElement = createCardFlexElement()
      cardElement.appendChild(cardFlexElement)
      cardElement.classList.add(DOM_SELECTORS.card.content.slice(1))
      return cardElement
    }
    
    function createCardFlexElement () {
      const cardFlex = document.createElement('div')
      const rankElement = createDataElement(data.rank)
      const suitElement = createDataElement(data.suitSymbol)
      cardFlex.appendChild(rankElement)
      cardFlex.appendChild(suitElement)
      cardFlex.classList.add(DOM_SELECTORS.card.flex.slice(1))
      return cardFlex
    }
    
    function createDataElement (text) {
      const cardDataElement = document.createElement('p')
      const dataNode = document.createTextNode(text)
      cardDataElement.appendChild(dataNode)
      cardDataElement.classList.add(DOM_SELECTORS.card.data.slice(1))
      return cardDataElement
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
      return String.fromCodePoint(suit.unicode)
    }
    
    return {
      createElement,
      value: getValue(),
      frontSelector: getFrontSelector()
    }

  }
  
  
  /*  PLAYER
  ----------------------------------------------- */
  
  function createPlayer ({ id, isHousePlayer }) {
    const hand = createHand(id, isHousePlayer)
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

    function showHandSums() {
      hand.showSums()
    }

    function hideHandSums() {
      hand.hideSums()
    }
    
    function emptyHand () {
      hand.empty()
    }

    function isHouse () {
      return isHousePlayer
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
      showHandSums,
      hideHandSums,
      emptyHand,
      isHouse: isHouse()
    }
  }
  
  /*  HAND
  ----------------------------------------------- */
  
  function createHand (id, isHouseHand = false) {
    const cards = []
    let handSums = { soft: 0, hard: 0 }
    
    const domContainer = selectDomContainer(id)
    const handElements = {}
    fillDomContainer()

    function addCard (card) {
      cards.push(card)
      updateHandSums(card)
      renderNew(card)
      displayNewSums()
    }
    
    function sums () {
      return { ...handSums }
    }

    function flipSecondCard () {
      const secondCard = cards.slice(-1)[0]
      const secondCardElement = handElements.cardsStack.lastChild.firstChild
      const secondCardFrontClass = secondCard.frontSelector.slice(1)
      secondCardElement.classList.replace(
        DOM_SELECTORS.card.back.slice(1),
        secondCardFrontClass
      )
    }

    function showSums () {
      handElements.sumsDisplay.style.display = 'block'
    }

    function hideSums() {
      handElements.sumsDisplay.style.display = 'none'
    }
    
    function empty () {
      emptyCards()
      resetSums()
      emptyCardsStackElement()
    }
    
    function selectDomContainer (id) {
      return document.querySelector(DOM_SELECTORS.hand.containerPrefix + id)
    }

    function fillDomContainer () {
      handElements.sumsDisplay = createSumsDisplayElement()
      handElements.cardsStack = createCardsStackElement()
      domContainer.appendChild(handElements.sumsDisplay)
      domContainer.appendChild(handElements.cardsStack)
    }

    function createSumsDisplayElement () {
      const sumsDisplayElement = document.createElement('p')
      const sumsTextNode = document.createTextNode('')
      sumsDisplayElement.classList.add(DOM_SELECTORS.hand.sumsDisplay.slice(1))
      sumsDisplayElement.appendChild(sumsTextNode)
      return sumsDisplayElement
    }

    function createCardsStackElement () {
      const cardsStackElement = document.createElement('ul')
      cardsStackElement.classList.add(DOM_SELECTORS.hand.cardsStack.slice(1))
      return cardsStackElement
    }

    function updateHandSums (card) {
      if (handSums.soft === handSums.hard) {
        for (const type in card.value) {
          handSums[type] += card.value[type]
        }
      } else {
        for (const type in handSums) {
          handSums[type] += card.value.soft
        }  
      }
    }
    
    function renderNew (card) {
      const newCardElement = getAndStyleCardElement(card)
      const wrappedCard = wrapCardElement(newCardElement)
      wrappedCard.classList.add(DOM_SELECTORS.hand.receivedCard.slice(1))
      handElements.cardsStack.appendChild(wrappedCard)
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
      if (isHouseHand && cards.length === 2) {
        return DOM_SELECTORS.card.back.slice(1)
      }
      else {
        return card.frontSelector.slice(1)
      }
    }

    function displayNewSums () {
      let sumsText
      if ((handSums.soft === handSums.hard) || handSums.hard > 21 ) {
        sumsText = `${handSums.soft}`
      } else {
        sumsText = `${handSums.soft} or ${handSums.hard}`
      }
      handElements.sumsDisplay.textContent = sumsText
    }

    function emptyCards () {
      cards.splice(0, cards.length)
    }

    function resetSums () {
      handSums = { soft: 0, hard: 0 }
    }

    function emptyCardsStackElement () {
      while (handElements.cardsStack.lastChild) {
        handElements.cardsStack.lastChild.classList.replace(
          DOM_SELECTORS.hand.receivedCard.slice(1),
          DOM_SELECTORS.hand.discardedCard.slice(1)
        )
        handElements.cardsStack.removeChild(handElements.cardsStack.lastChild);
      }
    }
    
    return {
      addCard,
      sums,
      flipSecondCard,
      showSums,
      hideSums,
      empty
    }
  }

  /*  INTERFACE FACTORY
  ----------------------------------------------- */

  function createInterface() {
    const btnElements = selectBtns()
    addKeyboardListeners()

    function connectPlayerToGameActions(player) {
      connectHit(player)
      connectStand(player)
    }

    function connectToNextRoundBtn(house) {
      btnElements.nextRoundBtn.addEventListener(
        'click',
        throttle(() => house.startNextRound(), BTN_THROTTLE_TIME_MS)
      )
    }

    function showGameActions() {
      btnElements.hitBtn.style.display = 'block'
      btnElements.standBtn.style.display = 'block'
    }

    function hideGameActions() {
      btnElements.hitBtn.style.display = 'none'
      btnElements.standBtn.style.display = 'none'
    }

    function showNextRoundBtn() {
      btnElements.nextRoundBtn.style.display = 'block'
    }

    function hideNextRoundBtn() {
      btnElements.nextRoundBtn.style.display = 'none'
    }

    function selectBtns() {
      const hitBtn = document.querySelector(DOM_SELECTORS.buttons.hit)
      const standBtn = document.querySelector(DOM_SELECTORS.buttons.stand)
      const nextRoundBtn = document.querySelector(DOM_SELECTORS.buttons.nextRound)
      return {
        hitBtn,
        standBtn,
        nextRoundBtn
      }
    }

    function addKeyboardListeners() {
      const aKeycode = 65
      const sKeycode = 83
      const dKeycode = 68

      document.onkeydown = throttle((e) => {
        e = e || window.event
        switch (e.keyCode) {
          case aKeycode:
            btnElements.hitBtn.click()
            break
          case sKeycode:
            btnElements.standBtn.click()
            break
          case dKeycode:
            btnElements.nextRoundBtn.click()
            break
        }
      }, BTN_THROTTLE_TIME_MS)
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

    function connectHit(player) {
      btnElements.hitBtn.addEventListener(
        'click',
        throttle(() => player.hit(), BTN_THROTTLE_TIME_MS)
      )
    }

    function connectStand(player) {
      btnElements.standBtn.addEventListener(
        'click',
        throttle(() => player.stand(), BTN_THROTTLE_TIME_MS)
      )
    }

    return {
      connectPlayerToGameActions,
      connectToNextRoundBtn,
      showGameActions,
      hideGameActions,
      showNextRoundBtn,
      hideNextRoundBtn
    }
  }

  /*  EXECUTION
  ----------------------------------------------- */
  
  init()

}())

console.log('Vegas bb!')
