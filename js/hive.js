// Hive rules and game state tracking
function Hive() {
    this.turn = 'white';
    this.turnnum = 0;
    this.other = {
        'white': 'black',
        'black': 'white',
    };

    this.remaining_pieces = {
        'white': { 'queenbee': 1, 'spider': 2, 'beetle': 2, 'grasshopper': 3, 'soldierant': 3, },
        'black': { 'queenbee': 1, 'spider': 2, 'beetle': 2, 'grasshopper': 3, 'soldierant': 3, },
    };

    this.board = {};
}

// TODO: refactor this like in the isopath game to use throw/catch
Hive.prototype.is_legal_move = function(move) {
    if (move[0][0] == 'piece') {
        if (this.remaining_pieces[this.turn][move[0][1]] <= 0) {
            console.log("No remaining pieces of type: " + move[0][1]);
            return false;
        }

        // TODO: is destination tile empty?
        // TODO: does destination tile touch the hive? (except on white's first turn)
        // TODO: does destination tile touch any enemy colours? (except on first turn)
        // TODO: queen can't be placed on 1st turn
        // TODO: queen must be placed in first 4 turns
    } else if (move[0][0] == 'tile') {
        let movefromstr = move[0][1] + "," + move[0][2];
        let len = this.board[movefromstr].length;
        if (len == 0) {
            console.log("Can't move a piece from an empty tile");
            return false;
        }
        if (this.board[movefromstr][len-1][0] != this.turn) {
            console.log("Can't move the opponent's pieces");
            return false;
        }
        if (this.remaining_pieces[this.turn]['queenbee'] != 0) {
            console.log("Can't move pieces before placing the queenbee");
            return false;
        }

        // TODO: does removing this piece disconnect the hive?
        // TODO: piece-specific rules
    } else {
        console.log("Unknown move type: " + move[0][0]);
        return false;
    }

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
        this.remaining_pieces[this.turn][move[0][1]]--;
    } else if (move[0][0] == 'tile') {
        let movefrom = [move[0][1], move[0][2]];
        placepiece = this.board[movefrom[0] + "," + movefrom[1]].pop();
    }

    let moveto = move[1];

    if (!this.board[moveto[0] + "," + moveto[1]])
        this.board[moveto[0] + "," + moveto[1]] = [];
    this.board[moveto[0] + "," + moveto[1]].push(placepiece);

    this.turn = this.other[this.turn];
    if (this.turn == 'white')
        this.turnnum++;
};

// return 'white', 'black', or false
Hive.prototype.winner = function() {
    if (this.draw())
        return false;

    // TODO: is either player's queen bee surrounded?

    return false;
};

// return true or false
Hive.prototype.draw = function() {
    // TODO: are both players' queen bees surrounded?
    return false;
};
