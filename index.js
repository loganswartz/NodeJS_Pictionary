const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
const io = require('socket.io').listen(server);
const port = process.env.PORT || 3000;
const fs = require('fs');

let connections = [];
let games = {};
let gameCode = 0;
let wordList = [];

server.listen(port);
console.log('Server Running...');

app.use(express.static('public'));


// initialize word list
fs.readFile('trimmed_word_list.json', (err, data) => {
	if(err) {
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
		if(inGame === true) {
			socket.emit('quit_game');
		}
	});

	socket.on('disconnect', () => {
		if(games.hasOwnProperty(socket.gameCode)) {
			games[socket.gameCode].players.splice(games[socket.gameCode].players.indexOf(socket.playerName), 1);
			io.to(socket.gameCode).emit('active_players', getPlayerNames(gameCode));
			if(socket.role === 'drawer') {
				io.to(socket.gameCode).emit('quit_game');
			}
		}
		//console.log(io.sockets.adapter.rooms[gameCode]);
		connections.splice(connections.indexOf(socket), 1);
		console.log(`Player "${socket.playerName}" has left game #${socket.gameCode}.`);
		console.log(`Disconnected: ${connections.length} sockets connected`);
	});

	socket.on('new_game', (playerName) => {
		// initialize game
		gameCode = generateGameCode();
		currentWord = getGameWord(wordList);
		games[gameCode] = {
			'players': [],
			'current_word': currentWord
		}
		console.log(`New game started (#${gameCode}) with the word "${currentWord}".`);

		// initialize player
		socket.gameCode = gameCode;
		socket.playerName = playerName;
		socket.role = 'drawer';
		socket.score = 0;

		// join player to game
		games[gameCode].players.push(playerName);
		socket.join(gameCode);  // this needs to be before the room broadcast
		io.to(socket.gameCode).emit('active_players', getPlayerNames(gameCode));

		// tell client what to do
		socket.emit('game_word', currentWord);
		socket.emit('game_code', gameCode);
		socket.emit('player_role', socket.role);
	});

	socket.on('join_game', (gameCode, playerName) => {
		if (games.hasOwnProperty(gameCode)) {
			// initialize player
			socket.gameCode = gameCode;
			socket.playerName = playerName;
			socket.role = 'guesser';
			socket.score = 0;

			// join player to game
			games[gameCode].players.push(playerName);
			socket.join(gameCode);  // this needs to be before the room broadcast
			io.to(socket.gameCode).emit('active_players', getPlayerNames(gameCode));
			console.log(`Player "${playerName}" has joined game #${gameCode}.`);

			// tell client what to do
			socket.emit('player_role', socket.role);
			socket.emit('game_found');
			socket.emit('game_code', gameCode);
		} else {
			socket.emit('game_not_found');
		}
	});

	socket.on('draw_event', (line_data) => {
		// block guessers from sending drawings to the other players
		if(socket.role === 'drawer') {
			socket.broadcast.to(socket.gameCode).emit('draw_data', line_data);
		}
	});

});

function generateGameCode() {
	return String(getRandomNumberInRange(100000, 999999));
}

function getGameWord(words) {
	return words[getRandomNumberInRange(0, words.length-1)];
}

function getRandomNumberInRange(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}

function getPlayerNames(gameCode) {
	return games[gameCode].players;
}

function getSocket(socketId) {
	// supposedly this should allow grabbing other sockets based on events from a different socket, doesn't seem to work though
	let namespace = null;
	let ns = io.of(namespace || "/");
	let socket = ns.connected[socketId];
	return socket;
}
