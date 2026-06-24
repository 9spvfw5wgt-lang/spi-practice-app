const startScreen = document.querySelector("#start-screen");
const quizScreen = document.querySelector("#quiz-screen");
const resultScreen = document.querySelector("#result-screen");

const questionCount = document.querySelector("#question-count");
const categoryFilter = document.querySelector("#category-filter");
const startBtn = document.querySelector("#start-btn");
const retryBtn = document.querySelector("#retry-btn");
const copyNotionBtn = document.querySelector("#copy-notion-btn");

const progressText = document.querySelector("#progress-text");
const categoryBadge = document.querySelector("#category-badge");
const barFill = document.querySelector("#bar-fill");
const questionTitle = document.querySelector("#question-title");
const questionBody = document.querySelector("#question-body");
const choicesEl = document.querySelector("#choices");
const prevBtn = document.querySelector("#prev-btn");
const nextBtn = document.querySelector("#next-btn");

const scoreEl = document.querySelector("#score");
const feedbackEl = document.querySelector("#feedback");
const reviewList = document.querySelector("#review-list");

let quiz = [];
let current = 0;
let answers = [];

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function startQuiz() {
  const count = Number(questionCount.value);
  const category = categoryFilter.value;
  const pool = category === "all"
    ? QUESTION_BANK
    : QUESTION_BANK.filter(q => q.category === category);

  quiz = shuffle(pool).slice(0, Math.min(count, pool.length));
  answers = Array(quiz.length).fill(null);
  current = 0;

  startScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  quizScreen.classList.remove("hidden");
  renderQuestion();
}

function renderQuestion() {
  const q = quiz[current];
  progressText.textContent = `${current + 1} / ${quiz.length}`;
  categoryBadge.textContent = q.category;
  barFill.style.width = `${((current + 1) / quiz.length) * 100}%`;
  questionTitle.textContent = q.title;
  questionBody.textContent = q.body;

  choicesEl.innerHTML = "";
  q.choices.forEach((choice, index) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    if (answers[current] === index) btn.classList.add("selected");
    btn.textContent = `${String.fromCharCode(65 + index)}. ${choice}`;
    btn.addEventListener("click", () => {
      answers[current] = index;
      renderQuestion();
    });
    choicesEl.appendChild(btn);
  });

  prevBtn.disabled = current === 0;
  nextBtn.textContent = current === quiz.length - 1 ? "採点する" : "次へ";
}

function nextQuestion() {
  if (current < quiz.length - 1) {
    current += 1;
    renderQuestion();
  } else {
    showResult();
  }
}

function prevQuestion() {
  if (current > 0) {
    current -= 1;
    renderQuestion();
  }
}

function showResult() {
  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  const correctCount = quiz.reduce((sum, q, i) => sum + (answers[i] === q.answer ? 1 : 0), 0);
  const rate = Math.round((correctCount / quiz.length) * 100);

  scoreEl.textContent = `${correctCount} / ${quiz.length} 正解（${rate}%）`;

  if (rate === 100) {
    feedbackEl.textContent = "全問正解。かなり良いです。次は出題数を増やすか、問題を難しくしてOK。";
  } else if (rate >= 80) {
    feedbackEl.textContent = "かなり良い感じ。間違えた問題だけ復習すれば伸びます。";
  } else if (rate >= 60) {
    feedbackEl.textContent = "基礎は見えてます。二語の関係は『何と何の関係か』を言語化すると安定します。";
  } else {
    feedbackEl.textContent = "まずは解説を読んで、問題文の関係性を一文で説明する練習からいきましょう。";
  }

  renderReview();
  saveStats(correctCount, quiz.length);
}

function renderReview() {
  reviewList.innerHTML = "";

  quiz.forEach((q, i) => {
    const item = document.createElement("div");
    item.className = "review-item";

    const isCorrect = answers[i] === q.answer;
    const userAnswer = answers[i] === null ? "未回答" : q.choices[answers[i]];
    const correctAnswer = q.choices[q.answer];

    item.innerHTML = `
      <strong>Q${i + 1}. ${q.title} <span class="${isCorrect ? "correct" : "wrong"}">${isCorrect ? "正解" : "不正解"}</span></strong>
      <p>${q.body.replaceAll("\n", "<br>")}</p>
      <p>あなたの回答：${userAnswer}</p>
      <p>正解：${correctAnswer}</p>
      <p>解説：${q.explanation}</p>
    `;

    reviewList.appendChild(item);
  });
}

function makeNotionText() {
  const wrongs = quiz
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => answers[i] !== q.answer);

  if (wrongs.length === 0) {
    return "## SPI復習\n\n全問正解。復習対象なし。";
  }

  return [
    "## SPI復習：間違えた問題",
    "",
    ...wrongs.flatMap(({ q, i }) => [
      `### Q${i + 1} ${q.category}`,
      q.body,
      `- 自分の回答：${answers[i] === null ? "未回答" : q.choices[answers[i]]}`,
      `- 正解：${q.choices[q.answer]}`,
      `- 解説：${q.explanation}`,
      ""
    ])
  ].join("\n");
}

async function copyNotionText() {
  const text = makeNotionText();
  try {
    await navigator.clipboard.writeText(text);
    copyNotionBtn.textContent = "コピーしました";
    setTimeout(() => copyNotionBtn.textContent = "間違いをNotion用にコピー", 1500);
  } catch {
    alert(text);
  }
}

function saveStats(correct, total) {
  const old = JSON.parse(localStorage.getItem("spi-stats") || "[]");
  old.push({ date: new Date().toISOString(), correct, total });
  localStorage.setItem("spi-stats", JSON.stringify(old.slice(-50)));
}

startBtn.addEventListener("click", startQuiz);
retryBtn.addEventListener("click", () => {
  resultScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
});
copyNotionBtn.addEventListener("click", copyNotionText);
nextBtn.addEventListener("click", nextQuestion);
prevBtn.addEventListener("click", prevQuestion);
