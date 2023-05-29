'use strict'

const WALL = 'WALL'
const FLOOR = 'FLOOR'
const BALL = 'BALL'
const GLUE = 'GLUE'
const GAMER = 'GAMER'

const GAMER_IMG = '<img src="img/gamer.png">'
const GLUED_GAMER_IMG = '<img src="img/gamer-purple.png">'
const BALL_IMG = '<img src="img/ball.png">'
const GLUE_IMG = '<img src="img/candy.png">'

// Model:
var gBoard
var gGamerPos
var gIsGameOn
var gIsGamerGlued
var gCollectedBallsCount
var gBallsOnBoardCount
var gBallInterval
var gGlueInterval

function onInitGame() {
  gGamerPos = { i: 2, j: 9 }
  gIsGameOn = true
  gIsGamerGlued = false
  gCollectedBallsCount = 0
  gBallsOnBoardCount = 2

  gBoard = buildBoard()
  renderBoard(gBoard)

  gBallInterval = setInterval(addBall, 5000)
  gGlueInterval = setInterval(addGlue, 5000)

  var elModal = document.querySelector('.modal')
  elModal.style.display = 'none'
  var elEatBallsCount = document.querySelector('.balls-count span')
  elEatBallsCount.innerText = gCollectedBallsCount
}

function buildBoard() {
  // Put FLOOR everywhere and WALL at edges
  const rowCount = 10
  const colCount = 12
  const board = []
  for (var i = 0; i < rowCount; i++) {
    board[i] = []
    for (var j = 0; j < colCount; j++) {
      board[i][j] = { type: FLOOR, gameElement: null }
      if (i === 0 || i === rowCount - 1 || j === 0 || j === colCount - 1) {
        board[i][j].type = WALL
      }
    }
  }

  // Passages
  board[0][5].type = FLOOR
  board[rowCount - 1][5].type = FLOOR
  board[5][0].type = FLOOR
  board[5][colCount - 1].type = FLOOR

  // Place the gamer and two balls
  board[gGamerPos.i][gGamerPos.j].gameElement = GAMER
  board[5][5].gameElement = BALL
  board[7][2].gameElement = BALL

  return board
}

// Render the board to an HTML table
function renderBoard(board) {
  console.log('board', board)
  var strHTML = ''
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>'
    for (var j = 0; j < board[0].length; j++) {
      const currCell = board[i][j]
      var cellClass = getClassName({ i: i, j: j }) + ' ' // 'cell-0-0 '
      cellClass += (currCell.type === WALL) ? 'wall' : 'floor' // 'cell-0-0 wall'

      strHTML += `<td class="cell ${cellClass}" 
                      onclick="moveTo(${i},${j})" >`

      if (currCell.gameElement === GAMER) {
        strHTML += GAMER_IMG // <img src="img/gamer.png">
      } else if (currCell.gameElement === BALL) {
        strHTML += BALL_IMG
      }
      strHTML += '</td>'
    }
    strHTML += '</tr>'
  }
  const elBoard = document.querySelector('.board')
  elBoard.innerHTML = strHTML
}

// Move the player to a specific location
function moveTo(i, j) {
  console.log('i , j', i, j)
  if (!gIsGameOn || gIsGamerGlued) return

  // Another option for Handling passages from onHandleKey
  // if (i === -1) i = gBoard.length - 1
  // else if (i === gBoard.length) i = 0
  // else if (j === -1) j = gBoard[0].length - 1
  // else if (j === gBoard[0].length) j = 0

  const targetCell = gBoard[i][j]
  if (targetCell.type === WALL) return

  // Calculate distance to make sure we are moving to a neighbor cell
  const iAbsDiff = Math.abs(i - gGamerPos.i)
  const jAbsDiff = Math.abs(j - gGamerPos.j)
  console.log('iAbsDiff', iAbsDiff)
  console.log('jAbsDiff', jAbsDiff)

  // If the clicked Cell is one of the four allowed
  if ((iAbsDiff === 1 && jAbsDiff === 0) ||
    (jAbsDiff === 1 && iAbsDiff === 0) ||
    iAbsDiff === gBoard.length - 1 ||
    jAbsDiff === gBoard[0].length - 1) { // Handling passages from onclick

    if (targetCell.gameElement === BALL) handleBall()
    else if (targetCell.gameElement === GLUE) handleGlue()

    // Move the gamer - remove from prev pos
    // update Model
    gBoard[gGamerPos.i][gGamerPos.j].gameElement = null
    // update DOM
    renderCell(gGamerPos, '')

    // Move to next pos
    // update Model
    // gGamerPos = { i: i, j: j }
    gGamerPos = { i, j }
    gBoard[gGamerPos.i][gGamerPos.j].gameElement = GAMER
    // update DOM
    const gamerImg = (gIsGamerGlued) ? GLUED_GAMER_IMG : GAMER_IMG
    renderCell(gGamerPos, gamerImg)
    countGamerNegs()
  }


}

function handleBall() {
  // model
  gCollectedBallsCount++
  gBallsOnBoardCount--
  // dom
  const elEatBallsCount = document.querySelector('.balls-count span')
  elEatBallsCount.innerText = gCollectedBallsCount

  playSound()
  checkVictory()
}

function handleGlue() {
  gIsGamerGlued = true

  setTimeout(() => {
    gIsGamerGlued = false
    renderCell(gGamerPos, GAMER_IMG)
  }, 3000);
}

function addBall() {
  const emptyPos = getEmptyPos()
  if (!emptyPos) return

  gBoard[emptyPos.i][emptyPos.j].gameElement = BALL
  renderCell(emptyPos, BALL_IMG)

  gBallsOnBoardCount++
  countGamerNegs()
}

function addGlue() {
  const emptyPos = getEmptyPos()
  if (!emptyPos) return

  gBoard[emptyPos.i][emptyPos.j].gameElement = GLUE
  renderCell(emptyPos, GLUE_IMG)

  setTimeout(removeGlue, 3000, emptyPos)
}

function removeGlue(gluePos) {
  if (gBoard[gluePos.i][gluePos.j].gameElement === GAMER) return

  gBoard[gluePos.i][gluePos.j].gameElement = null;
  renderCell(gluePos, '');
}

function getEmptyPos() {
  const emptyPoss = []
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (gBoard[i][j].type !== WALL && !gBoard[i][j].gameElement) {
        emptyPoss.push({ i, j }) // {i:1,j:3}
      }
    }
  }
  var randIdx = getRandomInt(0, emptyPoss.length)
  return emptyPoss[randIdx]
}

function checkVictory() {
  if (gBallsOnBoardCount === 0) {
    gameOver()
  }
}

function gameOver() {
  gIsGameOn = false
  clearInterval(gBallInterval)
  clearInterval(gGlueInterval)
  var elModal = document.querySelector('.modal')
  elModal.style.display = 'block'

}

function countGamerNegs() {
  var ballsCount = 0;
  for (var i = gGamerPos.i - 1; i <= gGamerPos.i + 1; i++) {
    if (i < 0 || i >= gBoard.length) continue;
    for (var j = gGamerPos.j - 1; j <= gGamerPos.j + 1; j++) {
      if (j < 0 || j >= gBoard[i].length) continue;
      if (i === gGamerPos.i && j === gGamerPos.j) continue;
      var currCell = gBoard[i][j]
      if (currCell.gameElement === BALL) ballsCount++;
    }
  }
  var elNgsCount = document.querySelector('.negs-count span')
  elNgsCount.innerText = ballsCount
}

// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(location, value) {
  const cellSelector = '.' + getClassName(location) // .cell-i-j
  const elCell = document.querySelector(cellSelector)
  elCell.innerHTML = value
}

// Returns the class name for a specific cell
function getClassName(location) {
  const cellClass = 'cell-' + location.i + '-' + location.j
  return cellClass
}

// Move the player by keyboard arrows
function onHandleKey(event) {
  const i = gGamerPos.i
  const j = gGamerPos.j

  switch (event.key) {
    case 'ArrowLeft':
      // Handling passages
      if (j === 0) moveTo(i, gBoard[0].length - 1)
      else moveTo(i, j - 1)
      break
    case 'ArrowRight':
      if (j === gBoard[0].length - 1) moveTo(i, 0)
      else moveTo(i, j + 1)
      break
    case 'ArrowUp':
      if (i === 0) moveTo(gBoard.length - 1, j)
      else moveTo(i - 1, j)
      break
    case 'ArrowDown':
      if (i === gBoard.length - 1) moveTo(0, j)
      else moveTo(i + 1, j)
      break
  }
}

function playSound() {
  const sound = new Audio('sound/sound.mp4')
  sound.play()
}
