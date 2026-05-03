const startButton = document.querySelector(".primary");
const boardElement = document.querySelector("#game-board");
const sizeInputs = document.querySelectorAll("input[name='board-size']");

const boardConfigs = {
  short: { rows: 4, cols: 6 },
  normal: { rows: 5, cols: 6 },
  long: { rows: 6, cols: 7 },
};

const createSnakePath = (rows, cols) => {
  const path = [];
  for (let row = 0; row < rows; row += 1) {
    const columns = Array.from({ length: cols }, (_, index) => index);
    if (row % 2 === 1) {
      columns.reverse();
    }
    columns.forEach((col) => {
      path.push({ row, col });
    });
  }
  return path;
};

const renderBoard = ({ rows, cols }) => {
  if (!boardElement) {
    return;
  }

  boardElement.style.setProperty("--cols", cols);
  boardElement.innerHTML = "";

  const path = createSnakePath(rows, cols);

  path.forEach((_, index) => {
    const tile = document.createElement("div");
    tile.classList.add("tile");
    const tileNumber = document.createElement("span");
    tileNumber.classList.add("tile-number");

    if (index === 0) {
      tile.classList.add("start");
      tileNumber.textContent = "Start";
      tileNumber.classList.add("tile-label");
    } else if (index === path.length - 1) {
      tile.classList.add("goal");
      tileNumber.textContent = "Ziel";
      tileNumber.classList.add("tile-label");
    } else {
      tileNumber.textContent = `${index + 1}`;
    }

    tile.append(tileNumber);
    boardElement.append(tile);
  });
};

const getSelectedConfig = () => {
  const selected = Array.from(sizeInputs).find((input) => input.checked);
  return boardConfigs[selected?.value ?? "short"] ?? boardConfigs.short;
};

sizeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    renderBoard(getSelectedConfig());
  });
});

startButton?.addEventListener("click", () => {
  window.alert("Das Spiel startet bald – bleib dran!");
});

renderBoard(getSelectedConfig());
