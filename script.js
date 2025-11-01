let currentAnswer = "Imaginate";
let currentImage = "";
let streak = localStorage.getItem("streak") || 0;

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function loadRandomPanel() {
  try {
    const res = await fetch("data/panels.json");
    const data = await res.json();

	const arcNames = shuffleArray(Object.keys(data.Arcs));
    const datalist = document.getElementById("arc-list");
    datalist.innerHTML = ""; // Clear previous options
	
    arcNames.forEach(arc => {
      const option = document.createElement("option");
      option.value = arc;
      datalist.appendChild(option);
    });

    // Pick a random arc and panel
    currentAnswer = arcNames[0]; // or randomize if you add more arcs
    const arcPanels = data.Arcs[currentAnswer];
    const randomIndex = Math.floor(Math.random() * arcPanels.length);
    currentImage = arcPanels[randomIndex];

    document.getElementById("panel-image").src = currentImage;
    document.getElementById("streak").textContent = `Streak: ${streak}`;
  } catch (error) {
    console.error("Error loading panel data:", error);
    document.getElementById("game").innerHTML = "<p>Failed to load panel data.</p>";
  }
}

document.getElementById("submit-btn").addEventListener("click", () => {
  const guess = document.getElementById("guess-input").value.trim().toLowerCase();
  const answer = currentAnswer.toLowerCase();

  if (guess === answer) {
    document.getElementById("feedback").textContent = "Correct!";
    streak++;
    localStorage.setItem("streak", streak);
  } else {
    document.getElementById("feedback").textContent = "Try again!";
    streak = 0;
    localStorage.setItem("streak", streak);
  }

  document.getElementById("streak").textContent = `Streak: ${streak}`;
  document.getElementById("guess-input").value = ""; // Clear input
  setTimeout(() => {
    document.getElementById("feedback").textContent = ""; // Clear feedback
    loadRandomPanel(); // Load a new panel
  }, 1500); // Delay to let user see feedback
});

loadRandomPanel();
