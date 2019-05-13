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

let gameInitMode = '';

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
});

socket.on('game_not_found', () => {
    gameNotFound.style.display = 'block';
});

socket.on('game_code', (code) => {
    gameCode.innerHTML += code;
});

socket.on('game_word', (word) => {
    drawInfo.innerHTML = 'You are drawing: "' + word + '"';
});

socket.on('player_role', (role) => {
    if (role === true) {
        guesserInput.style.display = 'none';
        drawInfo.style.display = 'block';
    } else {
        pictionary.style.display = 'block';
    }
});