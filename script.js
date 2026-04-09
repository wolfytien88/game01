const gameSelect = document.getElementById('gameSelect');
const gameTitle = document.getElementById('gameTitle');
const gamePanelMine = document.getElementById('gamePanelMinesweeper');
const gamePanelGalaxian = document.getElementById('gamePanelGalaxian');

const boardElement = document.getElementById('board');
const remainingMinesElement = document.getElementById('remainingMines');
const gameStatusElement = document.getElementById('gameStatus');
const restartButton = document.getElementById('restartButton');
const sizePicker = document.getElementById('sizePicker');
const minePicker = document.getElementById('minePicker');

const galaxianBoard = document.getElementById('galaxianBoard');
const galaxianScoreElement = document.getElementById('galaxianScore');
const galaxianLivesElement = document.getElementById('galaxianLives');
const galaxianStatusElement = document.getElementById('galaxianStatus');
const galaxianStartButton = document.getElementById('galaxianStartButton');

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

const galaxianRows = 12;
const galaxianCols = 10;
let galaxianCells = [];
let galaxianScore = 0;
let galaxianLives = 3;
let galaxianActive = false;
let galaxianPlayerPos = 5;
let galaxianEnemies = [];
let galaxianBullets = [];
let galaxianEnemyBullets = [];
let galaxianGameInterval = null;
let galaxianEnemyMoveDirection = 1;
let galaxianEnemyMoveDown = false;

function updateGameView() {
  const gameMap = {
    minesweeper: '踩地雷',
    galaxian: 'Galaxian 小蜜蜂',
  };

  gameTitle.textContent = gameMap[currentGame] || '遊戲選單';
  gamePanelMine.style.display = currentGame === 'minesweeper' ? 'block' : 'none';
  gamePanelGalaxian.style.display = currentGame === 'galaxian' ? 'block' : 'none';
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

function initializeGalaxianGame() {
  galaxianCells = Array.from({ length: galaxianRows }, () => Array.from({ length: galaxianCols }, () => ({
    type: 'empty', // 'player', 'enemy', 'bullet', 'enemy-bullet'
  })));
  galaxianBoard.style.gridTemplateColumns = `repeat(${galaxianCols}, minmax(0, 1fr))`;
  galaxianScoreElement.textContent = galaxianScore;
  galaxianLivesElement.textContent = galaxianLives;
  updateGalaxianStatus('準備中');
  renderGalaxianBoard();
}

function renderGalaxianBoard() {
  galaxianBoard.innerHTML = '';
  for (let r = 0; r < galaxianRows; r++) {
    for (let c = 0; c < galaxianCols; c++) {
      const cellData = galaxianCells[r][c];
      const cell = document.createElement('div');
      cell.className = 'galaxian-cell';
      cell.dataset.row = r;
      cell.dataset.col = c;

      if (cellData.type === 'player') {
        cell.classList.add('player');
        cell.textContent = '🚀';
      } else if (cellData.type === 'enemy') {
        cell.classList.add('enemy');
        cell.textContent = '🐝';
      } else if (cellData.type === 'bullet') {
        cell.classList.add('bullet');
        cell.textContent = '•';
      } else if (cellData.type === 'enemy-bullet') {
        cell.classList.add('enemy-bullet');
        cell.textContent = '•';
      }

      galaxianBoard.appendChild(cell);
    }
  }
}

function updateGalaxianStatus(message) {
  galaxianScoreElement.textContent = galaxianScore;
  galaxianLivesElement.textContent = galaxianLives;
  galaxianStatusElement.textContent = message;
}

function startGalaxianGame() {
  stopGalaxianIntervals();
  galaxianScore = 0;
  galaxianLives = 3;
  galaxianActive = true;
  galaxianPlayerPos = 5;
  galaxianEnemies = [];
  galaxianBullets = [];
  galaxianEnemyBullets = [];
  galaxianEnemyMoveDirection = 1;
  galaxianEnemyMoveDown = false;

  // Initialize enemies
  for (let r = 1; r <= 3; r++) {
    for (let c = 1; c < galaxianCols - 1; c++) {
      galaxianEnemies.push({ r, c });
    }
  }

  updateGalaxianStatus('遊戲進行中');
  renderGalaxianBoard();

  galaxianGameInterval = setInterval(() => {
    if (!galaxianActive) return;
    updateGalaxianGame();
    renderGalaxianBoard();
  }, 500);

  // Handle keyboard input
  document.addEventListener('keydown', handleGalaxianKey);
}

function stopGalaxianIntervals() {
  clearInterval(galaxianGameInterval);
  galaxianGameInterval = null;
  document.removeEventListener('keydown', handleGalaxianKey);
}

function handleGalaxianKey(event) {
  if (!galaxianActive) return;
  if (event.key === 'ArrowLeft' && galaxianPlayerPos > 0) {
    galaxianPlayerPos -= 1;
  } else if (event.key === 'ArrowRight' && galaxianPlayerPos < galaxianCols - 1) {
    galaxianPlayerPos += 1;
  } else if (event.key === ' ') {
    event.preventDefault();
    shootGalaxianBullet();
  }
}

function shootGalaxianBullet() {
  galaxianBullets.push({ r: galaxianRows - 1, c: galaxianPlayerPos });
}

function updateGalaxianGame() {
  // Clear cells
  galaxianCells.forEach(row => row.forEach(cell => cell.type = 'empty'));

  // Place player
  galaxianCells[galaxianRows - 1][galaxianPlayerPos].type = 'player';

  // Move enemies
  let moveDown = false;
  galaxianEnemies.forEach(enemy => {
    enemy.c += galaxianEnemyMoveDirection;
    if (enemy.c <= 0 || enemy.c >= galaxianCols - 1) {
      moveDown = true;
    }
  });

  if (moveDown) {
    galaxianEnemyMoveDirection *= -1;
    galaxianEnemies.forEach(enemy => enemy.r += 1);
  }

  // Place enemies
  galaxianEnemies.forEach(enemy => {
    if (enemy.r >= 0 && enemy.r < galaxianRows && enemy.c >= 0 && enemy.c < galaxianCols) {
      galaxianCells[enemy.r][enemy.c].type = 'enemy';
    }
  });

  // Move bullets
  galaxianBullets = galaxianBullets.filter(bullet => {
    bullet.r -= 1;
    if (bullet.r >= 0) {
      galaxianCells[bullet.r][bullet.c].type = 'bullet';
      return true;
    }
    return false;
  });

  // Move enemy bullets
  galaxianEnemyBullets = galaxianEnemyBullets.filter(bullet => {
    bullet.r += 1;
    if (bullet.r < galaxianRows) {
      galaxianCells[bullet.r][bullet.c].type = 'enemy-bullet';
      return true;
    }
    return false;
  });

  // Check collisions
  galaxianBullets.forEach(bullet => {
    galaxianEnemies.forEach((enemy, index) => {
      if (enemy.r === bullet.r && enemy.c === bullet.c) {
        galaxianEnemies.splice(index, 1);
        galaxianScore += 10;
        bullet.r = -1; // Mark for removal
      }
    });
  });

  galaxianBullets = galaxianBullets.filter(bullet => bullet.r >= 0);

  // Enemy shoot
  if (Math.random() < 0.1 && galaxianEnemies.length > 0) {
    const randomEnemy = galaxianEnemies[Math.floor(Math.random() * galaxianEnemies.length)];
    galaxianEnemyBullets.push({ r: randomEnemy.r, c: randomEnemy.c });
  }

  // Check player hit
  galaxianEnemyBullets.forEach(bullet => {
    if (bullet.r === galaxianRows - 1 && bullet.c === galaxianPlayerPos) {
      galaxianLives -= 1;
      if (galaxianLives <= 0) {
        endGalaxianGame(false);
      } else {
        updateGalaxianStatus('被擊中！');
      }
      bullet.r = galaxianRows; // Mark for removal
    }
  });

  galaxianEnemyBullets = galaxianEnemyBullets.filter(bullet => bullet.r < galaxianRows);

  // Check win
  if (galaxianEnemies.length === 0) {
    endGalaxianGame(true);
  }

  // Check lose
  if (galaxianEnemies.some(enemy => enemy.r >= galaxianRows - 1)) {
    endGalaxianGame(false);
  }
}

function endGalaxianGame(won) {
  galaxianActive = false;
  stopGalaxianIntervals();
  if (won) {
    updateGalaxianStatus('你贏了！所有敵人被消滅！');
  } else {
    updateGalaxianStatus('遊戲結束！');
  }
  renderGalaxianBoard();
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

galaxianStartButton.addEventListener('click', () => {
  currentGame = 'galaxian';
  gameSelect.value = 'galaxian';
  updateGameView();
  startGalaxianGame();
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
initializeGalaxianGame();