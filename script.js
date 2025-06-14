// Game state management
let gameState = {
  gameStart: false,
  currentPlayer: 1, // 1 for red (P1), 2 for green (P2)
  player1Count: 12,
  player2Count: 12,
  selectedBead: null,
  killBead: null,
  killCoordinates: [-1, -1],
  gameArray: [
    ["O", "O", "O", "O", "O"],
    ["O", "O", "O", "O", "O"],
    ["O", "O", " ", "X", "X"],
    ["X", "X", "X", "X", "X"],
    ["X", "X", "X", "X", "X"],
  ],
};

// DOM Elements
const button = document.getElementById("startBtn");
const sound = document.getElementById("hoverSound");
const btnPress = new Audio("buttonPress.mp3");
const moveSound = new Audio("moveSound.mp3");
const beadKilled = new Audio("beadKill.wav");
const redBeads = document.querySelectorAll(".bead.red");
const greenBeads = document.querySelectorAll(".bead.green");
const emptySpace = document.querySelector(".empty");

function getPosition(bead) {
  return bead.dataset.position.split("-").map(Number);
}

function selectBead(bead) {
  // Clear previous selection
  const previousSelected = document.querySelector(".selectedBead");
  gameState.killBead = null;
  gameState.killCoordinates = [-1, -1];
  if (previousSelected) {
    previousSelected.classList.remove("selectedBead");
  }

  // Set new selection
  bead.classList.add("selectedBead");
  gameState.selectedBead = bead;
  btnPress.play();

  // Get and display valid moves
  const [row, col] = getPosition(bead);
  displayHollow(row, col);
}

function displayHollow(row, col) {
  // Clear previous hollow spaces
  const existingHollows = document.querySelectorAll(".hollow");
  existingHollows.forEach((hollow) => {
    hollow.classList.remove("hollow");
    hollow.classList.add("empty");
  });

  // Define possible moves
  const directions = [
    [-1, 0], // up
    [1, 0], // down
    [0, -1], // left
    [0, 1], // right
  ];

  // For killing scenarios going two spaces instead of one
  const directions2 = [
    [-2, 0], // up (2 spaces)
    [2, 0], // down (2 spaces) - Fixed the syntax here
    [0, -2], // left (2 spaces)
    [0, 2], // right (2 spaces)
  ];

  // Add diagonals if position allows
  if ((row + col) % 2 === 0) {
    directions.push(
      [-1, -1], // up-left
      [-1, 1], // up-right
      [1, -1], // down-left
      [1, 1] // down-right
    );
    directions2.push([-2, -2], [-2, 2], [2, -2], [2, 2]);
  }

  // Check and mark valid moves
  for (let i = 0; i < directions.length; i++) {
    const deltaRow = directions[i][0];
    const deltaCol = directions[i][1];
    const delRow2 = directions2[i][0];
    const delCol2 = directions2[i][1];

    const newRow = row + deltaRow;
    const newCol = col + deltaCol;
    const killRow = row + delRow2;
    const killCol = col + delCol2;

    // Normal move condition
    if (
      isValidPosition(newRow, newCol) &&
      gameState.gameArray[newRow][newCol] === " "
    ) {
      const position = `${newRow}-${newCol}`;
      const space = document.querySelector(`[data-position="${position}"]`);
      space.classList.remove("empty");
      space.classList.add("hollow");
    }
    // Killing scenario condition
    else if (
      isValidPosition(newRow, newCol) &&
      isValidPosition(killRow, killCol) &&
      gameState.gameArray[newRow][newCol] !== " " && // Ensure there's an enemy bead
      gameState.gameArray[newRow][newCol] !== gameState.gameArray[row][col] && // Different from current player's bead
      gameState.gameArray[killRow][killCol] === " " // Ensure space beyond enemy is empty
    ) {
      const killPosition = `${killRow}-${killCol}`;
      const killSpace = document.querySelector(
        `[data-position="${killPosition}"]`
      );

      const enemyPosition = `${newRow}-${newCol}`;
      const enemySpace = document.querySelector(
        `[data-position="${enemyPosition}"]`
      );

      if (killSpace && enemySpace) {
        killSpace.classList.remove("empty");
        killSpace.classList.add("hollow");
        gameState.killCoordinates = [killRow, killCol]; // Coordinates if bead is placed here it could kill

        enemySpace.classList.add("selectedBead");
        gameState.killBead = enemySpace; // This bead can be killed
      }
    }
  }
}

function peformMove(space) {
  const [row, col] = getPosition(space);
  const [playerRow, playerCol] = getPosition(gameState.selectedBead);

  let wasKilled = false;
  space.className = " ";
  space.classList.add("bead");
  if (gameState.currentPlayer === 1) {
    gameState.gameArray[row][col] = "X";
    space.classList.add("red");
  } else {
    gameState.gameArray[row][col] = "O";
    space.classList.add("green");
  }

  gameState.gameArray[playerRow][playerCol] = " ";
  gameState.selectedBead.className = " ";
  gameState.selectedBead.classList.add("empty");

  if (
    gameState.killBead != null &&
    row === gameState.killCoordinates[0] &&
    col === gameState.killCoordinates[1]
  ) {
    if (gameState.currentPlayer === 1) {
      gameState.player2Count--;
    } else {
      gameState.player1Count--;
    }

    wasKilled = true;
    const [killedBeadRow, killedBeadCol] = getPosition(gameState.killBead);
    gameState.gameArray[killedBeadRow][killedBeadCol] = " ";
    gameState.killBead.className = " ";
    gameState.killBead.classList.add("empty");
  }

  if (!wasKilled) {
    moveSound.currentTime = 0; // Reset to start
    moveSound.play();
  } else {
    beadKilled.currentTime = 0;
    beadKilled.play();
  }
  gameState.selectedBead = null;
  gameState.killBead = null;
  gameState.killCoordinates = [-1, -1];
  const existingHollows = document.querySelectorAll(".hollow");
  existingHollows.forEach((hollow) => {
    hollow.classList.remove("hollow");
    hollow.classList.add("empty");
  });

  const previousSelected = document.querySelector(".selectedBead");
  if (previousSelected) {
    previousSelected.classList.remove("selectedBead");
  }

  if (checkGameEnd()) return;
}

function isValidPosition(row, col) {
  return (
    row >= 0 &&
    row < gameState.gameArray.length &&
    col >= 0 &&
    col < gameState.gameArray[0].length
  );
}

function setupGameListeners() {
  // Remove all existing listeners to prevent duplicate event bindings
  document.removeEventListener("click", handleBoardClick);

  // Add a single event listener to the entire board
  document.addEventListener("click", handleBoardClick);
}

function handleBoardClick(event) {
  // Check for bead selection
  const bead = event.target.closest(".bead.red, .bead.green");
  if (bead) {
    // Determine the current player based on the bead color
    const isRedPlayer = bead.classList.contains("red");
    const isGreenPlayer = bead.classList.contains("green");

    if (gameState.gameStart) {
      // Check if the bead belongs to the current player
      if (
        (gameState.currentPlayer === 1 && isRedPlayer) ||
        (gameState.currentPlayer === 2 && isGreenPlayer)
      ) {
        selectBead(bead);
      }
      return;
    }
  }

  // Check for move on hollow spaces
  const space = event.target.closest(".hollow");
  if (space && gameState.gameStart && gameState.selectedBead) {
    peformMove(space);
    switchPlayer();
  }
}

function switchPlayer() {
  // Switch the current player

  if (gameState.currentPlayer === 1) gameState.currentPlayer = 2;
  else gameState.currentPlayer = 1;

  // Update the player turn display
  const turnDisplay = document.querySelector(".playerTurn");
  turnDisplay.innerText = `P${gameState.currentPlayer}'s Turn`;
}

function checkGameEnd() {
  if (gameState.player2Count === 0) {
    endGame("Player 1 Wins!");
    return true;
  } else if (gameState.player1Count === 0) {
    endGame("Player 2 Wins!");
    return true;
  }
  return false;
}

function endGame(winner) {
  gameState = {
    //reset gameState
    gameStart: false,
    currentPlayer: 1,
    player1Count: 12,
    player2Count: 12,
    selectedBead: null,
    killBead: null,
    killCoordinates: [-1, -1],
    gameArray: [
      ["O", "O", "O", "O", "O"],
      ["O", "O", "O", "O", "O"],
      ["O", "O", " ", "X", "X"],
      ["X", "X", "X", "X", "X"],
      ["X", "X", "X", "X", "X"],
    ],
  };

  // Remove all event listeners
  document.removeEventListener("click", handleBoardClick);
  window.location.href = `gameEnd.html?winner=${encodeURIComponent(winner)}`;
}

// Initialize game
button.addEventListener("mouseenter", () => {
  btnPress.currentTime = 0;
  btnPress.play();
});

button.addEventListener("click", () => {
  sound.play();
  gameState.gameStart = true;

  const turnDisplay = document.createElement("p");
  turnDisplay.innerText = "P1's Turn";
  turnDisplay.classList.add("playerTurn");

  button.parentNode.replaceChild(turnDisplay, button);
  setupGameListeners();
});
