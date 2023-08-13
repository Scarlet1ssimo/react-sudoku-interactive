export interface SudokuState {
  Fillin: string;
  Candid?: string;
}

export function computeError(board: number[][]) {
  const ErrorCell = new Set<number>([]);
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; ++j) {
      if (board[i][j] === 0) continue
      for (let k = 0; k < 9; ++k) {
        if (k !== j && board[i][j] === board[i][k]) {
          ErrorCell.add(i * 9 + j)
          ErrorCell.add(i * 9 + k)
        }
        if (k !== i && board[i][j] === board[k][j]) {
          ErrorCell.add(i * 9 + j)
          ErrorCell.add(k * 9 + j)
        }
      }
      const rs = Math.floor(i / 3) * 3, cs = Math.floor(j / 3) * 3
      for (let k = 0; k < 3; ++k)
        for (let l = 0; l < 3; ++l) {
          if (rs + k !== i && cs + l !== j && board[i][j] === board[rs + k][cs + l]) {
            ErrorCell.add(i * 9 + j)
            ErrorCell.add((rs + k) * 9 + cs + l)
          }
        }
    }
  }
  return ErrorCell
}

export function DrawSudoku(clue: string, state: SudokuState, selection: number[], SideNumber: number[], drawOptions: { affected: boolean, affectedSameNumber: boolean }) {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  canvas.width = 1000;
  canvas.height = 1000;
  canvas.style.width = "500px";
  canvas.style.height = "500px";
  const cellSize = 50;
  const dpi = window.devicePixelRatio;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.scale(dpi, dpi);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const primary = '#8ed9e6'
  const secondary = '#d2f0f5'
  const error = '#da4167'


  const fillRect = (r: number, c: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(cellSize * c + cellSize / 2, cellSize * r + cellSize / 2, cellSize, cellSize);
  }
  const encode = (r: number, c: number) => r * 9 + c

  const board = getBoardFrom(clue, state.Fillin)

  // Draw the selection, and the affected cells
  // also extracts the numbers in the selection
  const highlightNumber = new Set<number>([]);
  const PrimaryCell = new Set<number>([]);
  const SecondaryCell = new Set<number>([]);
  const ErrorCell = computeError(board);

  SideNumber.forEach((v, i) => { if (v === 1) highlightNumber.add(i + 1) })
  const fillSecondary = (row: number, col: number) => {
    for (let i = 0; i < 9; i++) {
      if (i !== col) SecondaryCell.add(encode(row, i))
      if (i !== row) SecondaryCell.add(encode(i, col))
    }
    const rs = Math.floor(row / 3) * 3, cs = Math.floor(col / 3) * 3
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        if (rs + i !== row || cs + j !== col) SecondaryCell.add(encode(rs + i, cs + j))
      }
  }

  selection.forEach((v) => {
    const row = Math.floor(v / 9)
    const col = v % 9
    if (board[row][col]) {
      highlightNumber.add(board[row][col])
      if (drawOptions.affected && !drawOptions.affectedSameNumber) fillSecondary(row, col)
      PrimaryCell.add(v)
    } else {
      SecondaryCell.add(v)
    }
  })

  // Highlight the cells with the same number
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++) {
      if (highlightNumber.has(board[i][j])) {
        fillRect(i, j, primary)
        if (drawOptions.affected && drawOptions.affectedSameNumber) fillSecondary(i, j)
      }
    }

  // Finally compute error



  SecondaryCell.forEach((v) => {
    const row = Math.floor(v / 9)
    const col = v % 9
    fillRect(row, col, secondary)
  })
  PrimaryCell.forEach((v) => {
    const row = Math.floor(v / 9)
    const col = v % 9
    fillRect(row, col, primary)
  })
  ErrorCell.forEach((v) => {
    const row = Math.floor(v / 9)
    const col = v % 9
    fillRect(row, col, error)
  })


  // Draw the Sudoku board
  // DrawLine
  ctx.fillStyle = 'black'
  for (let x = 0; x <= 9; x++) {
    ctx.beginPath();
    if (x % 3 === 0) {
      ctx.lineWidth = 2;
    } else {
      ctx.lineWidth = 1;
    }
    ctx.moveTo(x * cellSize + cellSize / 2, cellSize / 2);
    ctx.lineTo(x * cellSize + cellSize / 2, cellSize * 9.5);
    ctx.moveTo(cellSize / 2, x * cellSize + cellSize / 2);
    ctx.lineTo(cellSize * 9.5, x * cellSize + cellSize / 2);
    ctx.stroke();
  }

  // Fill in the clue numbers
  ctx.font = '30px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let x = 0; x < 9; x++) {
    for (let y = 0; y < 9; y++) {
      if (clue[9 * x + y] !== '.') {
        ctx.fillStyle = "black"
        ctx.fillText(clue[9 * x + y], y * cellSize + cellSize, x * cellSize + cellSize);
      } else if (state.Fillin[9 * x + y] !== '.') {
        ctx.fillStyle = '#0091A7'
        ctx.fillText(state.Fillin[9 * x + y], y * cellSize + cellSize, x * cellSize + cellSize);
      }
    }
  }

}

export function getBoardFrom(clue: string, state: string) {
  const board: number[][] = []
  for (let i = 0; i < 9; i++) {
    board.push([])
    for (let j = 0; j < 9; j++) {
      board[i].push(parseInt(clue[i * 9 + j]))
      if (isNaN(board[i][j])) board[i][j] = parseInt(state[i * 9 + j])
    }
  }
  return board
}

export function getOccurence(Clue: string, State: SudokuState) {
  const occurence = Array(9).fill(0)
  Clue.split('').forEach((v, i) => { if (v !== '.') occurence[parseInt(v) - 1]++ })
  State.Fillin.split('').forEach((v, i) => { if (Clue[i] === '.' && v !== '.') occurence[parseInt(v) - 1]++ })
  return occurence
}