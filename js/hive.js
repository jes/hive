// Hive rules and game state tracking
function Hive() {
    this.turn = 'white';
    this.other = {
        'white': 'black',
        'black': 'white',
    };

    this.board = {};
    this.board = {"0,0": [["white","queenbee"]], "0,1":[["black","queenbee"]], "1,1": [["white","spider"]], "1,2":[["black","spider"]]};
}

Hive.prototype.is_legal_move = function(move) {
    return true;
};

// move = [["piece", "queen"], [3, 2]]
// move = [["tile", 3, 2], [4, 5]]
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
