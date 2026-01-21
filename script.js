const panelImage = document.getElementById("panel-image");
const streakEl = document.getElementById("streak");
const topScoresEl = document.getElementById("top-scores");
const feedbackEl = document.getElementById("feedback");
const guessInput = document.getElementById("guess-input");
const guessForm = document.getElementById("guess-form");
const submitButton = document.getElementById("submit-btn");
const nextButton = document.getElementById("next-btn");
const filterCheckbox = document.getElementById("filter-spot");
const datalist = document.getElementById("arc-list");

const STORAGE_KEYS = {
  STREAK: "streak",
  TOP_SCORES: "topScores",
  FILTER_SPOT: "filterSpot"
};

let panelsData = null;
let nonSpotArcNames = [];
let currentAnswer = "";
let currentImage = "";
let roundActive = false;
let currentFilterSpot = localStorage.getItem(STORAGE_KEYS.FILTER_SPOT) === "true";

let streak = Number(localStorage.getItem(STORAGE_KEYS.STREAK));
if (!Number.isFinite(streak) || streak < 0) {
  streak = 0;
}

let topScores = JSON.parse(localStorage.getItem(STORAGE_KEYS.TOP_SCORES));
if (!Array.isArray(topScores)) {
  topScores = [0, 0, 0];
} else {
  topScores = topScores
    .map((score) => Number(score) || 0)
    .sort((a, b) => b - a)
    .slice(0, 3);
  while (topScores.length < 3) {
    topScores.push(0);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  filterCheckbox.checked = currentFilterSpot;
  updateStreakDisplay();
  renderTopScores();
  loadRandomPanel(currentFilterSpot);
});

panelImage.onerror = () => {
  feedbackEl.textContent = "Failed to load image. Please try another panel.";
  roundActive = false;
  nextButton.hidden = false;
  submitButton.disabled = true;
  guessInput.disabled = true;
  nextButton.focus();
};

function updateStreakDisplay() {
  streakEl.textContent = `Streak: ${streak}`;
}

function renderTopScores() {
  const medalIcons = ["🥇", "🥈", "🥉"];
  const entries = topScores
    .slice(0, 3)
    .map((score, index) => `${medalIcons[index]} ${score}`)
    .join("<br>");

  topScoresEl.innerHTML = `<strong>Top Scores:</strong><br>${entries}`;
}

function recordTopScore(score) {
  if (score <= 0) return;
  topScores = [...topScores, score]
    .sort((a, b) => b - a)
    .slice(0, 3);
  localStorage.setItem(STORAGE_KEYS.TOP_SCORES, JSON.stringify(topScores));
  renderTopScores();
}

async function ensurePanelsData() {
  if (panelsData) return panelsData;

  const response = await fetch("data/panels.json");
  if (!response.ok) {
    throw new Error(`Failed to load panel data (${response.status})`);
  }

  panelsData = await response.json();
  if (panelsData?.ArcTags) {
    nonSpotArcNames = Object.entries(panelsData.ArcTags)
      .filter(([, tags]) => !tags.includes("Spot"))
      .map(([arcName]) => arcName);
  }
  return panelsData;
}

function populateArcList(arcNames) {
  datalist.innerHTML = "";
  const shuffled = [...arcNames];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  shuffled.forEach((arc) => {
    const option = document.createElement("option");
    option.value = arc;
    datalist.appendChild(option);
  });
}

async function loadRandomPanel(dontShowSpot) {
  filterCheckbox.disabled = true;
  guessInput.disabled = true;
  nextButton.hidden = true;
  feedbackEl.textContent = "Loading panel...";

  try {
    const data = await ensurePanelsData();
    currentFilterSpot = dontShowSpot;
    localStorage.setItem(
      STORAGE_KEYS.FILTER_SPOT,
      dontShowSpot ? "true" : "false"
    );

    const arcNames = dontShowSpot ? nonSpotArcNames : Object.keys(data.Arcs);
    if (!arcNames.length) {
      throw new Error("No arcs available for the selected filter.");
    }

    populateArcList(arcNames);

    const randomArcIndex = Math.floor(Math.random() * arcNames.length);
    currentAnswer = arcNames[randomArcIndex];

    const arcPanels = data.Arcs[currentAnswer];
    const randomPanelIndex = Math.floor(Math.random() * arcPanels.length);
    currentImage = arcPanels[randomPanelIndex];

    panelImage.src = currentImage;
    feedbackEl.textContent = "";
    guessInput.value = "";
    guessInput.focus();
    roundActive = true;
  } catch (error) {
    console.error(error);
    feedbackEl.textContent = error.message || "Failed to load panel data.";
    roundActive = false;
    nextButton.hidden = false;
  } finally {
    filterCheckbox.disabled = false;
    guessInput.disabled = false;
    submitButton.disabled = false;
  }
}

function handleGuess(event) {
  event.preventDefault();
  if (!roundActive) {
    return;
  }

  const guess = guessInput.value.trim();
  if (!guess) {
    feedbackEl.textContent = "Please enter an arc name before guessing.";
    return;
  }

  submitButton.disabled = true;
  guessInput.disabled = true;

  const normalizedGuess = guess.toLowerCase();
  const normalizedAnswer = currentAnswer.toLowerCase();

  if (normalizedGuess === normalizedAnswer) {
    streak += 1;
    localStorage.setItem(STORAGE_KEYS.STREAK, streak);
    updateStreakDisplay();
    feedbackEl.textContent = `Correct! That panel was from "${currentAnswer}".`;
  } else {
    feedbackEl.textContent = `Incorrect. It was "${currentAnswer}".`;
    recordTopScore(streak);
    streak = 0;
    localStorage.setItem(STORAGE_KEYS.STREAK, streak);
    updateStreakDisplay();
  }

  roundActive = false;
  nextButton.hidden = false;
  nextButton.focus();
}

guessForm.addEventListener("submit", handleGuess);

nextButton.addEventListener("click", () => {
  loadRandomPanel(currentFilterSpot);
});

filterCheckbox.addEventListener("change", (event) => {
  const isChecked = event.target.checked;
  loadRandomPanel(isChecked);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !nextButton.hidden) {
    event.preventDefault();
    nextButton.click();
  }
});
