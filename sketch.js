// ゲーム設定
const BOARD_SIZE = 8; // ボードのサイズ（8×8）
const CELL_SIZE = 60; // セルのサイズ（ピクセル）
const EMPTY = 0;      // 空のマス
const BLACK = 1;      // 黒石
const WHITE = 2;      // 白石

// ゲーム状態
let board = [];           // ボードの状態を保持する2次元配列
let currentPlayer = BLACK; // 現在のプレイヤー（黒から始まる）
let gameOver = false;     // ゲーム終了フラグ

// CPU対戦設定
let gameMode = 'pvp';      // ゲームモード ('pvp': 人vs人, 'pvc': 人vsCPU)
let cpuLevel = 'normal';   // CPU難易度 ('easy': 簡単, 'normal': 普通, 'hard': 難しい)
let cpuPlayer = WHITE;     // CPUが操作するプレイヤー（白）
let isThinking = false;    // CPU思考中フラグ

// 8方向のベクトル（上、下、左、右、斜め4方向）
const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

/**
 * p5.jsの初期設定関数
 * ゲーム開始時に1度だけ実行される
 */
function setup() {
  // キャンバスを作成（ボードサイズに合わせる）
  createCanvas(BOARD_SIZE * CELL_SIZE, BOARD_SIZE * CELL_SIZE);

  // ゲームを初期化
  initializeGame();
}

/**
 * p5.jsの描画関数
 * フレームごとに繰り返し実行される
 */
function draw() {
  background(34, 139, 34); // 緑色の背景（オセロボード）

  // ボードを描画
  drawBoard();

  // 石を描画
  drawPieces();

  // ゲーム情報を更新
  updateGameInfo();

  // CPUのターンを実行
  executeCpuTurn();
}

/**
 * ゲームを初期化する
 */
function initializeGame() {
  // ボードを空で初期化
  board = [];
  for (let i = 0; i < BOARD_SIZE; i++) {
    board[i] = [];
    for (let j = 0; j < BOARD_SIZE; j++) {
      board[i][j] = EMPTY;
    }
  }

  // 初期配置（中央に白黒2個ずつ）
  const mid = BOARD_SIZE / 2;
  board[mid - 1][mid - 1] = WHITE;
  board[mid - 1][mid] = BLACK;
  board[mid][mid - 1] = BLACK;
  board[mid][mid] = WHITE;

  // ゲーム状態をリセット
  currentPlayer = BLACK;
  gameOver = false;
  isThinking = false;
}

/**
 * ボードのグリッドを描画する
 */
function drawBoard() {
  stroke(0);
  strokeWeight(2);

  // グリッド線を描画
  for (let i = 0; i <= BOARD_SIZE; i++) {
    // 縦線
    line(i * CELL_SIZE, 0, i * CELL_SIZE, height);
    // 横線
    line(0, i * CELL_SIZE, width, i * CELL_SIZE);
  }
}

/**
 * ボード上の石を描画する
 */
function drawPieces() {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];

      if (piece !== EMPTY) {
        // 石の中心座標を計算
        const x = col * CELL_SIZE + CELL_SIZE / 2;
        const y = row * CELL_SIZE + CELL_SIZE / 2;

        // 石の色を設定
        if (piece === BLACK) {
          fill(0);
        } else {
          fill(255);
        }

        // 石を描画（円）
        noStroke();
        circle(x, y, CELL_SIZE * 0.8);
      }
    }
  }

  // 置ける場所をハイライト表示
  highlightValidMoves();
}

/**
 * 置ける場所をハイライト表示する
 */
function highlightValidMoves() {
  if (gameOver) return;

  // CPU対戦モードでCPUのターンの場合はハイライトしない
  if (gameMode === 'pvc' && currentPlayer === cpuPlayer) return;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isValidMove(row, col, currentPlayer)) {
        const x = col * CELL_SIZE + CELL_SIZE / 2;
        const y = row * CELL_SIZE + CELL_SIZE / 2;

        // 半透明の円で表示
        fill(currentPlayer === BLACK ? 0 : 255, 100);
        noStroke();
        circle(x, y, CELL_SIZE * 0.3);
      }
    }
  }
}

/**
 * マウスクリック時の処理
 */
function mousePressed() {
  if (gameOver) return;

  // CPU対戦モードでCPUのターンの場合はクリックを無視
  if (gameMode === 'pvc' && currentPlayer === cpuPlayer) return;

  // CPUが思考中の場合はクリックを無視
  if (isThinking) return;

  // クリックされたセルの位置を計算
  const col = floor(mouseX / CELL_SIZE);
  const row = floor(mouseY / CELL_SIZE);

  // ボード範囲内かチェック
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return;
  }

  // 有効な手かチェック
  if (isValidMove(row, col, currentPlayer)) {
    // 石を置く
    placePiece(row, col, currentPlayer);

    // ターンを交代
    switchPlayer();

    // 次のプレイヤーが置ける場所がない場合
    if (!hasValidMoves(currentPlayer)) {
      switchPlayer(); // もう一度ターンを交代

      // 両プレイヤーとも置けない場合はゲーム終了
      if (!hasValidMoves(currentPlayer)) {
        gameOver = true;
      }
    }
  }
}

/**
 * 指定位置に石を置けるかチェックする
 */
function isValidMove(row, col, player) {
  // すでに石がある場合は無効
  if (board[row][col] !== EMPTY) {
    return false;
  }

  // 8方向をチェック
  for (let dir of directions) {
    if (canFlipInDirection(row, col, dir[0], dir[1], player)) {
      return true;
    }
  }

  return false;
}

/**
 * 指定方向に石を裏返せるかチェックする
 */
function canFlipInDirection(row, col, dRow, dCol, player) {
  const opponent = player === BLACK ? WHITE : BLACK;
  let r = row + dRow;
  let c = col + dCol;
  let hasOpponent = false;

  // 指定方向に進む
  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
    if (board[r][c] === EMPTY) {
      return false; // 空マスに到達したら無効
    }

    if (board[r][c] === opponent) {
      hasOpponent = true; // 相手の石を発見
    } else if (board[r][c] === player) {
      return hasOpponent; // 自分の石で挟めた
    }

    r += dRow;
    c += dCol;
  }

  return false;
}

/**
 * 石を置いて、挟んだ石を裏返す
 */
function placePiece(row, col, player) {
  board[row][col] = player;

  // 8方向をチェックして裏返す
  for (let dir of directions) {
    if (canFlipInDirection(row, col, dir[0], dir[1], player)) {
      flipInDirection(row, col, dir[0], dir[1], player);
    }
  }
}

/**
 * 指定方向の石を裏返す
 */
function flipInDirection(row, col, dRow, dCol, player) {
  const opponent = player === BLACK ? WHITE : BLACK;
  let r = row + dRow;
  let c = col + dCol;

  while (board[r][c] === opponent) {
    board[r][c] = player; // 石を裏返す
    r += dRow;
    c += dCol;
  }
}

/**
 * プレイヤーを交代する
 */
function switchPlayer() {
  currentPlayer = currentPlayer === BLACK ? WHITE : BLACK;
}

/**
 * 指定プレイヤーが置ける場所があるかチェック
 */
function hasValidMoves(player) {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isValidMove(row, col, player)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 石の数を数える
 */
function countPieces() {
  let blackCount = 0;
  let whiteCount = 0;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === BLACK) {
        blackCount++;
      } else if (board[row][col] === WHITE) {
        whiteCount++;
      }
    }
  }

  return { black: blackCount, white: whiteCount };
}

/**
 * ゲーム情報を更新する（HTML要素を更新）
 */
function updateGameInfo() {
  const counts = countPieces();
  const gameInfoElement = document.getElementById('gameInfo');
  const scoreElement = document.getElementById('score');

  // スコア表示
  scoreElement.innerHTML = `黒: ${counts.black} | 白: ${counts.white}`;

  // ゲーム状態表示
  if (gameOver) {
    if (counts.black > counts.white) {
      gameInfoElement.innerHTML = '黒の勝ち！';
    } else if (counts.white > counts.black) {
      gameInfoElement.innerHTML = '白の勝ち！';
    } else {
      gameInfoElement.innerHTML = '引き分け！';
    }
  } else {
    const playerName = currentPlayer === BLACK ? '黒' : '白';

    // CPU対戦モードでCPUのターンの場合
    if (gameMode === 'pvc' && currentPlayer === cpuPlayer) {
      if (isThinking) {
        gameInfoElement.innerHTML = `CPUが思考中... (${playerName})`;
      } else {
        gameInfoElement.innerHTML = `CPUのターン (${playerName})`;
      }
    } else if (gameMode === 'pvc') {
      gameInfoElement.innerHTML = `あなたのターン (${playerName})`;
    } else {
      gameInfoElement.innerHTML = `現在のターン: ${playerName}`;
    }
  }
}

/**
 * ゲームをリセットする（HTMLのボタンから呼ばれる）
 */
function resetGame() {
  initializeGame();
}

/**
 * ゲームモードを設定する（HTMLから呼ばれる）
 */
function setGameMode(mode) {
  gameMode = mode;
  initializeGame();
}

/**
 * CPU難易度を設定する（HTMLから呼ばれる）
 */
function setCpuLevel(level) {
  cpuLevel = level;
}

/**
 * すべての有効な手を取得する
 */
function getValidMoves(player) {
  const moves = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isValidMove(row, col, player)) {
        moves.push({ row, col });
      }
    }
  }
  return moves;
}

/**
 * 指定位置に石を置いた場合に裏返せる石の数を数える
 */
function countFlips(row, col, player) {
  let count = 0;
  for (let dir of directions) {
    if (canFlipInDirection(row, col, dir[0], dir[1], player)) {
      count += countFlipsInDirection(row, col, dir[0], dir[1], player);
    }
  }
  return count;
}

/**
 * 指定方向で裏返せる石の数を数える
 */
function countFlipsInDirection(row, col, dRow, dCol, player) {
  const opponent = player === BLACK ? WHITE : BLACK;
  let r = row + dRow;
  let c = col + dCol;
  let count = 0;

  while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
    if (board[r][c] === EMPTY) {
      return 0;
    }
    if (board[r][c] === opponent) {
      count++;
    } else if (board[r][c] === player) {
      return count;
    }
    r += dRow;
    c += dCol;
  }
  return 0;
}

/**
 * ボード上の位置の評価値を返す
 * 角は最も価値が高く、角の隣は価値が低い
 */
function getPositionValue(row, col) {
  // 位置評価テーブル（オセロの定石）
  const positionValues = [
    [100, -20,  10,   5,   5,  10, -20, 100],
    [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
    [ 10,  -2,   5,   1,   1,   5,  -2,  10],
    [  5,  -2,   1,   0,   0,   1,  -2,   5],
    [  5,  -2,   1,   0,   0,   1,  -2,   5],
    [ 10,  -2,   5,   1,   1,   5,  -2,  10],
    [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
    [100, -20,  10,   5,   5,  10, -20, 100]
  ];
  return positionValues[row][col];
}

/**
 * CPU思考：簡単レベル（ランダム）
 */
function cpuThinkEasy(player) {
  const moves = getValidMoves(player);
  if (moves.length === 0) return null;

  // ランダムに選択
  const randomIndex = floor(random(moves.length));
  return moves[randomIndex];
}

/**
 * CPU思考：普通レベル（多く取れる手を優先）
 */
function cpuThinkNormal(player) {
  const moves = getValidMoves(player);
  if (moves.length === 0) return null;

  let bestMove = null;
  let maxFlips = -1;

  for (let move of moves) {
    const flips = countFlips(move.row, move.col, player);

    // 角は特に優先
    if (getPositionValue(move.row, move.col) >= 100) {
      return move;
    }

    if (flips > maxFlips) {
      maxFlips = flips;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * CPU思考：難しいレベル（位置評価と取得数を考慮）
 */
function cpuThinkHard(player) {
  const moves = getValidMoves(player);
  if (moves.length === 0) return null;

  let bestMove = null;
  let maxScore = -Infinity;

  for (let move of moves) {
    const flips = countFlips(move.row, move.col, player);
    const posValue = getPositionValue(move.row, move.col);

    // スコア = 位置評価値 + 取得石数 * 2
    const score = posValue + flips * 2;

    if (score > maxScore) {
      maxScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

/**
 * CPUの手を決定する
 */
function decideCpuMove() {
  if (cpuLevel === 'easy') {
    return cpuThinkEasy(cpuPlayer);
  } else if (cpuLevel === 'normal') {
    return cpuThinkNormal(cpuPlayer);
  } else if (cpuLevel === 'hard') {
    return cpuThinkHard(cpuPlayer);
  }
  return null;
}

/**
 * CPUのターンを実行する
 */
function executeCpuTurn() {
  if (isThinking || gameOver) return;
  if (gameMode !== 'pvc') return;
  if (currentPlayer !== cpuPlayer) return;

  isThinking = true;

  // 少し遅延させて考えている感を出す
  setTimeout(() => {
    const move = decideCpuMove();

    if (move) {
      // 石を置く
      placePiece(move.row, move.col, cpuPlayer);

      // ターンを交代
      switchPlayer();

      // 次のプレイヤーが置ける場所がない場合
      if (!hasValidMoves(currentPlayer)) {
        switchPlayer();

        // 両プレイヤーとも置けない場合はゲーム終了
        if (!hasValidMoves(currentPlayer)) {
          gameOver = true;
        }
      }
    }

    isThinking = false;
  }, 500); // 0.5秒の遅延
}
