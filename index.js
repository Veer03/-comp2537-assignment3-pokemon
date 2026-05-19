let firstCard = undefined;
let secondCard = undefined;
let lockBoard = false;
let clicks = 0;
let matchedPairs = 0;
let totalPairs = 0;
let timer = null;
let timeLeft = 0;
let gameStarted = false;
let allPokemon = [];

const difficulty = {
  easy: { pairs: 3, time: 60 },
  medium: { pairs: 6, time: 45 },
  hard: { pairs: 9, time: 30 },
};

async function fetchAllPokemon() {
  const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
  const data = await res.json();
  allPokemon = data.results;
}

async function getRandomPokemon(count) {
  const shuffled = [...allPokemon].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  const promises = selected.map((p) => fetch(p.url).then((r) => r.json()));
  const details = await Promise.all(promises);
  return details.map((p) => ({
    name: p.name,
    img: p.sprites.other["official-artwork"].front_default,
  }));
}

function updateStatus() {
  $("#clicks").text(clicks);
  $("#matched").text(matchedPairs);
  $("#pairs-left").text(totalPairs - matchedPairs);
  $("#total").text(totalPairs);
  $("#time").text(timeLeft);
}

function startTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    timeLeft--;
    updateStatus();
    if (timeLeft <= 0) {
      clearInterval(timer);
      gameOver();
    }
  }, 1000);
}

function gameOver() {
  lockBoard = true;
  $("#message")
    .text("Game Over! You ran out of time!")
    .css("color", "red")
    .show();
}

function gameWin() {
  clearInterval(timer);
  lockBoard = true;
  $("#message").text("You Win! Congratulations!").css("color", "green").show();
}

async function startGame() {
  const level = $("#difficulty").val();
  const { pairs, time } = difficulty[level];
  totalPairs = pairs;
  timeLeft = time;
  clicks = 0;
  matchedPairs = 0;
  firstCard = undefined;
  secondCard = undefined;
  lockBoard = false;
  gameStarted = true;

  $("#message").hide();
  $("#game_grid").empty();
  clearInterval(timer);
  updateStatus();

  const pokemon = await getRandomPokemon(pairs);
  const cards = [...pokemon, ...pokemon].sort(() => Math.random() - 0.5);

  cards.forEach((p, i) => {
    const card = $(`
      <div class="card" data-name="${p.name}">
        <img class="front_face" src="${p.img}" alt="${p.name}">
        <img class="back_face" src="back.webp" alt="back">
      </div>
    `);
    $("#game_grid").append(card);
  });

  setupCards();
  startTimer();
}

function setupCards() {
  $(".card").on("click", function () {
    if (lockBoard) return;
    if ($(this).hasClass("flip")) return;
    if ($(this).hasClass("matched")) return;

    $(this).addClass("flip");
    clicks++;
    updateStatus();

    if (!firstCard) {
      firstCard = $(this);
    } else {
      secondCard = $(this);
      lockBoard = true;

      if (firstCard.data("name") === secondCard.data("name")) {
        firstCard.addClass("matched").off("click");
        secondCard.addClass("matched").off("click");
        matchedPairs++;
        updateStatus();
        firstCard = undefined;
        secondCard = undefined;
        lockBoard = false;

        if (matchedPairs === totalPairs) gameWin();
      } else {
        setTimeout(() => {
          firstCard.removeClass("flip");
          secondCard.removeClass("flip");
          firstCard = undefined;
          secondCard = undefined;
          lockBoard = false;
        }, 1000);
      }
    }
  });
}

function resetGame() {
  clearInterval(timer);
  $("#game_grid").empty();
  $("#message").hide();
  clicks = 0;
  matchedPairs = 0;
  firstCard = undefined;
  secondCard = undefined;
  lockBoard = false;
  gameStarted = false;
  updateStatus();
}

function peekPowerUp() {
  if (!gameStarted || lockBoard) return;
  lockBoard = true;
  $(".card:not(.matched)").addClass("flip");
  setTimeout(() => {
    $(".card:not(.matched)").removeClass("flip");
    lockBoard = false;
  }, 2000);
}

$(document).ready(async function () {
  await fetchAllPokemon();

  $("#start").on("click", startGame);
  $("#reset").on("click", resetGame);
  $("#peek").on("click", peekPowerUp);

  $("#theme-toggle").on("click", function () {
    $("body").toggleClass("dark");
    $(this).text($("body").hasClass("dark") ? "Light Mode" : "Dark Mode");
  });
});
