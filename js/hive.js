// Hive rules and game state tracking
function Hive() {
    this.turn = 'white';
    this.other = {
        'white': 'black',
        'black': 'white',
    };

    this.board = {};
}

Hive.prototype.is_legal_move = function(move) {
    return true;
};

Hive.prototype.play_move = function(move) {
    if (!this.is_legal_move(move))
        throw "Illegal move";

    // apply the move

    this.turn = this.other[this.turn];
};

// return 'white', 'black', or false
Hive.prototype.winner = function() {
    return false;
};

// return true or false
Hive.prototype.draw = function() {
    return false;
};
