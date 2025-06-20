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
    
    // Game State
    let currentPlayer = PLAYER_X;
    let gameActive = true;
    let gameState = Array(BOARD_SIZE).fill('');
    let isAIMode = false;
    let isAIThinking = false;
    let aiTimeoutId = null;
    
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
    twoPlayerModeButton?.addEventListener('click', () => {
        if (isAIMode) {
            isAIMode = false;
            twoPlayerModeButton.classList.add('active');
            aiModeButton.classList.remove('active');
            handleRestartGame();
        }
    });
    
    aiModeButton?.addEventListener('click', () => {
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
                aiTimeoutId = setTimeout(() => {
                    makeAIMove();
                    isAIThinking = false;
                    aiTimeoutId = null;
                }, AI_DELAY_MS);
            }
        }
    }
    
    function handleCellPlayed(clickedCell, clickedCellIndex) {
        if (!clickedCell || clickedCellIndex < 0 || clickedCellIndex >= BOARD_SIZE) {
            console.error('Invalid cell or index');
            return;
        }
        
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
        // Clear any pending AI moves
        if (aiTimeoutId) {
            clearTimeout(aiTimeoutId);
            aiTimeoutId = null;
        }
        
        gameActive = true;
        currentPlayer = PLAYER_X;
        gameState = Array(BOARD_SIZE).fill('');
        isAIThinking = false;
        
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
        
        try {
            const bestMove = findBestMove(gameState);
            if (bestMove === -1) {
                console.error('No valid move found');
                return;
            }
            
            const cellToPlay = document.querySelector(`.cell[data-index="${bestMove}"]`);
            if (!cellToPlay) {
                console.error('Cell element not found');
                return;
            }
            
            handleCellPlayed(cellToPlay, bestMove);
            handleResultValidation();
        } catch (error) {
            console.error('Error in AI move:', error);
            isAIThinking = false;
        }
    }
    
    function findBestMove(board) {
        // Check for winning/blocking moves in a single pass
        for (let i = 0; i < BOARD_SIZE; i++) {
            if (board[i] === '') {
                // Check if AI can win
                board[i] = PLAYER_O;
                if (checkWinner(board, PLAYER_O)) {
                    board[i] = '';
                    return i;
                }
                
                // Check if player can win and block them
                board[i] = PLAYER_X;
                if (checkWinner(board, PLAYER_X)) {
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
        const emptyCells = board.reduce((acc, cell, index) => {
            if (cell === '') acc.push(index);
            return acc;
        }, []);
        
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
    
    // Event listeners with error handling
    cells.forEach(cell => cell?.addEventListener('click', handleCellClick));
    resetButton?.addEventListener('click', handleRestartGame);
});