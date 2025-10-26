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
      gameInfoElement.innerHTML = '🎉 黒の勝ち！';
    } else if (counts.white > counts.black) {
      gameInfoElement.innerHTML = '🎉 白の勝ち！';
    } else {
      gameInfoElement.innerHTML = '引き分け！';
    }
  } else {
    const playerName = currentPlayer === BLACK ? '黒' : '白';
    gameInfoElement.innerHTML = `現在のターン: ${playerName}`;
  }
}

/**
 * ゲームをリセットする（HTMLのボタンから呼ばれる）
 */
function resetGame() {
  initializeGame();
}
