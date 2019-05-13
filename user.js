class User {

    constructor(name, gameCode, socket) {
        this.name = name;
        this.gameCode = gameCode;
        this.drawer = true; // if set tot false, this user is the drawer
        this.score = 0;
        this.socket = socket;
    }

    isDrawer() {
        return this.drawer;
    }

    setGuesser() {
        this.drawer = false;
    }
}

module.exports = User;