let time = 120;
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
const nextBtn = document.getElementById('next');
const aside = document.querySelector('aside');

const comments = {
	good: [
		'Nicht schlecht.',
		'Hätte ich dir nicht zugetraut!',
		'Lass ich durchgehen.',
		'Ja, okay.',
		'Zufallstreffer.',
		'Na gut.',
		'Wie hast du das gemacht?',
		'Leg den Taschenrechner weg!',
		'Erstaunlich.',
		'War zu einfach, oder?',
		'Gut, aber schaffst du das nochmal?',
		'Falsch! Sorry, kleiner Scherz.',
		'Lass mich nachsehen ... scheint zu stimmen.',
		'Moment, das war zu schnell für mich.',
		'Mhm.',
		'Fein, fein.',
		'Du Rechenheld, du!',
		'Hat hier jemand seine Hausaufgaben gemacht?',
		'Sapperlot!'
	],
	bad: [
		'Oje.',
		'Es ist zum Verzweifeln.',
		'Von mir habt ihr das nicht.',
		'Sollen wir was anderes probieren?',
		'(leises Weinen)',
		'Rechnen ist nicht so deine Stärke, oder?',
		'Vielleicht hast du ja andere Talente als Rechnen.',
		'Puh.',
		'Ich bin deprimiert.',
		'Geh mal raus, dein Gehirn auslüften.',
		'DAS KANN JA WOHL NICHT WAHR SEIN!',
		'Wofür schicken wir dich eigentlich in die Schule?'
	]
}

let user, start, end, precisionTime, score, results, solution, state, pauseTime,pauseStart, hasVoice, toSpeak, hasBreak;

// Read parameters
const params = {};
location.search.slice(1).split('&').forEach(item => {
	const keyVal = item.split('=');
	params[keyVal[0]] = keyVal[1] === undefined? true : keyVal[1];
});

hasVoice = params.voice;
time = params.time || time;
hasBreak = params.break;

// Init app
const init = () => {
	start = 0;
	end = 0;
	precisionTime = 0;
	score = 0;
	results = [];
	solution = 0;
	pauseStart = 0;
	pauseTime = 0;
	main.classList.remove('covered');
	main.classList.add('hidden');
	result.classList.add('hidden');
	resultText.innerHTML = '';
	resultText.style.position = 'absolute';
	state = 'init';
}

init();

const users = getUsers();
for (const user of users) {
	const option = document.createElement('option');
	option.setAttribute('value', user);
	datalist.appendChild(option);
}

if (hasBreak)
	nextBtn.setAttribute('disabled', 'true');
else
	nextBtn.style.display = 'none';

userForm.addEventListener('submit', ev => {
	ev.preventDefault();
	if (state !== 'init') return;
	user = addUser(userInput.value);
	userForm.classList.add('hidden');
	startBtn.textContent = startBtn.textContent.replace('$', user);
	restart.textContent = restart.textContent.replace('$', user);
});

userForm.addEventListener('transitionend', () => {
	userForm.classList.add('shrink');
	userForm.removeAttribute('autofocus');
	startBtn.classList.remove('hidden');
	startBtn.focus();
});

startBtn.addEventListener('click', () => {
	if (state !== 'init') return;
	aside.classList.add('hidden');
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
	comment.textContent = '\u00a0';
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
		${user}, du hast <b>${results.length} Aufgaben</b> gelöst und dabei <b>${score} Punkte</b> erzielt. `;
		if (results.length)
			resultText.innerHTML += wrong? `Bei ${wrong} Aufgabe${wrong === 1? '' : 'n'} lagst du daneben.` : `Alle deine Lösungen waren richtig! Fühl dich auf die Schulter geklopft!`;
		else
			resultText.innerHTML += `Schläfst du noch?`;
	if (topscore) {
		resultText.innerHTML += `<br>Du hast bisher ${playCount(user)} Mal gespielt. Dein bisher bestes Ergebnis waren ${topscore} Punkte.`;
		if (topscore < score)
		resultText.innerHTML += ` In diesem Spiel hast du es übertroffen – Glückwunsch!`;
	}
	resultText.style.position = 'static';
	result.classList.remove('hidden');
	saveScore(user, score);
	restart.focus();
}

const tick = () => {
	const now = Date.now();
	const remaining = start + pauseTime + precisionTime - now;
	if (remaining <= 0) {
		clock.textContent = '0';
		stopGame();
	} else {
		clock.textContent = Math.ceil(remaining/1000);
		if (state === 'paused')
			pauseStart = Date.now();
		else
			requestAnimationFrame(tick);
	}
}

const randomNumber = (from, to) => Math.floor(Math.random() * (to + 1)) + from;

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
	if (hasBreak)
		state = 'paused';
	if (answer.value.trim() === solution.toString()) {
		score += success;
		comment.textContent = comments.good[randomNumber(0, comments.good.length - 1)];
		results.push(true);
	} else {
		score += fail;
		comment.textContent = comments.bad[randomNumber(0, comments.bad.length - 1)] + ` – Richtig war: ${solution}`;
		results.push(false);
	}
	if (hasVoice && speechSynthesis) {
		toSpeak = new SpeechSynthesisUtterance();
		toSpeak.text = comment.textContent;
		toSpeak.lang = 'de';
		toSpeak.rate = 1;
		toSpeak.pitch = 1.5;
		speechSynthesis.cancel();
		speechSynthesis.speak(toSpeak);
	}
	scoreEl.textContent = score;
	if (!hasBreak)
		createTask();
	else {
		nextBtn.removeAttribute('disabled');
		nextBtn.focus();
	}
});

nextBtn.addEventListener('click', ev => {
	state = 'running';
	nextBtn.setAttribute('disabled', 'true');
	answer.focus();
	pauseTime += Date.now() - pauseStart;
	pauseStart = 0;
	tick();
	createTask();
});

restart.addEventListener('click', () => {
	init();
	startBtn.classList.remove('hidden', 'shrink');
	startBtn.focus();
});
