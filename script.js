const defaultTime = 120;
const success = 10;
const fail = -15;

const types = [
	{
		name: '1 \u00d7 1',
		value: '1x1',
	},
	{
		name: '1 \u00d7 10 einfach',
		value: '1x10 einfach',
	},
	{
		name: '1 \u00d7 10',
		value: '1x10',
	},
	{
		name: '10 \u00d7 10 einfach',
		value: '10x10 einfach',
	},
	{
		name: '10 \u00d7 10',
		value: '10x10',
	},
];

const userForm = document.getElementById('userForm');
const userInput = userForm.querySelector('input');
const datalist = document.getElementById('users');
const settingsForm = document.getElementById('settings');
const settingFields = settingsForm.querySelectorAll('[name]');
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
		'Wofür schicken wir dich eigentlich in die Schule?',
		'Gnade!'
	]
}

let user, start, end, precisionTime, score, results, solution, state, pauseTime,pauseStart, toSpeak;
const settings = {
	time: defaultTime,
	type: types[0].value,
	voice: true,
	pause: true,
	bgcolor: '#' + getComputedStyle(document.body)
		.backgroundColor.match(/\d+/g)
		.map(x => (+x).toString(16).padStart(2, 0))
		.join``,
};

// Show game types in select menu
const typeSelect = document.querySelector('[name="type"]');
while (typeSelect.firstChild)
	typeSelect.removeChild(typeSelect.firstChild);
for (const t of types) {
	const o = document.createElement('option');
	o.setAttribute('value', t.value);
	o.textContent = t.name;
	typeSelect.appendChild(o);
}

// Read parameters
const params = {};
location.search.slice(1).split('&').forEach(item => {
	const keyVal = item.split('=');
	settings[keyVal[0]] = keyVal[1] === undefined? true : keyVal[1];
});
settings.time = isNaN(+settings.time)? defaultTime : +settings.time;
settings.type = types.some(t => t.value === settings.type)?
	settings.type :
	types[0].value;

// Display settings in settings form
const initSettings = () => {
	for (const settingField of settingFields) {
		const fname = settingField.getAttribute('name');
		if (typeof settings[fname] === 'boolean') {
			if (settings[fname])
				settingField.setAttribute('checked', 'checked');
			else
				settingField.removeAttribute('checked');
		} else {
			settingField.value = settings[fname]? decodeURIComponent(settings[fname]) : null;
		}
	}
}

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

userForm.addEventListener('submit', ev => {
	ev.preventDefault();
	if (state !== 'init') return;
	state = 'login';
	user = addUser(userInput.value);
	userForm.classList.add('hidden');
	startBtn.textContent = startBtn.textContent.replace('$', user);
	restart.textContent = restart.textContent.replace('$', user);
});

userForm.addEventListener('transitionend', () => {
	if (state !== 'login') return;
	state = 'loggedin';
	userForm.classList.add('shrink');
	userForm.removeAttribute('autofocus');
	initSettings();
	settingsForm.classList.remove('hidden');
	startBtn.focus();
});

if (settings.pause)
	nextBtn.setAttribute('disabled', 'true');
else
	nextBtn.style.display = 'none';

startBtn.addEventListener('click', ev => {
	ev.preventDefault();
	if (state !== 'loggedin') return;

	// read settings form data to settings
	for (const field of settingFields) {
		if (field.name === 'bgcolor') {
			document.body.style.backgroundColor = field.value;
			continue;
		}
		settings[field.name] = field.type === 'checkbox'? field.checked : field.value;
	}

	aside.classList.add('hidden');
	settingsForm.classList.add('hidden');
});

settingsForm.addEventListener('transitionend', () => {
	if (state !== 'loggedin') return;
	if (settingsForm.classList.contains('hidden')) {
		settingsForm.classList.add('shrink');
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
	precisionTime = settings.time * 1000;
	start = Date.now();
	end = start + precisionTime;
	clock.textContent = settings.time;
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
	saveScore(user, {
		time: +settings.time,
		type: settings.type,
		score
	});
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
	let shuffle = false;

	if (settings.type === '1x1') {
		f1 = (randomNumber(2, (9 - 2)));
		f2 = (randomNumber(2, (9 - 2)));

	} else if (settings.type === '1x10 einfach') {
		f1 = (randomNumber(2, (9 - 2)));
		f2 = (randomNumber(2, (9 - 2)));
		f1 *= 10;
		shuffle = true;

	} else if (settings.type === '1x10') {
		f1 = (randomNumber(2, (99 - 2)));
		f2 = (randomNumber(2, (9 - 2)));
		shuffle = true;

	} else if (settings.type === '10x10 einfach') {
		f1 = (randomNumber(2, (30 - 2)));
		f2 = (randomNumber(2, (20 - 2)));
		shuffle = true;

	} else if (settings.type === '10x10') {
		f1 = (randomNumber(2, (99 - 2)));
		f2 = (randomNumber(2, (99 - 2)));
	}

	if (shuffle && randomNumber(0, 1))
		[f1, f2] = [f2, f1];
	quizTask.textContent = `${f1} \u00d7 ${f2} =`
	solution = f1 * f2;
}

quiz.addEventListener('submit', ev => {
	if (state !== 'running') return;
	ev.preventDefault();
	if (settings.pause)
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

	if (settings.voice && speechSynthesis) {
		toSpeak = new SpeechSynthesisUtterance();
		toSpeak.text = comment.textContent;
		toSpeak.lang = 'de';
		toSpeak.rate = 1;
		toSpeak.pitch = 1.5;
		speechSynthesis.cancel();
		speechSynthesis.speak(toSpeak);
	}
	scoreEl.textContent = score;
	if (!settings.pause)
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
	settingsForm.classList.remove('hidden', 'shrink');
	state = 'loggedin';
	startBtn.focus();
});
