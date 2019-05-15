let socket = io.connect();

let login = document.querySelector('#login');
let loginBox = document.querySelector('#login-box');
let playerNameBox = document.querySelector('#player-name-box');
let playerName = document.querySelector('#player-name');
let pictionary = document.querySelector('#pictionary');
let newGameButton = document.querySelector('#new-game-button');
let joinGame = document.querySelector('#join-game');
let drawInfo = document.querySelector('#draw-info');
let guesserInput = document.querySelector('#guesser-input');
let gameNotFound = document.querySelector('#game-not-found');
let gameCode = document.querySelector('#game-code');
let playerInfo = document.querySelector('#player-info');
let inGame = false;

// the validated game code of this client to be shared by other files
let clientGameCode = '';
let gameInitMode = '';

function clear_inputs() {
	playerName.value = '';
	joinGame.value = '';
	guesserInput.value = '';
}

newGameButton.addEventListener('click', () => {
	loginBox.style.display = 'none';
	playerNameBox.style.display = 'block';
	gameInitMode = 'new';
});

joinGame.addEventListener('change', () => {
	loginBox.style.display = 'none';
	playerNameBox.style.display = 'block';
	gameInitMode = 'join';
});

playerName.addEventListener('change', () => {
	login.style.display = 'none';
	pictionary.style.display = 'block';
	if (gameInitMode === 'new') {
		socket.emit('new_game', playerName.value);
	} else {
		socket.emit('join_game', joinGame.value, playerName.value);
	}
});

socket.on('game_found', () => {
	login.style.display = 'none';
	gameNotFound.style.display = 'none';
	inGame = true;
});

socket.on('game_not_found', () => {
	gameNotFound.style.display = 'block';
});

socket.on('game_code', (code) => {
	gameCode.innerHTML += code;
	clientGameCode = code;
});

socket.on('game_word', (word) => {
	drawInfo.innerHTML = 'You are drawing: "' + word + '"';
});

socket.on('active_players', (players) => {
	console.log(players)
	playerInfo.innerHTML = '';
	players.forEach((player) => {
		playerInfo.innerHTML += `<span>${player}</span>`;
	});
});

socket.on('player_role', (role) => {
	if (role === 'drawer') {
		pictionary.style.display = 'block';
		drawInfo.style.display = 'block';
		guesserInput.style.display = 'none';
		// enable drawing if drawer
		mouseDragged = function() {
			strokeWeight(stroke_weight);
			stroke(stroke_color);
			line(mouseX, mouseY, pmouseX, pmouseY);
			let line_data = {
				"x1": mouseX,
				"y1": mouseY,
				"x2": pmouseX,
				"y2": pmouseY,
				"weight": stroke_weight,
				"color": stroke_color
			}
		socket.emit('draw_event', line_data);
		}
	} else {
		pictionary.style.display = 'block';
		drawInfo.style.display = 'none';
		// disable drawing if guesser
		mouseDragged = function() {return};
	}
});

socket.on('quit_game', () => {
	location.reload();
});

socket.on('query_ingame', () => {
	socket.emit('answer_ingame', inGame);
});

socket.on('player_joined', (name) => {
	M.toast({html: `${name} has joined the game`});
});

socket.on('player_left', (name) => {
	M.toast({html: `${name} has left the game`});
});
