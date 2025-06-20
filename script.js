document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const AI_DELAY_MS = 500;
    const BOARD_SIZE = 9;
    const PLAYER_X = 'X';
    const PLAYER_O = 'O';
    const CENTER_POSITION = 4;
    
    // DOM Elements
    const gameBoard = document.getElementById('gameBoard');
    const cells = document.querySelectorAll('.cell');
    const currentPlayerElement = document.getElementById('currentPlayer');
    const resetButton = document.getElementById('resetButton');
    const twoPlayerModeButton = document.getElementById('twoPlayerMode');
    const aiModeButton = document.getElementById('aiMode');
    
    let currentPlayer = 'X';
    let gameActive = true;
    let gameState = ['', '', '', '', '', '', '', '', ''];
    let isAIMode = false;
    let isAIThinking = false;
    
    const winningConditions = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];
    
    // Set up game mode buttons
    twoPlayerModeButton.addEventListener('click', () => {
        if (isAIMode) {
            isAIMode = false;
            twoPlayerModeButton.classList.add('active');
            aiModeButton.classList.remove('active');
            handleRestartGame();
        }
    });
    
    aiModeButton.addEventListener('click', () => {
        if (!isAIMode) {
            isAIMode = true;
            aiModeButton.classList.add('active');
            twoPlayerModeButton.classList.remove('active');
            handleRestartGame();
        }
    });
    
    function handleCellClick(clickedCellEvent) {
        const clickedCell = clickedCellEvent.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));
        
        if (gameState[clickedCellIndex] !== '' || !gameActive || isAIThinking) {
            return;
        }
        
        // Human player move
        handleCellPlayed(clickedCell, clickedCellIndex);
        
        if (!handleResultValidation()) {
            // If game is still active and in AI mode, make AI move
            if (isAIMode && currentPlayer === 'O') {
                isAIThinking = true;
                
                // Add a small delay to make the AI move feel more natural
                setTimeout(() => {
                    makeAIMove();
                    isAIThinking = false;
                }, 500);
            }
        }
    }
    
    function handleCellPlayed(clickedCell, clickedCellIndex) {
        gameState[clickedCellIndex] = currentPlayer;
        clickedCell.textContent = currentPlayer;
        clickedCell.classList.add(`cell-${currentPlayer.toLowerCase()}`);
    }
    
    function handleResultValidation() {
        let roundWon = false;
        
        for (let i = 0; i < winningConditions.length; i++) {
            const winCondition = winningConditions[i];
            const a = gameState[winCondition[0]];
            const b = gameState[winCondition[1]];
            const c = gameState[winCondition[2]];
            
            if (a === '' || b === '' || c === '') {
                continue;
            }
            
            if (a === b && b === c) {
                roundWon = true;
                break;
            }
        }
        
        if (roundWon) {
            if (isAIMode && currentPlayer === 'O') {
                currentPlayerElement.textContent = 'AIの勝利！';
            } else {
                currentPlayerElement.textContent = `プレイヤー${currentPlayer}の勝利！`;
            }
            currentPlayerElement.classList.add('winner');
            gameActive = false;
            return true;
        }
        
        const roundDraw = !gameState.includes('');
        if (roundDraw) {
            currentPlayerElement.textContent = '引き分け！';
            currentPlayerElement.classList.add('draw');
            gameActive = false;
            return true;
        }
        
        handlePlayerChange();
        return false;
    }
    
    function handlePlayerChange() {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        
        if (isAIMode) {
            if (currentPlayer === 'O') {
                currentPlayerElement.textContent = 'AIの番です';
            } else {
                currentPlayerElement.textContent = 'あなたの番です';
            }
        } else {
            currentPlayerElement.textContent = `プレイヤー${currentPlayer}の番です`;
        }
    }
    
    function handleRestartGame() {
        gameActive = true;
        currentPlayer = 'X';
        gameState = ['', '', '', '', '', '', '', '', ''];
        
        if (isAIMode) {
            currentPlayerElement.textContent = 'あなたの番です';
        } else {
            currentPlayerElement.textContent = `プレイヤー${currentPlayer}の番です`;
        }
        
        currentPlayerElement.classList.remove('winner', 'draw');
        
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('cell-x', 'cell-o');
        });
    }
    
    // AI functions
    function makeAIMove() {
        if (!gameActive) return;
        
        const bestMove = findBestMove(gameState);
        const cellToPlay = document.querySelector(`.cell[data-index="${bestMove}"]`);
        
        handleCellPlayed(cellToPlay, bestMove);
        handleResultValidation();
    }
    
    function findBestMove(board) {
        // First check if AI can win in the next move
        for (let i = 0; i < BOARD_SIZE; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                if (checkWinner(board, 'O')) {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }
        
        // Then check if player can win in the next move and block them
        for (let i = 0; i < BOARD_SIZE; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                if (checkWinner(board, 'X')) {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }
        
        // Try to take the center
        if (board[4] === '') {
            return 4;
        }
        
        // Try to take the corners
        const corners = [0, 2, 6, 8];
        const availableCorners = corners.filter(i => board[i] === '');
        if (availableCorners.length > 0) {
            return availableCorners[Math.floor(Math.random() * availableCorners.length)];
        }
        
        // Take any available edge
        const edges = [1, 3, 5, 7];
        const availableEdges = edges.filter(i => board[i] === '');
        if (availableEdges.length > 0) {
            return availableEdges[Math.floor(Math.random() * availableEdges.length)];
        }
        
        // If no good move is found, pick a random empty cell
        const emptyCells = board.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);
        if (emptyCells.length > 0) {
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        }
        
        return -1; // No valid move (should not happen in a valid game state)
    }
    
    function checkWinner(board, player) {
        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];
            if (board[a] === player && board[b] === player && board[c] === player) {
                return true;
            }
        }
        return false;
    }
    
    cells.forEach(cell => cell.addEventListener('click', handleCellClick));
    resetButton.addEventListener('click', handleRestartGame);
});