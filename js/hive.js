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

// move = [["piece", "queenbee"], [3, 2]]
// move = [["tile", 3, 2], [4, 5]]
Hive.prototype.play_move = function(move) {
    if (!this.is_legal_move(move))
        throw "Illegal move";

    let placepiece;

    if (move[0][0] == 'piece') {
        placepiece = [this.turn, move[0][1]];
    } else if (move[0][0] == 'tile') {
        let movefrom = [move[0][1], move[0][2]];
        placepiece = this.board[movefrom[0] + "," + movefrom[1]].pop();
    }

    let moveto = move[1];

    if (!this.board[moveto[0] + "," + moveto[1]])
        this.board[moveto[0] + "," + moveto[1]] = [];
    this.board[moveto[0] + "," + moveto[1]].push(placepiece);

    console.log(this.board);

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
