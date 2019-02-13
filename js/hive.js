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

// hex = "1,2"
Hive.prototype.adjacent_tiles = function(hex) {
    console.log(["adjacent",hex]);
    let xy = hex.split(",");
    let adj = [];

    xy[0] = parseInt(xy[0]);
    xy[1] = parseInt(xy[1]);

    // tiles on same row
    adj.push((xy[0]-1) + "," + xy[1]);
    adj.push((xy[0]+1) + "," + xy[1]);

    // tiles on row above and below
    for (y of [xy[1]-1, xy[1]+1]) {
        // odd-numbered rows are shifted to the left
        if (y%2 != 0) {
            adj.push(xy[0] + "," + y);
            adj.push((xy[0]+1) + "," + y);
        } else {
            adj.push((xy[0]-1) + "," + y);
            adj.push(xy[0] + "," + y);
        }
    }

    console.log(adj);
    return adj;
}

// hex = "1,2"
Hive.prototype.piece_at = function(hex) {
    let p = this.board[hex];
    if (!p || p.length == 0)
        return false;
    return p[p.length-1];
};

// TODO: refactor this like in the isopath game to use throw/catch
// move = [["piece", "queenbee"], [3, 2]]
// move = [["tile", 3, 2], [4, 5]]
Hive.prototype.is_legal_move = function(move) {
    let movetostr = move[1][0] + "," + move[1][1];
    if (move[0][0] == 'piece') {
        if (this.remaining_pieces[this.turn][move[0][1]] <= 0) {
            console.log("No remaining pieces of type: " + move[0][1]);
            return false;
        }
        if (this.piece_at(movetostr)) {
            console.log("Can't place a piece on an occupied tile");
            return false;
        }
        if (this.turnnum == 0 && move[0][1] == 'queenbee') {
            console.log("Can't place queenbee on first turn");
            return false;
        }
        if (this.turnnum == 3 && move[0][1] != 'queenbee' && this.remaining_pieces[this.turn]['queenbee'] != 0) {
            console.log("Must place queen in first 4 turns");
            return false;
        }

        if (this.turnnum != 0) {
            for (let hex of this.adjacent_tiles(movetostr)) {
                let p = this.piece_at(hex);
                console.log(p);
                if (p && p[0] != this.turn) {
                    console.log("Can't place a piece adjacent to opponent pieces");
                    return false;
                }
            }
        }
    } else if (move[0][0] == 'tile') {
        let movefromstr = move[0][1] + "," + move[0][2];
        if (this.piece_at(movefromstr) == false) {
            console.log("Can't move a piece from an empty tile");
            return false;
        }
        let len = this.board[movefromstr].length;
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

    // TODO: movetostr must be adjacent to the hive

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
