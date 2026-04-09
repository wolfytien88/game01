const gameSelect = document.getElementById('gameSelect');
const gameTitle = document.getElementById('gameTitle');
const gamePanelMine = document.getElementById('gamePanelMinesweeper');
const gamePanelBee = document.getElementById('gamePanelBee');

const boardElement = document.getElementById('board');
const remainingMinesElement = document.getElementById('remainingMines');
const gameStatusElement = document.getElementById('gameStatus');
const restartButton = document.getElementById('restartButton');
const sizePicker = document.getElementById('sizePicker');
const minePicker = document.getElementById('minePicker');

const beeBoard = document.getElementById('beeBoard');
const beeScoreElement = document.getElementById('beeScore');
const beeTimerElement = document.getElementById('beeTimer');
const beeStatusElement = document.getElementById('beeStatus');
const beeStartButton = document.getElementById('beeStartButton');
const beeTargetElement = document.getElementById('beeTarget');

let currentGame = gameSelect.value;

let board = [];
let rows = 9;
let cols = 9;
let totalMines = 10;
let remainingMines = 10;
let gameOver = false;
let openedCount = 0;

const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

const beeRows = 5;
const beeCols = 9;
const beeWaveBees = 6;
const beeTarget = 10;
let beeCells = [];
let beeScore = 0;
let beeTimer = 25;
let beeActive = false;
let beeMoveInterval = null;
let beeTimerInterval = null;

function updateGameView() {
  const gameMap = {
    minesweeper: '踩地雷',
    bee: '小蜜蜂抓抓樂',
  };

  gameTitle.textContent = gameMap[currentGame] || '遊戲選單';
  gamePanelMine.style.display = currentGame === 'minesweeper' ? 'block' : 'none';
  gamePanelBee.style.display = currentGame === 'bee' ? 'block' : 'none';
}

function createBoard() {
  board = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({
    mine: false,
    flagged: false,
    open: false,
    count: 0,
  })));

  const minePositions = new Set();
  while (minePositions.size < totalMines) {
    const index = Math.floor(Math.random() * rows * cols);
    minePositions.add(index);
  }

  minePositions.forEach(index => {
    const r = Math.floor(index / cols);
    const c = index % cols;
    board[r][c].mine = true;
  });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      directions.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) {
          count += 1;
        }
      });
      board[r][c].count = count;
    }
  }
}

function renderBoard() {
  boardElement.innerHTML = '';
  boardElement.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellData = board[r][c];
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', handleCellClick);
      cell.addEventListener('contextmenu', handleCellRightClick);

      if (cellData.open) {
        cell.classList.add('open');
        if (cellData.mine) {
          cell.classList.add('mine');
          cell.textContent = '💣';
        } else if (cellData.count > 0) {
          cell.textContent = cellData.count;
          cell.dataset.count = cellData.count;
        }
      } else if (cellData.flagged) {
        cell.classList.add('flagged');
        cell.textContent = '🚩';
      }

      boardElement.appendChild(cell);
    }
  }
}

function handleCellClick(event) {
  if (gameOver) return;
  const button = event.currentTarget;
  const r = Number(button.dataset.row);
  const c = Number(button.dataset.col);
  const cellData = board[r][c];

  if (cellData.open || cellData.flagged) return;

  openCell(r, c);
  renderBoard();
  updateStatus();
}

function handleCellRightClick(event) {
  event.preventDefault();
  if (gameOver) return;
  const button = event.currentTarget;
  const r = Number(button.dataset.row);
  const c = Number(button.dataset.col);
  const cellData = board[r][c];

  if (cellData.open) return;
  cellData.flagged = !cellData.flagged;
  remainingMines += cellData.flagged ? -1 : 1;
  renderBoard();
  updateCounter();
}

function openCell(r, c) {
  const cellData = board[r][c];
  if (cellData.open || cellData.flagged) return;
  cellData.open = true;
  openedCount += 1;

  if (cellData.mine) {
    gameOver = true;
    revealMines();
    gameStatusElement.textContent = '遊戲結束，踩到地雷！';
    return;
  }

  if (cellData.count === 0) {
    directions.forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        openCell(nr, nc);
      }
    });
  }
}

function revealMines() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) {
        board[r][c].open = true;
      }
    }
  }
  renderBoard();
}

function updateCounter() {
  remainingMinesElement.textContent = Math.max(0, remainingMines);
}

function updateStatus() {
  if (gameOver) return;
  const totalCells = rows * cols;
  if (openedCount >= totalCells - totalMines) {
    gameOver = true;
    gameStatusElement.textContent = '你贏了！恭喜通關！';
    return;
  }
  gameStatusElement.textContent = '進行中';
}

function resetGame() {
  rows = Number(sizePicker.value);
  cols = Number(sizePicker.value);
  totalMines = Number(minePicker.value);
  remainingMines = totalMines;
  gameOver = false;
  openedCount = 0;
  gameStatusElement.textContent = '尚未開始';
  remainingMinesElement.textContent = remainingMines;
  createBoard();
  renderBoard();
}

function initializeBeeGame() {
  beeCells = Array.from({ length: beeRows }, () => Array.from({ length: beeCols }, () => ({
    hasBee: false,
  })));
  beeBoard.style.gridTemplateColumns = `repeat(${beeCols}, minmax(0, 1fr))`;
  beeTargetElement.textContent = beeTarget;
  updateBeeStatus('準備中');
  renderBeeBoard();
}

function placeBees() {
  beeCells.forEach(row => row.forEach(cell => { cell.hasBee = false; }));
  const placed = new Set();
  while (placed.size < beeWaveBees) {
    const index = Math.floor(Math.random() * beeRows * beeCols);
    if (placed.has(index)) continue;
    placed.add(index);
    const r = Math.floor(index / beeCols);
    const c = index % beeCols;
    beeCells[r][c].hasBee = true;
  }
}

function renderBeeBoard() {
  beeBoard.innerHTML = '';
  for (let r = 0; r < beeRows; r++) {
    for (let c = 0; c < beeCols; c++) {
      const cellData = beeCells[r][c];
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'bee-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', handleBeeClick);

      if (cellData.hasBee && !beeActive) {
        cell.classList.add('caught');
        cell.textContent = '🐝';
      }

      beeBoard.appendChild(cell);
    }
  }
}

function handleBeeClick(event) {
  if (!beeActive) return;
  const button = event.currentTarget;
  const r = Number(button.dataset.row);
  const c = Number(button.dataset.col);
  const cellData = beeCells[r][c];

  if (!cellData.hasBee) return;

  cellData.hasBee = false;
  beeScore += 1;
  updateBeeStatus('抓到小蜜蜂！');
  renderBeeBoard();

  if (beeScore >= beeTarget) {
    endBeeGame(true);
  }
}

function updateBeeStatus(message) {
  beeScoreElement.textContent = beeScore;
  beeTimerElement.textContent = beeTimer;
  beeStatusElement.textContent = message;
}

function startBeeGame() {
  stopBeeIntervals();
  beeScore = 0;
  beeTimer = 25;
  beeActive = true;
  updateBeeStatus('遊戲進行中');
  placeBees();
  renderBeeBoard();

  beeTimerInterval = setInterval(() => {
    beeTimer -= 1;
    if (beeTimer <= 0) {
      endBeeGame(false);
      return;
    }
    updateBeeStatus('遊戲進行中');
  }, 1000);

  beeMoveInterval = setInterval(() => {
    if (!beeActive) return;
    placeBees();
    renderBeeBoard();
  }, 1200);
}

function endBeeGame(won) {
  beeActive = false;
  stopBeeIntervals();
  if (won) {
    updateBeeStatus('你贏了！抓到足夠的小蜜蜂！');
  } else {
    if (beeTimer <= 0) {
      updateBeeStatus('時間到，遊戲結束！');
    } else {
      updateBeeStatus('遊戲已停止');
    }
  }
  renderBeeBoard();
}

function stopBeeIntervals() {
  clearInterval(beeMoveInterval);
  clearInterval(beeTimerInterval);
  beeMoveInterval = null;
  beeTimerInterval = null;
}

gameSelect.addEventListener('change', event => {
  currentGame = event.target.value;
  updateGameView();
});

restartButton.addEventListener('click', () => {
  resetGame();
  currentGame = 'minesweeper';
  gameSelect.value = 'minesweeper';
  updateGameView();
});

beeStartButton.addEventListener('click', () => {
  currentGame = 'bee';
  gameSelect.value = 'bee';
  updateGameView();
  startBeeGame();
});

sizePicker.addEventListener('change', () => {
  const size = Number(sizePicker.value);
  if (size === 9) minePicker.value = '10';
  else if (size === 12) minePicker.value = '20';
  else minePicker.value = '35';
});

minePicker.addEventListener('change', () => {
  const mines = Number(minePicker.value);
  totalMines = mines;
  remainingMines = mines;
});

updateGameView();
resetGame();
initializeBeeGame();
