const USERS = 'users';
const SCORES = 'scores';

const storeGet = prop => {
	const st = localStorage.getItem(prop);
	return st? JSON.parse(st) : st;
}

const storeSet = (prop, value) => localStorage.setItem(prop, JSON.stringify(value));

const getUsers = () => storeGet(USERS);

const addUser = name => {
	if (typeof name !== 'string' || name.length < 3 || name === USERS) {
		alert('Ungültiger Name!');
		return;
	}

	const users = getUsers() || [];
	if (users.indexOf(name) < 0) {
		users.push(name);
		storeSet(USERS, users);
	}

	const scores = storeGet(SCORES);
	if (!scores[name]) {
		scores[name] = [];
		storeSet(SCORES, scores);
	}
	return name;
}

const highscore = name => Math.max.apply(null, storeGet(SCORES)[name]) || 0;

const playCount = name => storeGet(SCORES)[name].length || 0;

const saveScore = (name, score) => {
	const scores = storeGet(SCORES);
	scores[name].push(score);
	storeSet(SCORES, scores);
}

const getScores = name => storeGet(SCORES)[name]

if (storeGet(USERS) === null)
	storeSet(USERS, []);
if (storeGet(SCORES) === null)
	storeSet(SCORES, {});
