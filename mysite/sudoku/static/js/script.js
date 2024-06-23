let candidateBtn = document.getElementById("candidate-btn");
let intervalId;
let gameActivated = true;
let autoCandidateModeEnabled = false;

let winningBoard = JSON.parse(winningB.replace(/'/g, '"'));

let sudokuBoard = document.getElementById("sudoku-board");
let noteModeEnabled;

let chaosModeActivated = false;
let gameInProgress = true;
let bombs;
let startTime;
let elapsedTime = 0;
let timerInterval;
let movesHistory = [];
let conflicts;

// set up note mode

let numberActivatedBox = document.getElementById("number-show");
let candidateActivatedBox = document.getElementById("cand-show");
// hints bar

numberActivatedBox.addEventListener("click", function () {
  if (!numberActivatedBox.classList.contains("active")) {
    numberActivatedBox.classList.toggle("active");
    candidateActivatedBox.classList.toggle("active");
    noteModeEnabled = false;
  }
});

candidateActivatedBox.addEventListener("click", function () {
  if (!candidateActivatedBox.classList.contains("active")) {
    numberActivatedBox.classList.toggle("active");
    candidateActivatedBox.classList.toggle("active");
    noteModeEnabled = true;
  }
});

function resetConflicts() {
  let conflictCircles = document.querySelectorAll(
    ".fa-solid.fa-circle.conflict-circle"
  );
  console.log(conflictCircles);
  conflictCircles.forEach((circle) => {
    circle.remove();
  });
}

function resetNumCandBox() {
  if (!numberActivatedBox.classList.contains("active")) {
    numberActivatedBox.classList.add("active");
    candidateActivatedBox.classList.remove("active");
  }
}
let ellipsisMenu = document.querySelector("#hints-bar-top");

ellipsisMenu.addEventListener("click", function () {
  let ellipsisMenuOptions = document.querySelector(".hints-container-top");
  ellipsisMenuOptions.classList.toggle("active");
});

let difficultyText = document.getElementById("difficulty-menu-label-text");

const selectElement = document.getElementById("difficulty-menu-select");

selectElement.addEventListener("change", function () {
  localStorage.setItem("selectedDifficulty", selectElement.value);
  // Navigate to the selected difficulty page
  document.location.href = `/sudoku${selectElement.value}`;
});

// On page load, set the select value from localStorage
window.addEventListener("load", function () {
  // if there is not already a selected difficulty, then set the selected difficulty as current link and change selectElement accordingly
  startGame();
  start();

  gameActivated = true;
  gameInProgress = true;

  let savedDifficulty = localStorage.getItem("selectedDifficulty");
  let currentUrl = window.location.href;
  let urlSegments = currentUrl.split("/");
  // difficulty segment will be e.g. medium so need to make this /medium
  let difficultySegment = `/${urlSegments[urlSegments.length - 1]}`;

  // difficulty is easy by default
  if (difficultySegment == "/") {
    difficultySegment = "/easy";
  }

  if (!savedDifficulty) {
    localStorage.setItem("savedDifficulty", difficultySegment);

    // update the selectElement to this value so it matches the url and selected difficulty
    selectElement.value = difficultySegment;
    if (difficultySegment.includes("/")) {
      difficultyText.textContent = difficultySegment.replace("/", "").capit;
    } else {
      difficultyText.textContent = difficultySegment.capit;
    }
  } else if (savedDifficulty && savedDifficulty != difficultySegment) {
    // this means that there is a saved difficulty, but the url is different i.e. user has manually typed in the difficulty in the url, bypassing the local storage update
    localStorage.setItem("savedDifficulty", difficultySegment);
    selectElement.value = difficultySegment;
    if (difficultySegment.includes("/")) {
      difficultyText.textContent = difficultySegment.replace("/", "");
    } else {
      difficultyText.textContent = difficultySegment;
    }
  }
  // there is a saved difficulty and this does match the url
  else {
    selectElement.value = savedDifficulty;
    difficultyText.textContent = difficultySegment.replace("/", "");
  }
});

let topLinks = document.querySelectorAll(".top-link");

topLinks.forEach((link) => {
  link.addEventListener("click", function () {
    let difficultyClicked = link.getAttribute("data-value");
    localStorage.setItem("selectedDifficulty", difficultyClicked);
    difficultyText.textContent = difficultyClicked.replace("/", "");
  });
});

function executeChaos(actionsEnabled) {
  let selectedTask =
    actionsEnabled[Math.floor(Math.random() * actionsEnabled.length)];

  if (selectedTask == "rotations") {
    rotateBoard();
  } else if (selectedTask == "memory-challenge") {
    hideNumber();
  }
}

function startGame() {
  // if the game was just won the buttons need activating again as they are disabled when the user wins
  noteModeEnabled = false;
  resetNumCandBox();
  resetConflicts();
  undoBtn.disabled = false;
  movesHistory = [];
  gameActivated = true;
  pauseBtn.style.display = "block";
  candidateBtn.checked = false;
  autoCandidateModeEnabled = false;
  if (chaosModeActivated) {
    getChaosInformation();
    if (adjacentBombing) {
      setBombs();
    }

    if (actionsEnabled) {
      intervalId = setInterval(() => executeChaos(actionsEnabled), actualFreq);
    }
  }
}

function rotateBoard() {
  // generate random angle from -270, -180, -90, 0, 90, 180, 270
  let angles = [-270, -180, -90, 90, 180, 270];
  let randomIdx = Math.floor(Math.random() * angles.length);
  sudokuBoard.style.transform = `rotate(${angles[randomIdx]}deg)`;
  let cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    if (cell.classList.contains(".pre-filled")) {
      cell.document.querySelector("span").style.transform = `rotate(${-angles[
        randomIdx
      ]}deg)`;
    } else {
      let cellContents = cell.children;
      console.log(cellContents);
      for (i = 0; i < cellContents.length; i++) {
        cellContents[i].style.transform = `rotate(${-angles[randomIdx]}deg)`;
      }
    }
  });
}

function hideNumber() {
  let guessedCells = document.querySelectorAll(".guessed:not(:scope .hidden)");

  if (guessedCells.length === 0) {
    return; // No guessed cells found, exit the function
  }

  let randomNumber = Math.floor(Math.random() * guessedCells.length);
  let randomCell = guessedCells[randomNumber];
  let children = Array.from(randomCell.children);

  // Add the hidden class to all children of the random cell
  children.forEach((child) => child.classList.add("hidden"));

  // After 15 seconds, remove the hidden class from all children of the random cell
  setTimeout(function () {
    children.forEach((child) => child.classList.remove("hidden"));
  }, 10000);
}

function setBombs() {
  let guessableCells = document.querySelectorAll(".cell:not(.pre-filled)");
  let guessableCellsArray = Array.from(guessableCells);
  bombs = guessableCellsArray.sort(() => 0.5 - Math.random()).slice(0, 4);
}

function timeToString(time) {
  let diffInHrs = time / 3600000;
  let hh = Math.floor(diffInHrs);

  let diffInMin = (diffInHrs - hh) * 60;
  let mm = Math.floor(diffInMin);

  let diffInSec = (diffInMin - mm) * 60;
  let ss = Math.floor(diffInSec);

  let diffInMs = (diffInSec - ss) * 100;
  let ms = Math.floor(diffInMs);

  let formattedMM = mm.toString().padStart(1, "0");
  let formattedSS = ss.toString().padStart(2, "0");

  return `${formattedMM}:${formattedSS}`;
}

// Declare variables to use in our functions below

// Create function to modify innerHTML

function print(txt) {
  document.getElementById("display").innerHTML = txt;
}

let pauseBtn = document.getElementById("pause-btn");

// Create "start", "pause" and "reset" functions

function start() {
  if (!gameActivated) {
    gameActivated = true;
    gameInProgress = true;
  }

  pauseBtn.style.display = "block";
  startTime = Date.now() - elapsedTime;
  timerInterval = setInterval(function printTime() {
    elapsedTime = Date.now() - startTime;
    print(timeToString(elapsedTime));
  }, 10);
}

let pauseScreen = document.getElementById("pause-screen");
let resumeBtn = document.getElementById("resume-btn");

resumeBtn.addEventListener("click", function () {
  pauseScreen.classList.toggle("active");
  start();
});

function pause() {
  clearInterval(timerInterval);
  gameActivated = false;
}

let resetBtn = document.getElementById("reset-btn");

window.onload = function () {
  candidateBtn.checked = false;
};

resetBtn.addEventListener("click", function () {
  movesHistory = [];
  gameActivated = true;

  candidateBtn.checked = false;
  resetNotesandCandidates();
  clearInterval(timerInterval);
  print("0:00");
  elapsedTime = 0;
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.classList.remove("selected");
    if (!cell.classList.contains("pre-filled")) {
      cell.querySelector(".input-field").innerHTML = "";
      cell.classList.add("empty");
      cell.classList.remove("confirmed");
      cell.classList.remove("rejected");
      cell.classList.remove("guessed");
    }
  });
  let lastNumParagraph = document.getElementById("last-num-val");
  let lastCellParagraph = document.getElementById("last-cell-val");
  lastCellParagraph.textContent = "";
  lastNumParagraph.textContent = "";

  startGame();
  start();
});

// let newBtn = document.getElementById("new-board");

// newBtn.addEventListener("click", function () {
//   gameActivated = false;
//   toggleButtons();
//   resetNotesandCandidates();
//   clearInterval(timerInterval);
//   print("0:00");
//   elapsedTime = 0;
//   startGame();
//   if (pauseBtn.classList.contains("fa-pause")) {
//     pauseBtn.classList.toggle("fa-pause");
//     pauseBtn.classList.toggle("fa-play");
//   }
//   let lastNumParagraph = document.getElementById("last-num-val");
//   let lastCellParagraph = document.getElementById("last-cell-val");
//   lastCellParagraph.textContent = "";
//   lastNumParagraph.textContent = "";
// });

pauseBtn.addEventListener("click", function () {
  if (this.classList.contains("fa-pause")) {
    pause();
    pauseScreen.classList.toggle("active");
  } else {
    start();
  }
});

let helpBtn = document.getElementById("help");

helpBtn.addEventListener("click", function () {
  let helpScreen = document.getElementById("help-screen");
  helpScreen.classList.toggle("active");
});

let closeBtn = document.getElementById("close-help-box");
closeBtn.addEventListener("click", function () {
  let helpScreen = document.getElementById("help-screen");
  helpScreen.classList.toggle("active");
});

let winScreen = document.getElementById("win-screen");

let closeWinBtn = document.getElementById("close-win-box");
closeWinBtn.addEventListener("click", function () {
  winScreen.classList.toggle("active");
});

let settingsBtn = document.getElementById("settings-btn");
settingsBtn.addEventListener("click", function () {
  let settingsScreen = document.getElementById("settings-menu");
  settingsScreen.classList.toggle("active");
});

let closeSettingsBtn = document.getElementById("close-settings-box");
closeSettingsBtn.addEventListener("click", function () {
  let settingsScreen = document.getElementById("settings-menu");
  settingsScreen.classList.toggle("active");
});

function resetNotesandCandidates() {
  autoCandidateModeEnabled = false;
  noteModeEnabled = false;

  let notesContainers = document.querySelectorAll(".notes-container");

  notesContainers.forEach((noteContainer) => {
    // each note container on the sudoku board
    // remove the active class if present and add inactive, if already inactive then fine
    for (i = 0; i < 9; i++) {
      if (noteContainer.children[i].classList.contains("active")) {
        noteContainer.children[i].classList.remove("active");
        noteContainer.children[i].classList.add("inactive");
      }
    }
  });

  // candidate mode input box must be unticked
  let candidateBtn = document.getElementById("candidate-btn");

  candidateBtn.checked = false;

  // candidates container should not be visible, remove active class
  let candidatesContainer = document.querySelectorAll(".candidates-container");
  candidatesContainer.forEach((container) => {
    // active class removed if present from the container itself
    container.classList.remove("active");
    for (i = 0; i < 9; i++) {
      // make sure all candidates in the candidate container are reset to inactive (probably can modify later on, but easier to make inactive)
      if (container.children[i].classList.contains("active")) {
        container.children[i].classList.remove("active");
        container.children[i].classList.add("inactive");
      }
    }
  });
}

// SELECT CELLS VIA CLICKING

// to input the numbers:
// clicking the cell activates it and highlights the cell
// typing the number replaces current number with new number
// clicking another cell deactivates the activated cell

function highlightCell(cell) {
  if (!gameActivated) {
    return;
  }
  const cells = document.querySelectorAll(".cell");
  // Remove "selected" class from all cells
  cells.forEach((cell) => {
    cell.classList.remove("selected");
  });

  // Add "selected" class to the clicked cell
  cell.classList.add("selected");
}

// SWITCH BETWEEN CELLS USING ARROWS

// do not allow pre-filled cells to be changed.

function convertToAngle(rotation) {
  let values = rotation
    .match(/matrix\((.+)\)/)[1]
    .split(", ")
    .map(Number);
  let a = values[0];
  let b = values[1];

  // Calculate the rotation angle in radians
  let angle = Math.atan2(b, a);

  // Convert the angle from radians to degrees
  let degrees = angle * (180 / Math.PI);
  return degrees;
}

window.addEventListener("keydown", (event) => {
  if (!gameActivated) {
    return;
  }
  if (event.code == "Space") {
    noteModeEnabled = noteModeEnabled ? false : true;
    if (event.target.id === "candidate-btn") {
      event.preventDefault();
    }
    if ((event.target = document.body)) {
      event.preventDefault();
    }
    numberActivatedBox.classList.toggle("active");
    candidateActivatedBox.classList.toggle("active");

    return;
  }
  let btnPressed = event.key;
  let angle;

  selectedCell = document.querySelector(".selected");
  let currentRow =
    selectedCell.classList[2][selectedCell.classList[2].length - 1];
  let currentCol =
    selectedCell.classList[4][selectedCell.classList[2].length - 1];
  // check if a cell has been selected yet i.e. first go
  let sudokuBoard = document.getElementById("sudoku-board");
  let rotation = window.getComputedStyle(sudokuBoard).transform;
  if (rotation != "none") {
    angle = convertToAngle(rotation);
  }

  if (angle != undefined) {
    if (btnPressed == "ArrowLeft") {
      if (angle == 90 || angle == -270) {
        btnPressed = "ArrowDown";
      } else if (angle == 180 || angle == -180) {
        btnPressed = "ArrowRight";
      } else if (angle == 270 || angle == -90) {
        btnPressed = "ArrowUp";
      }
    } else if (btnPressed == "ArrowRight") {
      if (angle == 90 || angle == -270) {
        btnPressed = "ArrowUp";
      } else if (angle == 180 || angle == -180) {
        btnPressed = "ArrowLeft";
      } else if (angle == 270 || angle == -90) {
        btnPressed = "ArrowDown";
      }
    } else if (btnPressed == "ArrowUp") {
      if (angle == 90 || angle == -270) {
        btnPressed = "ArrowLeft";
      } else if (angle == 180 || angle == -180) {
        btnPressed = "ArrowDown";
      } else if (angle == 270 || angle == -90) {
        btnPressed = "ArrowRight";
      }
    } else if (btnPressed == "ArrowDown") {
      if (angle == 90 || angle == -270) {
        btnPressed = "ArrowRight";
      } else if (angle == 180 || angle == -180) {
        btnPressed = "ArrowUp";
      } else if (angle == 270 || angle == -90) {
        btnPressed = "ArrowLeft";
      }
    }
  }

  if (btnPressed == "ArrowLeft") {
    if (currentCol == 1) {
      return;
    }
    let newCol = (parseInt(currentCol) - 1).toString();
    let newCell = document.querySelector(`.row-${currentRow}.col-${newCol}`);
    highlightCell(newCell);
  } else if (btnPressed == "ArrowRight") {
    if (currentCol == 9) {
      return;
    }

    let newCol = (parseInt(currentCol) + 1).toString();
    let newCell = document.querySelector(`.row-${currentRow}.col-${newCol}`);
    highlightCell(newCell);
  } else if (btnPressed == "ArrowUp") {
    if (currentRow == 1) {
      return;
    }

    let newRow = (parseInt(currentRow) - 1).toString();
    let newCell = document.querySelector(`.row-${newRow}.col-${currentCol}`);
    highlightCell(newCell);
  } else if (btnPressed == "ArrowDown") {
    if (currentRow == 9) {
      return;
    }

    let newRow = (parseInt(currentRow) + 1).toString();
    let newCell = document.querySelector(`.row-${newRow}.col-${currentCol}`);
    highlightCell(newCell);
  }
  if (selectedCell.classList.contains("pre-filled")) {
    return;
  } else {
    if (btnPressed >= "1" && btnPressed <= "9") {
      if (selectedCell.classList.contains("confirmed")) {
        return;
      }
      // Get the pressed number
      const numberPressed = parseInt(event.key); // Convert key to number
      // Find the selected cell
      if (autoCandidateModeEnabled) {
        if (noteModeEnabled) {
          activateCandidate(numberPressed);
          return;
        } else {
          addNum(numberPressed, selectedCell, false);

          let allEmptyCells = document.querySelectorAll(".empty");
          allEmptyCells.forEach((emptyCell) => {
            let emptyCellRow =
              emptyCell.classList[2][emptyCell.classList[2].length - 1];
            let emptyCellCol =
              emptyCell.classList[4][emptyCell.classList[4].length - 1];
            findCandidates(emptyCellRow, emptyCellCol);
          });
        }
      } else if (noteModeEnabled) {
        selectedCell.querySelector(".input-field").textContent = "";
        activateNote(numberPressed);
        return;
      } else {
        // If a cell is selected, insert the pressed number into its input field
        // show last num and cell changed if num pressed on non-pre-filled cell
        addNum(numberPressed, selectedCell, false);
      }
    } else if (event.key == "Backspace") {
      let conflictCircle = selectedCell.querySelector(
        ".fa-solid.fa-circle.conflict-circle"
      );
      if (conflictCircle) {
        conflictCircle.remove();
      }

      removeValue(selectedCell, false);
      selectedCell.classList.remove("rejected");

      let allEmptyCells = document.querySelectorAll(".empty");
      allEmptyCells.forEach((emptyCell) => {
        let emptyCellRow =
          emptyCell.classList[2][emptyCell.classList[2].length - 1];
        let emptyCellCol =
          emptyCell.classList[4][emptyCell.classList[4].length - 1];
        findCandidates(emptyCellRow, emptyCellCol);
      });
    }
  }
});

function findConflicts(selectedCell) {
  if (selectedCell.classList.contains("empty")) {
    return;
  }
  let row = selectedCell.classList[2][selectedCell.classList[2].length - 1];
  let col = selectedCell.classList[4][selectedCell.classList[4].length - 1];
  const EndRow = Math.ceil(row / 3) * 3; // final row in the 3x3 grid that the cell is in
  const EndCol = Math.ceil(col / 3) * 3; // final col in the 3x3 grid that the cell is in
  let possibleConflicts = [];
  // get all cells in the 3x3 grid
  for (i = EndRow; i > EndRow - 3; i--) {
    for (j = EndCol; j > EndCol - 3; j--) {
      let num;
      // cell is at row i and col j
      // if the cell is pre-filled then the number is the textContent of the cell, if the cell is not-prefilled then the number is the textContent of the input field
      let currentCell = document.querySelector(`.row-${i}.col-${j}`);

      if (currentCell.classList.contains("pre-filled")) {
        num = currentCell.textContent.trim();
      } else {
        num = currentCell.querySelector(".input-field").textContent.trim();
      }

      possibleConflicts.push(num);
    }
  }
  // look at numbers in same row that it cannot be
  let cellsinRow = document.querySelectorAll(`.row.row-${row}`);
  cellsinRow.forEach((r) => {
    if (r.classList.contains("pre-filled")) {
      num = r.textContent.trim();
    } else {
      num = r.querySelector(".input-field").textContent.trim();
    }
    possibleConflicts.push(num);
  });

  let cellsinCol = document.querySelectorAll(`.col.col-${col}`);
  cellsinCol.forEach((c) => {
    if (c.classList.contains("pre-filled")) {
      num = c.textContent.trim();
    } else {
      num = c.querySelector(".input-field").textContent.trim();
    }
    possibleConflicts.push(num);
  });

  // remove the number that the cell actually is, 3x (3x3, row, col)

  for (let i = 0; i < 3; i++) {
    let index = possibleConflicts.indexOf(
      selectedCell.querySelector(".input-field").textContent.trim()
    );
    if (index !== -1) {
      possibleConflicts.splice(index, 1);
    } else {
      break; // If the element is not found, exit the loop
    }
  }
  if (
    possibleConflicts.includes(
      selectedCell.querySelector(".input-field").textContent.trim()
    )
  ) {
    if (
      !selectedCell.classList.contains("fa-solid fa-circle conflict-circle")
    ) {
      selectedCell.innerHTML +=
        '<i class="fa-solid fa-circle conflict-circle" id="conflict-circle"></i>';
    }
  } else if (
    !possibleConflicts.includes(
      selectedCell.querySelector(".input-field").textContent.trim()
    )
  ) {
    let conflictCircle = selectedCell.querySelector("#conflict-circle");
    if (conflictCircle) {
      conflictCircle.remove();
    }
  }
}

function updateLastMove(numberPressed, newRow, newCol) {
  let selectedCell = document.querySelector(`.row-${newRow}.col-${newCol}`);
  let lastNumParagraph = document.getElementById("last-num-val");
  let lastCellParagraph = document.getElementById("last-cell-val");
  lastNumParagraph.classList.remove("removed");
  lastCellParagraph.classList.remove("removed");
  lastNumParagraph.textContent = numberPressed.toString();
  lastCellParagraph.textContent = `row ${newRow}, col ${newCol}`;
  let empty = document.querySelectorAll(".empty");
  if (empty.length === 0) {
    checkWin();
  }
}

// ALLOW USER TO ADD NUMBERS TO THE BOARD USING THE CONTROL PANEL

function addNum(num, selectedCell, fromUndo) {
  if (selectedCell.classList.contains("confirmed")) {
    return;
  }
  if (selectedCell.classList.contains("pre-filled")) {
    return;
  }
  // if the cell has the rejected class, do not remove the rejected class if the new number pressed is the same
  let inputField = selectedCell.querySelector(".input-field");
  let currentNum = inputField.textContent.trim();
  if (currentNum != num) {
    selectedCell.classList.remove("rejected");
  }
  inputField.textContent = num;

  selectedCell.classList.remove("empty");
  selectedCell.classList.add("guessed");
  let changedRow = parseInt(
    selectedCell.classList[2][selectedCell.classList[2].length - 1]
  );
  let changedCol = parseInt(
    selectedCell.classList[4][selectedCell.classList[2].length - 1]
  );
  updateLastMove(num, changedRow, changedCol);
  if (!fromUndo) {
    makeMove(num, changedRow, changedCol, "add");
  }

  if (
    parseInt(winningBoard[changedCol - 1][changedRow - 1]) !=
    parseInt(inputField.textContent)
  ) {
    if (adjacentBombing) {
      // check if this is a bomb cell
      if (bombs.includes(selectedCell)) {
        let adjacentCells = Array.from(
          document.querySelectorAll(`
      .row-${changedRow}.col-${changedCol - 1}:not(.pre-filled),
      .row-${changedRow}.col-${changedCol + 1}:not(.pre-filled),
      .row-${changedRow + 1}.col-${changedCol - 1}:not(.pre-filled),
      .row-${changedRow + 1}.col-${changedCol + 1}:not(.pre-filled),
      .row-${changedRow + 1}.col-${changedCol}:not(.pre-filled),
      .row-${changedRow - 1}.col-${changedCol - 1}:not(.pre-filled),
      .row-${changedRow - 1}.col-${changedCol + 1}:not(.pre-filled),
      .row-${changedRow - 1}.col-${changedCol}:not(.pre-filled)
  `)
        );
        let celltoBomb;
        for (let i = 0; i < adjacentCells.length; i++) {
          celltoBomb = adjacentCells[i];
          removeValue(celltoBomb, true); // acts like move has come from undo so you cannot undo this move
        }
      }
    }
  }
  if (autoCheck) {
    checkCell(selectedCell);
  }
  if (conflicts) {
    findConflicts(selectedCell);
  }
}

function removeValue(selectedCell, fromUndo) {
  if (selectedCell.classList.contains("confirmed")) {
    return;
  }
  if (selectedCell.classList.contains("pre-filled")) {
    return;
  } else {
    if (selectedCell.children[0].innerHTML.length != 0) {
      let lastNumParagraph = document.getElementById("last-num-val");
      let lastCellParagraph = document.getElementById("last-cell-val");

      let [lastRow, lastCol] = [
        lastCellParagraph.textContent.match(/\d+/g)[0],
        lastCellParagraph.textContent.match(/\d+/g)[1],
      ];
      if (!fromUndo) {
        makeMove(
          selectedCell.querySelector(".input-field").textContent.trim(),
          lastRow,
          lastCol,
          "remove"
        );
      }

      selectedCell.children[0].textContent = "";

      lastNumParagraph.classList.add("removed");
      lastCellParagraph.classList.add("removed");
      selectedCell.classList.add("empty");
      selectedCell.classList.remove("guessed");
    } else {
      // get all notes
      let notes = selectedCell.querySelectorAll(".note");
      notes.forEach((note) => {
        if (note.classList.contains("active")) {
          note.classList.remove("active");
          note.classList.add("inactive");
        }
      });
    }
  }
}

let removeBtn = document.getElementById("remove-btn");
removeBtn.addEventListener("click", function () {
  removeValue(document.querySelector(".selected"), false);
});

// no cells are empty now
// winning board variable structured as 2D array with columns
// compare winning board column 1 with current board column 1 and so on

let winTimeSpan = document.getElementById("final-time");
let winDifficultySpan = document.getElementById("final-difficulty");

function checkWin() {
  // get cells that are not pre-filled
  let guessedCols = document.querySelectorAll(".cell:not(.pre-filled)");

  for (i = 0; i < guessedCols.length; i++) {
    var colClasses = guessedCols[i].classList;
    var col = colClasses[4][4];
    var row = colClasses[2][4];
    var guess = guessedCols[i].querySelector(".input-field").textContent.trim();
    if (parseInt(guess) != winningBoard[col - 1][row - 1]) {
      return;
    }
  }
  pause();
  stopTimer();
  winScreen.classList.add("active");
  winTimeSpan.textContent = document.getElementById("display").innerHTML;
  winDifficultySpan.textContent = localStorage
    .getItem("selectedDifficulty")
    .replace("/", "");
  pauseBtn.style.display = "none";
  gameActivated = false;
  gameInProgress = false;
  clearInterval(intervalId);
}

//check cell

let checkCellBtn = document.getElementById("check-cell-btn");

checkCellBtn.addEventListener("click", function () {
  checkCell(document.querySelector(".selected"));
});

function checkCell(selectedCell) {
  if (selectedCell.classList.contains("empty")) {
    return;
  }
  let inputField = selectedCell.querySelector(".input-field");

  let selectedRow =
    selectedCell.classList[2][selectedCell.classList[2].length - 1];
  let selectedCol =
    selectedCell.classList[4][selectedCell.classList[2].length - 1];

  if (
    winningBoard[selectedCol - 1][selectedRow - 1] ==
    parseInt(inputField.textContent)
  ) {
    selectedCell.classList.add("confirmed");
    let conflictCircle = selectedCell.querySelector(
      ".fa-solid.fa-circle.conflict-circle"
    );
    if (conflictCircle) {
      conflictCircle.remove();
    }

    let empty = document.querySelectorAll(".empty");
    if (empty.length === 0) {
      checkWin();
    }
  } else {
    selectedCell.classList.add("rejected");
  }
}

let checkPuzzleBtn = document.getElementById("check-puzzle-btn");

function checkPuzzle() {
  // run check cell on every cell in puzzle that is not pre-filled
  let guessedCells = document.querySelectorAll(".guessed");
  guessedCells.forEach((cell) => {
    checkCell(cell);
  });
}

checkPuzzleBtn.addEventListener("click", checkPuzzle);

//go through all cells that do not have the

let revealCellBtn = document.getElementById("reveal-cell-btn");

revealCellBtn.addEventListener("click", function () {
  revealCell(document.querySelector(".selected"));
});

function revealCell(selectedCell) {
  let inputField = selectedCell.querySelector(".input-field");
  let selectedRow =
    selectedCell.classList[2][selectedCell.classList[2].length - 1];
  let selectedCol =
    selectedCell.classList[4][selectedCell.classList[2].length - 1];
  inputField.textContent = winningBoard[selectedCol - 1][selectedRow - 1];

  selectedCell.classList.add("confirmed");
  let conflictCircle = selectedCell.querySelector(
    ".fa-solid.fa-circle.conflict-circle"
  );
  if (conflictCircle) {
    conflictCircle.remove();
  }
  selectedCell.classList.remove("empty");
  selectedCell.classList.remove("rejected");

  updateLastMove(
    winningBoard[selectedCol - 1][selectedRow - 1],
    selectedRow,
    selectedCol
  );
  if (autoCandidateModeEnabled) {
    let allEmptyCells = document.querySelectorAll(".empty");
    allEmptyCells.forEach((emptyCell) => {
      let emptyCellRow =
        emptyCell.classList[2][emptyCell.classList[2].length - 1];
      let emptyCellCol =
        emptyCell.classList[4][emptyCell.classList[4].length - 1];
      findCandidates(emptyCellRow, emptyCellCol);
    });
  }
}

let revealPuzzleBtn = document.getElementById("reveal-puzzle-btn");

revealPuzzleBtn.addEventListener("click", revealPuzzle);

function revealPuzzle() {
  let nonPreFilledCells = document.querySelectorAll(".cell:not(.pre-filled)");
  nonPreFilledCells.forEach((cell) => {
    revealCell(cell);
  });
}

function activateNote(numClicked) {
  let selectedCell = document.querySelector(".selected");
  selectedCell.classList.remove("guessed");
  // check if selected cell is the same element as the cell we are clicking on
  let selectedNote = document.querySelector(`.selected .note-${numClicked}`);
  selectedNote.classList.contains("inactive")
    ? (selectedNote.classList.remove("inactive"),
      selectedNote.classList.add("active"))
    : (selectedNote.classList.remove("active"),
      selectedNote.classList.add("inactive"));
}

function activateCandidate(numClicked) {
  let selectedCell = document.querySelector(".selected");
  selectedCell.classList.remove("guessed");
  // check if selected cell is the same element as the cell we are clicking on
  let selectedCandidate = document.querySelector(
    `.selected .candidates-container .candidate-${numClicked}`
  );
  selectedCandidate.classList.contains("inactive")
    ? (selectedCandidate.classList.remove("inactive"),
      selectedCandidate.classList.add("active"))
    : (selectedCandidate.classList.remove("active"),
      selectedCandidate.classList.add("inactive"));
}

// button to turn candidate mode on

candidateBtn.addEventListener("click", (e) => {
  // toggle the autocandidate mode
  autoCandidateModeEnabled = !autoCandidateModeEnabled;
  let allNotes = document.querySelectorAll(".notes-container");
  let candidatesContainer = document.querySelectorAll(".candidates-container");
  candidatesContainer.forEach((container) => {
    container.classList.toggle("active");
  });
  allNotes.forEach((note) => {
    note.classList.toggle("inactive");
  });
  if (autoCandidateModeEnabled) {
    let allEmptyCells = document.querySelectorAll(".empty");
    allEmptyCells.forEach((emptyCell) => {
      let emptyCellRow =
        emptyCell.classList[2][emptyCell.classList[2].length - 1];
      let emptyCellCol =
        emptyCell.classList[4][emptyCell.classList[4].length - 1];
      findCandidates(emptyCellRow, emptyCellCol);
    });
  }
});

// find possible candidates for a single cell, then this function can be used for all non-pre-filled cells

// function toggleButtons() {
//   // select both buttons and inputs within the right container
//   let controlElements = document.querySelectorAll(
//     ".right-container button:not(.chaos-container button), .right-container input:not(.chaos-container input)"
//   );

//   // toggle the disabled property for each selected element
//   controlElements.forEach((item) => {
//     if (gameActivated) {
//       item.disabled = false;
//     } else {
//       item.disabled = true;
//     }
//   });
// }

// to store what move the user makes for the undo btn functionality
function makeMove(value, row, col, operation) {
  // Store the move details in an object
  let move = {
    value: value,
    row: row,
    col: col,
    operation: operation, // add or remove
  };

  // push the move to the moves history
  movesHistory.push(move);
}

let undoBtn = document.getElementById("undo-btn");

function undoMove() {
  if (movesHistory.length > 0) {
    let lastMove = movesHistory.pop();
    let cellToModify = document.querySelector(
      `.cell.row-${lastMove.row}.col-${lastMove.col}`
    );

    if (lastMove.operation == "add") {
      // if the user has added the number, they will have either filled an empty cell or changed the number.
      //.pop() has removed this move, now look back to see the previous state of this cell
      let lastModificationtoCell = findLastModification(
        lastMove.row,
        lastMove.col
      );

      // cell has never been modified prior so you can remove the value to undo it
      if (
        lastModificationtoCell == null ||
        lastModificationtoCell.operation == "remove"
      ) {
        // pass in the cell to the removeValue function
        removeValue(cellToModify, true);
      } else {
        // previous modification to cell has occurred
        // move has been returned
        // get what the cell previously was
        addNum(lastModificationtoCell.value, cellToModify, true);
      }
    } else {
      // last move was removal, look at what that cell was before the removal
      let lastModificationtoCell = findLastModification(
        lastMove.row,
        lastMove.col
      );

      // cell previously had a value if not null

      if (lastModificationtoCell != null) {
        addNum(lastModificationtoCell.value, cellToModify, true);
      }
    }
  }
}

function findLastModification(row, col) {
  for (let i = movesHistory.length - 1; i >= 0; i--) {
    let move = movesHistory[i];
    if (move.row == row && move.col == col) {
      return move;
    }
  }
  return null; // cell has never been modified before
}

undoBtn.addEventListener("click", undoMove);

// user can use candidate mode
// all possible candidates are shown, if the user adds an impossible candidate as a candidate then this will only be recognised when they next play a number (non-candidate)

//

function findCandidates(row, col) {
  // get all of the numbers that it cannot be
  // look at numbers in the same 3x3
  const EndRow = Math.ceil(row / 3) * 3; // final row in the 3x3 grid that the cell is in
  const EndCol = Math.ceil(col / 3) * 3; // final col in the 3x3 grid that the cell is in
  let impossibleCandidates = new Set();
  // get all cells in the 3x3 grid
  for (i = EndRow; i > EndRow - 3; i--) {
    for (j = EndCol; j > EndCol - 3; j--) {
      let num;
      // cell is at row i and col j
      // if the cell is pre-filled then the number is the textContent of the cell, if the cell is not-prefilled then the number is the textContent of the input field
      let currentCell = document.querySelector(`.row-${i}.col-${j}`);

      if (currentCell.classList.contains("pre-filled")) {
        num = currentCell.textContent.trim();
      } else {
        num = currentCell.querySelector(".input-field").textContent.trim();
      }

      impossibleCandidates.add(num);
    }
  }
  // look at numbers in same row that it cannot be
  let cellsinRow = document.querySelectorAll(`.row.row-${row}`);
  cellsinRow.forEach((r) => {
    if (r.classList.contains("pre-filled")) {
      num = r.textContent.trim();
    } else {
      num = r.querySelector(".input-field").textContent.trim();
    }
    impossibleCandidates.add(num);
  });

  let cellsinCol = document.querySelectorAll(`.col.col-${col}`);
  cellsinCol.forEach((c) => {
    if (c.classList.contains("pre-filled")) {
      num = c.textContent.trim();
    } else {
      num = c.querySelector(".input-field").textContent.trim();
    }
    impossibleCandidates.add(num);
  });
  let cell = document.querySelectorAll(`.row-${row}.col-${col} .candidate`);
  cell.forEach((p) => {
    if (impossibleCandidates.has(p.textContent.trim())) {
      p.classList.remove("active");
      p.classList.add("inactive");
    } else {
      p.classList.add("active");
      p.classList.remove("inactive");
    }
  });
}

let chaosBtn = document.getElementById("chaos-btn");

chaosBtn.addEventListener("click", function () {
  this.classList.toggle("active");
  if (this.classList.contains("active")) {
    chaosModeActivated = true;
  } else {
    chaosModeActivated = false;
  }
});

let randomBtn = document.getElementById("random");

let fixedFreqBtn = document.getElementById("fixed-frequency");
let fixedFreqInpt = document.getElementById("fixed-freq-input");
let randomFreqBtn = document.getElementById("random-frequency");
let randomFreqMax = document.getElementById("max-actions");
let randomFreqMin = document.getElementById("min-actions");

function updateChaosButtons() {
  if (randomBtn.checked) {
    fixedFreqBtn.disabled = true;
    fixedFreqInpt.disabled = true;
    randomFreqBtn.disabled = false;
    randomFreqMax.disabled = false;
    randomFreqMin.disabled = false;
  } else {
    fixedFreqBtn.disabled = false;
    fixedFreqInpt.disabled = false;
    randomFreqBtn.disabled = true;
    randomFreqMax.disabled = true;
    randomFreqMin.disabled = true;
  }
}

let randomEnabled;
let randomFreqEnabled;
let min;
let autoCheck = false;
let max;
let fixedFreq;
let adjacentBombing = false;
let actionsEnabled = [];
let actualFreq; // in seconds so 3 times is 60/3 so 20 sec between changes

let autocheckBtn = document.getElementById("autocheck-btn");

autocheckBtn.addEventListener("click", function () {
  autoCheck = !autoCheck;
});

let conflictsBtn = document.getElementById("conflicts-btn");

conflictsBtn.addEventListener("click", function () {
  conflicts = !conflicts;
  let allCells = document.querySelectorAll(".cell");
  allCells.forEach((cell) => {
    if (cell.classList.contains("guessed")) {
      findConflicts(cell);
    }
  });
});

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getChaosInformation() {
  // get actions enabled
  let actions = document.querySelectorAll(".actions-options input");
  actions.forEach((action) => {
    if (action.checked) {
      if (action.name == "adjacent-bombing") {
        adjacentBombing = true;
      } else {
        actionsEnabled.push(action.name);
      }
    }
  });
  if (!actionsEnabled.includes("adjacent-bombing")) {
    adjacentBombing = false;
  }
  // get frequency
  // see if random is checked:
  randomEnabled = randomBtn.checked;
  if (randomEnabled) {
    // see if range is ticked
    randomFreqEnabled = randomFreqBtn.checked;
    if (randomFreqEnabled) {
      min = randomFreqMin.value;
      max = randomFreqMax.value;
      actualFreq = Math.round(60 / getRandomNumber(min, max)) * 1000;
    } else {
      actualFreq = Math.round(60 / getRandomNumber(2, 4)) * 1000;
    }
  } else {
    fixedFreq = fixedFreqInpt.value;
    actualFreq = Math.round(60 / fixedFreq) * 1000;
  }
}

randomBtn.addEventListener("click", updateChaosButtons);

window.onload = function () {
  updateChaosButtons();
};

startGame();
