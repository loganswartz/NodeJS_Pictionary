const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
const io = require('socket.io').listen(server);
const port = process.env.PORT || 3000;
const fs = require('fs');

const user = require('./user.js');

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

	socket.on('disconnect', () => {
		connections.splice(connections.indexOf(socket), 1);
		console.log(`Disconnected: ${connections.length} sockets connected`);
	});

	socket.on('new_game', (playerName) => {
		gameCode = generateGameCode();
		currentWord = getGameWord(wordList);
		games[gameCode] = {
			'players': {},
			'current_word': currentWord
		}
		games[gameCode].players[playerName] = new user(playerName, gameCode, socket);

		socket.join(gameCode);
		io.to(gameCode).emit('active_players', getPlayerNames(gameCode));

		socket.emit('game_word', currentWord);
		socket.emit('game_code', gameCode);
		socket.emit('player', games[gameCode].players[playerName].json());
	});

	socket.on('join_game', (gameCode, playerName) => {		
		if (games.hasOwnProperty(gameCode)) {

			games[gameCode].players[playerName] = new user(playerName, gameCode, socket);

			games[gameCode].players[playerName].setGuesser();
			socket.join(gameCode);
			io.to(gameCode).emit('active_players', getPlayerNames(gameCode));
			
			socket.emit('player', games[gameCode].players[playerName].json());
			socket.emit('game_found');
			socket.emit('game_code', gameCode);
		} else {
			socket.emit('game_not_found');
		}
	});

	socket.on('draw_event', (line_data, gameCode) => {
		socket.broadcast.to(gameCode).emit('draw_data', line_data);
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
	let playerNames = [];
	Object.values(games[gameCode].players).forEach((player) => {
		playerNames.push(player.name);
	});

	return playerNames;
}
