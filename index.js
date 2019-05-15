const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
const io = require('socket.io').listen(server);
const port = process.env.PORT || 3000;
const fs = require('fs');

let connections = [];
let gameWords = {};
let gameCode = 0;
let wordList = [];

server.listen(port);
console.log('Server Running...');

app.use(express.static('public'));


// initialize word list
fs.readFile('trimmed_word_list.json', (err, data) => {
	if (err) {
		throw err;
	} else {
		wordList = JSON.parse(data);
		wordList = wordList['words'];
	}
})


io.sockets.on('connection', (socket) => {
	connections.push(socket);
	console.log(`Connected: ${connections.length} sockets connected`);

	socket.emit('query_ingame');
	socket.on('answer_ingame', (inGame) => {
		if (inGame === true) {
			socket.emit('quit_game');
		}
	});

	socket.on('disconnect', () => {
		let gameCode = socket.gameCode;

		connections.splice(connections.indexOf(socket), 1);
		io.to(socket.gameCode).emit('active_players', getPlayerNames(socket.gameCode));

		if (socket.role === 'drawer') {
			let allClients = getClientsFromGame(gameCode);
			if(allClients.length > 0){
				let s = allClients[[getRandomNumberInRange(0, allClients.length)]];

				s.role = 'drawer';
				s.emit('player_role', s.role);
				s.emit('game_word', getCurrentWord(gameCode));
			}
		}

		// broadcast that this socket has left the game
		socket.broadcast.to(socket.gameCode).emit('player_left', socket.playerName);

		console.log(`Game #${socket.gameCode}: Player "${socket.playerName}" has left.`);
		console.log(`Disconnected: ${connections.length} sockets connected`);
	});

	socket.on('new_game', (playerName) => {
		// initialize game
		gameCode = generateGameCode();
		currentWord = getGameWord(wordList)
		gameWords[gameCode] = currentWord;

		console.log(`New game started (#${gameCode}) with the word "${currentWord}".`);

		// initialize player
		socket.gameCode = gameCode;
		socket.playerName = playerName;
		socket.role = 'drawer';
		socket.score = 0;

		// join player to game
		socket.join(gameCode);  // this needs to be before the room broadcast
		io.to(socket.gameCode).emit('active_players', getPlayerNames(gameCode));

		// tell client what to do
		socket.emit('game_word', currentWord);
		socket.emit('game_code', gameCode);
		socket.emit('player_role', socket.role);
	});

	socket.on('join_game', (gameCode, playerName) => {
		if (gameWords.hasOwnProperty(gameCode)) {
			// initialize player
			socket.gameCode = gameCode;
			socket.playerName = playerName;
			socket.role = 'guesser';
			socket.score = 0;

			// join player to game
			socket.join(gameCode);  // this needs to be before the room broadcast
			io.to(socket.gameCode).emit('active_players', getPlayerNames(gameCode));
			console.log(`Game #${gameCode}: Player "${playerName}" has joined.`);

			// tell client what to do
			socket.emit('player_role', socket.role);
			socket.emit('game_found');
			socket.emit('game_code', gameCode);

			// broadcast that this socket has joined the game
			socket.broadcast.to(socket.gameCode).emit('player_joined', socket.playerName);
		} else {
			socket.emit('game_not_found');
		}
	});

	socket.on('draw_event', (line_data) => {
		// block guessers from sending drawings to the other players
		if (socket.role === 'drawer') {
			socket.broadcast.to(socket.gameCode).emit('draw_data', line_data);
		}
	});

	socket.on('make_guess', (guess) => {
		if(guess.toLowerCase() === getCurrentWord(socket.gameCode).toLowerCase()) {
			io.to(socket.gameCode).emit('winner', socket.playerName);
			console.log(`Game #${socket.gameCode}: ${socket.playerName} won! (word was "${getCurrentWord(socket.gameCode)}")`);
		} else {
			// send toast showing incorrect guess
		}
	});
});

function generateGameCode() {
	return String(getRandomNumberInRange(100000, 999999));
}

function getGameWord(words) {
	return words[getRandomNumberInRange(0, words.length - 1)];
}

function getRandomNumberInRange(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}

function getPlayerNames(gameCode) {
	let sockets = getClientsFromGame(gameCode);

	let players = [];

	sockets.forEach((socket) => {
		players.push(socket.playerName);
	});

	return players;
}

function getClientsFromGame(gameCode) {
	return connections.filter((socket) => {
		return socket.gameCode === gameCode;
	});
}

function getCurrentWord(gameCode) {
	return gameWords[gameCode];
}
