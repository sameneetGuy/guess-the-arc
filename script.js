let currentAnswer = "Imaginate";
let currentImage = "";
let streak = localStorage.getItem("streak") || 0;
let topScores = JSON.parse(localStorage.getItem("topScores")) || [0, 0, 0];

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

    const allArcNames = Object.keys(data.Arcs);

    // Pick a random arc for the correct answer
    const randomArcIndex = Math.floor(Math.random() * allArcNames.length);
    currentAnswer = allArcNames[randomArcIndex];

    // Pick a random panel from that arc
    const arcPanels = data.Arcs[currentAnswer];
    const randomPanelIndex = Math.floor(Math.random() * arcPanels.length);
    currentImage = arcPanels[randomPanelIndex];

    // Shuffle arc names for display
    const shuffledArcNames = shuffleArray([...allArcNames]);

    // Populate the datalist
    const datalist = document.getElementById("arc-list");
    datalist.innerHTML = "";
    shuffledArcNames.forEach(arc => {
      const option = document.createElement("option");
      option.value = arc;
      datalist.appendChild(option);
    });

    // Update the image and streak
    document.getElementById("panel-image").src = currentImage;
    document.getElementById("streak").textContent = `Streak: ${streak}`;
	
	// Update Top Scores
	const medalIcons = ["🥇", "🥈", "🥉"];
	let scoreDisplay = "<strong>Top Scores:</strong><br>";

	topScores.forEach((score, index) => {
	  scoreDisplay += `${medalIcons[index]} ${score}<br>`;
	});

	document.getElementById("top-scores").innerHTML = scoreDisplay;
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
	
	// Add current streak to the list
	topScores.push(streak);

	// Sort and keep only top 3
	topScores = topScores.sort((a, b) => b - a).slice(0, 3);

	// Save back to localStorage
	localStorage.setItem("topScores", JSON.stringify(topScores));

	// Reset the Streak
    streak = 0;
    localStorage.setItem("streak", streak);
  }

	document.getElementById("streak").textContent = `Streak: ${streak}`;

	// Update Top Scores
	const medalIcons = ["🥇", "🥈", "🥉"];
	let scoreDisplay = "<strong>Top Scores:</strong><br>";

	topScores.forEach((score, index) => {
	  scoreDisplay += `${medalIcons[index]} ${score}<br>`;
	});

	document.getElementById("top-scores").innerHTML = scoreDisplay;
  
	document.getElementById("guess-input").value = ""; // Clear input
	setTimeout(() => {
		document.getElementById("feedback").textContent = ""; // Clear feedback
		loadRandomPanel(); // Load a new panel
	}, 1500); // Delay to let user see feedback
});

loadRandomPanel();
