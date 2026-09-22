// CONFIGURAÇÕES E ESTADO DO JOGO
const COLS = 9;
const ROWS = 6;
const TTT_SIZE = 9; // 3x3 = 9 casas

// Jogadores: 1 = P1 (Azul), 2 = P2 (Vermelho)
let currentPlayer = 1;

// Estado do Jogo da Velha (null, 1, ou 2)
let mainBoard = Array(TTT_SIZE).fill(null);
let activeCellIndex = 0; // Qual casa do Jogo da Velha está sendo jogada no mini-game

// Matriz do Mini-Game para a casa selecionada: 6 linhas x 9 colunas (0 = vazio, 1 = P1, 2 = P2)
let miniBoard = createEmptyMiniBoard();

// Combinações de vitória do Jogo da Velha (3x3)
const WINNING_COMBOS_TTT = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // Linhas
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // Colunas
  [0, 4, 8],
  [2, 4, 6], // Diagonais
];

// ELEMENTOS DO DOM
const mainGrid = document.getElementById('main-grid');
const connect4Grid = document.getElementById('connect4-grid');
const dropButtonsRow = document.getElementById('drop-buttons-row');
const activeCellLabel = document.getElementById('active-cell-label');
const cardP1 = document.getElementById('card-p1');
const cardP2 = document.getElementById('card-p2');
const turnBadge = document.getElementById('turn-badge');
const turnText = document.getElementById('turn-text');
const winnerModal = document.getElementById('winner-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const btnResetMini = document.getElementById('btn-reset-mini');
const btnResetGame = document.getElementById('btn-reset-game');
const btnModalRestart = document.getElementById('btn-modal-restart');

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
  initMainBoard();
  initMiniBoardUI();
  selectTTTCell(0); // Seleciona a primeira casa por padrão
  updateTurnUI();
});

function createEmptyMiniBoard() {
  return Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill(0));
}

// 1. INICIALIZAÇÃO DO TABULEIRO PRINCIPAL (JOGO DA VELHA 3x3)
function initMainBoard() {
  mainGrid.innerHTML = '';
  for (let i = 0; i < TTT_SIZE; i++) {
    const cell = document.createElement('div');
    cell.classList.add('ttt-cell');
    cell.dataset.index = i;
    cell.addEventListener('click', () => handleTTTCellClick(i));
    mainGrid.appendChild(cell);
  }
}

// Quando o jogador escolhe qual casa do Jogo da Velha disputar
function handleTTTCellClick(index) {
  if (mainBoard[index] !== null) return; // Casa já conquistada
  selectTTTCell(index);
}

function selectTTTCell(index) {
  activeCellIndex = index;
  activeCellLabel.textContent = `#${index + 1}`;

  // Atualiza destaque visual das células do Jogo da Velha
  const cells = mainGrid.querySelectorAll('.ttt-cell');
  cells.forEach((cell, idx) => {
    cell.classList.remove('selected');
    if (idx === index && mainBoard[idx] === null) {
      cell.classList.add('selected');
    }
  });

  // Reinicia o mini-game para a nova casa disputada
  resetMiniGame();
}

// 2. INICIALIZAÇÃO DO MINI-GAME (LIG 4 - 9x6)
function initMiniBoardUI() {
  // Criar Botões de Soltar Peça
  dropButtonsRow.innerHTML = '';
  for (let c = 0; c < COLS; c++) {
    const btn = document.createElement('button');
    btn.classList.add('btn-drop');
    btn.textContent = '↓';
    btn.dataset.col = c;
    btn.addEventListener('click', () => dropPiece(c));
    dropButtonsRow.appendChild(btn);
  }

  // Criar Grade de Retângulos (9 colunas x 6 linhas)
  connect4Grid.innerHTML = '';
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const rect = document.createElement('div');
      rect.classList.add('c4-rect');
      rect.dataset.row = r;
      rect.dataset.col = c;
      connect4Grid.appendChild(rect);
    }
  }
}

// LÓGICA DE SOLTAR A PEÇA NO MINI-GAME (Gravidade / Sem flutuar)
function dropPiece(col) {
  if (mainBoard[activeCellIndex] !== null) return; // Casa já finalizada

  // Procura de baixo para cima (da linha 5 até a 0) a primeira posição vaga
  let targetRow = -1;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (miniBoard[r][col] === 0) {
      targetRow = r;
      break;
    }
  }

  // Se a coluna estiver cheia, ignora
  if (targetRow === -1) return;

  // Registrar a jogada
  miniBoard[targetRow][col] = currentPlayer;
  updateMiniBoardUI();

  // Verificar se o jogador atual venceu o mini-game
  const winResult = checkMiniGameWin(targetRow, col, currentPlayer);

  if (winResult) {
    // Jogador conquistou a casa do Jogo da Velha!
    highlightWinningRects(winResult.winningCells);
    setTimeout(() => {
      claimTTTCell(activeCellIndex, currentPlayer);
    }, 400);
  } else if (isMiniBoardFull()) {
    // Empate no mini-game -> Reinicia mini-game
    setTimeout(() => {
      alert('Mini-game empatou! O tabuleiro do mini-game será reiniciado.');
      resetMiniGame();
    }, 300);
  } else {
    // Alternar jogador
    switchPlayer();
  }
}

function updateMiniBoardUI() {
  const rects = connect4Grid.querySelectorAll('.c4-rect');
  rects.forEach((rect) => {
    const r = parseInt(rect.dataset.row);
    const c = parseInt(rect.dataset.col);
    const val = miniBoard[r][c];

    rect.className = 'c4-rect'; // Reseta classes
    if (val === 1) rect.classList.add('p1');
    if (val === 2) rect.classList.add('p2');
  });

  // Atualizar estado dos botões de soltar se a coluna estiver cheia
  const dropBtns = dropButtonsRow.querySelectorAll('.btn-drop');
  dropBtns.forEach((btn, col) => {
    btn.disabled =
      miniBoard[0][col] !== 0 || mainBoard[activeCellIndex] !== null;
  });
}

// VERIFICAÇÃO DE VITÓRIA NO MINI-GAME (4 em linha)
function checkMiniGameWin(r, c, player) {
  const directions = [
    { dr: 0, dc: 1 }, // Horizontal
    { dr: 1, dc: 0 }, // Vertical
    { dr: 1, dc: 1 }, // Diagonal principal (\)
    { dr: 1, dc: -1 }, // Diagonal secundária (/)
  ];

  for (let d of directions) {
    let cells = [{ r, c }];

    // Checar no sentido positivo
    let step = 1;
    while (true) {
      let nr = r + d.dr * step;
      let nc = c + d.dc * step;
      if (
        nr >= 0 &&
        nr < ROWS &&
        nc >= 0 &&
        nc < COLS &&
        miniBoard[nr][nc] === player
      ) {
        cells.push({ r: nr, c: nc });
        step++;
      } else {
        break;
      }
    }

    // Checar no sentido negativo
    step = 1;
    while (true) {
      let nr = r - d.dr * step;
      let nc = c - d.dc * step;
      if (
        nr >= 0 &&
        nr < ROWS &&
        nc >= 0 &&
        nc < COLS &&
        miniBoard[nr][nc] === player
      ) {
        cells.push({ r: nr, c: nc });
        step++;
      } else {
        break;
      }
    }

    if (cells.length >= 4) {
      return { winningCells: cells };
    }
  }

  return null;
}

function highlightWinningRects(winningCells) {
  winningCells.forEach(({ r, c }) => {
    const rect = connect4Grid.querySelector(
      `.c4-rect[data-row="${r}"][data-col="${c}"]`
    );
    if (rect) rect.classList.add('winning-rect');
  });
}

function isMiniBoardFull() {
  return miniBoard[0].every((cell) => cell !== 0);
}

function resetMiniGame() {
  miniBoard = createEmptyMiniBoard();
  updateMiniBoardUI();
}

// CONQUISTA DE QUADRANTE NO JOGO DA VELHA
function claimTTTCell(cellIndex, player) {
  mainBoard[cellIndex] = player;
  const cellElem = mainGrid.querySelector(
    `.ttt-cell[data-index="${cellIndex}"]`
  );

  cellElem.classList.remove('selected');
  cellElem.classList.add(player === 1 ? 'p1-owner' : 'p2-owner', 'occupied');
  cellElem.textContent = player === 1 ? 'X' : 'O';

  // Verificar se o Jogo da Velha Principal foi vencido
  if (checkMainBoardWin(player)) {
    showWinnerModal(
      `Jogador ${player} (${
        player === 1 ? 'Azul' : 'Vermelho'
      }) venceu o Jogo da Velha!`
    );
    return;
  }

  if (isMainBoardFull()) {
    showWinnerModal('O Jogo da Velha terminou em Empate!');
    return;
  }

  // Se o jogo principal continuar, selecionar a próxima casa vazia disponível
  let nextCell = mainBoard.findIndex((val) => val === null);
  if (nextCell !== -1) {
    selectTTTCell(nextCell);
  }

  switchPlayer();
}

// VERIFICAÇÃO DE VITÓRIA NO JOGO DA VELHA
function checkMainBoardWin(player) {
  return WINNING_COMBOS_TTT.some((combo) => {
    return combo.every((idx) => mainBoard[idx] === player);
  });
}

function isMainBoardFull() {
  return mainBoard.every((cell) => cell !== null);
}

// GERENCIAMENTO DE TURNOS E UI
function switchPlayer() {
  currentPlayer = currentPlayer === 1 ? 2 : 1;
  updateTurnUI();
}

function updateTurnUI() {
  if (currentPlayer === 1) {
    cardP1.classList.add('active');
    cardP2.classList.remove('active');
    turnBadge.className = 'current-turn-badge p1';
    turnText.textContent = 'Jogador 1 (Azul)';
  } else {
    cardP2.classList.add('active');
    cardP1.classList.remove('active');
    turnBadge.className = 'current-turn-badge p2';
    turnText.textContent = 'Jogador 2 (Vermelho)';
  }
}

// MODAL E REINÍCIO COMPLETO DO JOGO
function showWinnerModal(message) {
  modalTitle.textContent = 'Fim de Jogo!';
  modalMessage.textContent = message;
  winnerModal.classList.add('active');
}

function resetFullGame() {
  mainBoard = Array(TTT_SIZE).fill(null);
  currentPlayer = 1;
  winnerModal.classList.remove('active');

  initMainBoard();
  selectTTTCell(0);
  updateTurnUI();
}

// EVENT LISTENERS
btnResetMini.addEventListener('click', resetMiniGame);
btnResetGame.addEventListener('click', resetFullGame);
btnModalRestart.addEventListener('click', resetFullGame);
