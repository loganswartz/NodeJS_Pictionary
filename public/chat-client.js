let socket = io.connect();

let loginPage = document.querySelector('#login');
let loginBox = document.querySelector('#login-box');
let playerNameBox = document.querySelector('#player-name-box');
let playerName = document.querySelector('#player-name');
let pictionaryPage = document.querySelector('#pictionary');
let newGameButton = document.querySelector('#new-game-button');
let joinGame = document.querySelector('#join-game');
let drawInfo = document.querySelector('#draw-info');
let guesserInput = document.querySelector('#guesser-input');
let gameNotFound = document.querySelector('#game-not-found');
let gameCode = document.querySelector('#game-code');
let playerInfo = document.querySelector('#player-info');
let winnerPage = document.querySelector('#winner-screen');
let winnerText = document.querySelector('#winner-text');
let inGame = false;
let guessWindow = document.querySelector('#guess-window').querySelector('div');
let newWordButton = document.querySelector('#new-word-button');

// the validated game code of this client to be shared by other files
let clientGameCode = '';
let gameInitMode = '';

function clear_inputs() {
	playerName.value = '';
	joinGame.value = '';
	guesserInput.value = '';
}

function hide_all_pages() {
	let pages = document.querySelectorAll('.page');
	for(i=0; i<pages.length; i++) {
		pages[i].style.display = 'none';
	}
}

newGameButton.addEventListener('click', () => {
	loginBox.style.display = 'none';
	playerNameBox.style.display = 'block';
	gameInitMode = 'new';
});

joinGame.addEventListener('keyup', (e) => {
	if(e.keyCode === 13) {
		loginBox.style.display = 'none';
		playerNameBox.style.display = 'block';
		gameInitMode = 'join';
		playerName.focus();
	}
});

playerName.addEventListener('keyup', (e) => {
	if(e.keyCode === 13) {
		if (gameInitMode === 'new') {
			socket.emit('new_game', playerName.value);
		} else {
			socket.emit('join_game', joinGame.value, playerName.value);
		}
		hide_all_pages();
		gameNotFound.style.display = 'none';
		pictionaryPage.style.display = 'block';
		playerNameBox.style.display = 'none';
	}
});

guesserInput.addEventListener('keyup', (e) => {
	if(e.keyCode === 13 && guesserInput != '') {
		socket.emit('make_guess', guesserInput.value);
		guesserInput.value = '';
	}
});

newWordButton.addEventListener('click', (e) => {
	socket.emit('request_new_word');
});

socket.on('game_found', () => {
	hide_all_pages();
	loginPage.style.display = 'none';
	gameNotFound.style.display = 'none';
	playerNameBox.style.display = 'none';
	pictionaryPage.style.display = 'block';
	inGame = true;
});

socket.on('game_not_found', () => {
	hide_all_pages();
	loginPage.style.display = 'block';
	loginBox.style.display = 'flex';
	gameNotFound.style.display = 'block';
	playerNameBox.style.display = 'none';
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
		pictionaryPage.style.display = 'block';
		drawInfo.style.display = 'block';
		guesserInput.style.display = 'none';
		newWordButton.style.display = 'block';
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
		pictionaryPage.style.display = 'block';
		drawInfo.style.display = 'none';
		guesserInput.style.display = 'block';
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


socket.on('winner', (playerName) => {
	hide_all_pages();
	winnerPage.style.display = 'block';
	winnerText.innerHTML = playerName + ' was the winner!';
})

socket.on('display_guess', (playerName, guess) => {
	guessWindow.innerHTML += `<div><span class="chat-player">${playerName}:</span> <span class="chat-guess">${guess}</span></div>`;
});

socket.on('player_joined', (name) => {
	M.toast({html: `${name} has joined the game`});
});

socket.on('player_left', (name) => {
	M.toast({html: `${name} has left the game`});
});

socket.on('start_new_game', () => {
	hide_all_pages();
	gameNotFound.style.display = 'none';
	pictionaryPage.style.display = 'block';
	playerNameBox.style.display = 'none';
	clear();
});
