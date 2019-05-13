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

	socket.on('disconnect', () => {
		connections.splice(connections.indexOf(socket), 1);
		console.log(`Disconnected: ${connections.length} sockets connected`);
	});

	socket.on('new_game', (playerName) => {
		gameCode = generateGameCode();
		currentWord = getGameWord(wordList);
		games[gameCode] = {
			'connections': [socket],
			'players': {},   // true = drawer, false = guesser
			'current_word': currentWord
		}
		games[gameCode].players[playerName] = true;   // set host to drawer

		socket.emit('game_word', currentWord);
		socket.emit('game_code', gameCode);
		socket.emit('player_role', games[gameCode].players[playerName]);

		console.log(games[gameCode].players);
	});

	socket.on('join_game', (gameCode, playerName) => {
		if (games.hasOwnProperty(gameCode)) {
			games[gameCode].connections.push(socket);
			games[gameCode].players[playerName] = false;   // set new player to guesser
			socket.emit('player_role', games[gameCode].players[playerName]);
			socket.emit('game_found');
			socket.emit('game_code', gameCode);
			console.log(games[gameCode].players);
		} else {
			socket.emit('game_not_found');
		}
	});

	socket.on('draw_event', (line_data) => {
		io.sockets.emit('draw_data', line_data);
	});

});

function generateGameCode() {
	return getRandomNumberInRange(100000, 999999);
}

function getGameWord(words) {
	return words[getRandomNumberInRange(0, words.length-1)];
}

function getRandomNumberInRange(min, max) {
	return Math.floor(Math.random() * (max - min) + min);
}
