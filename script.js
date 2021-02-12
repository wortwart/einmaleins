const time = 8;
const minFactor = 2;
const maxFactor = 9;
const success = 10;
const fail = -15;

const userForm = document.getElementById('userForm');
const userInput = userForm.querySelector('input');
const datalist = document.getElementById('users');
const startBtn = document.getElementById('start');
const main = document.querySelector('main');
const clock = document.getElementById('clock');
const quiz = document.getElementById('quiz');
const quizTask = document.getElementById('quiz-task');
const answer = document.getElementById('answer');
const scoreEl = document.getElementById('score');
const comment = document.getElementById('comment');
const result = document.getElementById('result');
const resultText = document.getElementById('result-text');
const restart = document.getElementById('restart');

const comments = {
	good: [
		'Nicht schlecht',
		'Hätte ich dir nicht zugetraut!',
		'Lass ich durchgehen',
		'Ja, okay.',
		'Zufallstreffer.',
		'Na gut',
		'Wie hast du das gemacht?',
		'Leg den Taschenrechner weg!',
		'Erstaunlich.',
		'War zu einfach, oder?'
	],
	bad: [
		'Oje.',
		'Das Gehirn wächst hoffentlich noch.',
		'Es ist zum Verzweifeln.',
		'Von mir habt ihr das nicht.',
		'Sollen wir was anderes probieren?',
		'(leises Weinen)',
		'Rechnen ist nicht so deine Stärke, oder?',
		'Puh.',
		'Ich bin deprimiert.',
		'Geh mal raus, dein Gehirn auslüften.',
		'DAS KANN JA WOHL NICHT WAHRSEIN!',
		'Wofür schicken wir dich eigentlich in die Schule?'
	]
}

let user, start, end, precisionTime, score, results, solution, state;

const init = () => {
	start = 0;
	end = 0;
	precisionTime = 0;
	score = 0;
	results = [];
	solution = 0;
	main.classList.remove('covered');
	main.classList.add('hidden');
	result.classList.add('hidden');
	state = 'init';
}

init();
const users = getUsers();
for (const user of users) {
	const option = document.createElement('option');
	option.setAttribute('value', user);
	datalist.appendChild(option);
}

userForm.addEventListener('submit', ev => {
	ev.preventDefault();
	if (state !== 'init') return;
	user = addUser(userInput.value);
	userForm.classList.add('hidden');
});

userForm.addEventListener('transitionend', () => {
	userForm.classList.add('shrink');
	userForm.removeAttribute('autofocus');
	startBtn.classList.remove('hidden');
	startBtn.focus();
});

startBtn.addEventListener('click', () => {
	if (state !== 'init') return;
	startBtn.classList.add('hidden');
});

startBtn.addEventListener('transitionend', () => {
	if (startBtn.classList.contains('hidden')) {
		startBtn.classList.add('shrink');
		main.classList.remove('hidden');
		answer.focus();
		startGame();
	}
});

const startGame = () => {
	state = 'running';
	comments.textContent = '\u00a0';
	scoreEl.textContent = score;
	createTask();
	precisionTime = time * 1000;
	start = Date.now();
	end = start + precisionTime;
	clock.textContent = time;
	tick();
}

const stopGame = () => {
	if (state === 'ended') return;
	state = 'ended';
	answer.blur();
	main.classList.add('covered');
	const wrong = results.filter(item => !item).length;
	const topscore = highscore(user);
	resultText.innerHTML = `
		Du hast <b>${results.length} Aufgaben</b> gelöst und dabei <b>${score} Punkte</b> erzielt. `;
		resultText.innerHTML += wrong? `Bei ${wrong} Aufgabe${wrong === 1? '' : 'n'} lagst du daneben.` : `Alle deine Lösungen waren richtig! Fühl dich auf die Schulter geklopft!`;
	if (topscore) {
		resultText.innerHTML += `<br>Du hast bisher ${playCount(user)} Mal gespielt. Dein bisher bestes Ergebnis waren ${topscore} Punkte.`;
		if (topscore < score)
		resultText.innerHTML += ` In diesem Spiel hast du es übertroffen – Glückwunsch!`;
	}
	result.classList.remove('hidden');
	saveScore(user, score);
}

const tick = () => {
	const now = Date.now();
	const remaining = start + precisionTime - now;
	if (remaining <= 0) {
		clock.textContent = '0';
		stopGame();
	} else {
		clock.textContent = Math.ceil(remaining/1000);
		requestAnimationFrame(tick);
	}
}

const randomNumber = (from, to) => Math.floor(Math.random() * to) + from;

const createTask = () => {
	answer.value = '';
	const f1 = randomNumber(minFactor, (maxFactor - minFactor));
	const f2 = randomNumber(minFactor, (maxFactor - minFactor));
	quizTask.textContent = `${f1} \u00d7 ${f2} =`
	solution = f1 * f2;
}

quiz.addEventListener('submit', ev => {
	if (state !== 'running') return;
	ev.preventDefault();
	if (answer.value.trim() === solution.toString()) {
		score += success;
		comment.textContent = comments.good[randomNumber(0, comments.good.length)];
		results.push(true);
	} else {
		score += fail;
		comment.textContent = comments.bad[randomNumber(0, comments.bad.length)] + ` – Richtig war: ${solution}.`;
		results.push(false);
	}
	scoreEl.textContent = score;
	createTask();
});

restart.addEventListener('click', () => {
	init();
	startBtn.classList.remove('hidden', 'shrink');
	startBtn.focus();
});
