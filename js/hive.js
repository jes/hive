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
    this.queenbee = {
        'white': false,
        'black': false,
    };
}

Hive.prototype.occupied_tiles = function(avoid_hex) {
    let tiles = [];
    for (let hex in this.board) {
        if (this.piece_at(hex) && (!avoid_hex || hex != avoid_hex))
            tiles.push(hex);
    }

    return tiles;
};

// return true if the hive is still fully connected even if avoid_hex is removed
Hive.prototype.hive_connected = function(avoid_hex) {
    let tiles = this.occupied_tiles(avoid_hex);
    let visited = {};

    let q = [];
    q.push(tiles[0]);
    visited[tiles[0]] = true;

    // bfs flood fill
    while (q.length > 0) {
        let thishex = q.shift();
        let adj = this.adjacent_tiles(thishex);
        for (let hex of adj) {
            if (!this.piece_at(hex) || visited[hex] || hex == avoid_hex)
                continue;
            q.push(hex);
            visited[hex] = true;
        }
    }

    // if there were any unvisited hexes, the hive is not connected
    for (let t of tiles) {
        if (!visited[t])
            return false;
    }

    return true;
};

// hex = "1,2"
// returned adjacent tiles are in this order:
//      2 3
//     0 - 1
//      4 5
Hive.prototype.adjacent_tiles = function(hex) {
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

    return adj;
};

Hive.prototype.is_adjacent = function(hex1, hex2) {
    let adj = this.adjacent_tiles(hex1);

    for (t of adj) {
        if (t == hex2)
            return true;
    }

    return false;
};

// return true if "hex" is adjacent to any pieces
Hive.prototype.adjacent_to_hive = function(hex) {
    let adj = this.adjacent_tiles(hex);
    for (t of adj) {
        if (this.piece_at(t))
            return true;
    }
    return false;
};

// return list of unoccupied tiles adjacent to hex that can be slid in to
Hive.prototype.steppable_tiles = function(hex) {
    let adj = this.adjacent_tiles(hex);

    let steppable = [];

    // adj is in this order:
    //      2 3
    //     0 - 1
    //      4 5
    // and we can slide into (e.g.) "1" if either "3" or "5" are unoccuped
    let order = [2, 3, 1, 5, 4, 0];

    for (let i=0; i < order.length; i++) {
        // a,b,c are adjacent tiles in clockwise order
        let a = adj[order[i]];
        let b = adj[order[(i+1)%6]];
        let c = adj[order[(i+2)%6]];

        // can't slide into an occupied tile
        if (this.piece_at(b))
            continue;

        // can't slide through a too-narrow gap
        if (this.piece_at(a) && this.piece_at(c))
            continue;

        steppable.push(b);
    }

    return steppable;
};

// return true if hex1 can slide directly into hex2 (i.e. not blocked by other pieces)
Hive.prototype.is_steppable = function(hex1, hex2) {
    let step = this.steppable_tiles(hex1);

    for (t of step) {
        if (t == hex2)
            return true;
    }

    return false;
};

// return true if there is a steppable route from hex1 to hex2 of any length
// TODO: refactor this and can_spider into a single function?
Hive.prototype.is_steppable_route = function(hex1, hex2) {
    let q = [[0, hex1]];
    let visited = {hex1: true};
    while (q.length > 0) {
        let state = q.shift();
        let steps = state[0];
        let thishex = state[1];

        if (thishex == hex2)
            return true;

        let step = this.steppable_tiles(thishex);
        for (let hex of step) {
            if (visited[hex] || !this.adjacent_to_hive(hex))
                continue;
            q.push([steps+1, hex]);
            visited[hex] = true;
        }
    }

    return false;
};

// return true if there is a route from hex1 to hex2 that is ok for a spider
Hive.prototype.can_spider = function(hex1, hex2) {
    let q = [[0, hex1]];
    let visited = {hex1: true};
    while (q.length > 0 && q[0][0] <= 3) {
        let state = q.shift();
        let steps = state[0];
        let thishex = state[1];

        if (steps == 3 && thishex == hex2)
            return true;

        let step = this.steppable_tiles(thishex);
        for (let hex of step) {
            if (visited[hex])
                continue;
            q.push([steps+1, hex]);
            visited[hex] = true;
        }
    }

    return false;
};

// return true if the route from hex1 to hex2 is ok for a grasshopper
Hive.prototype.can_grasshopper = function(hex1, hex2) {
    let p1 = hex1.split(",");
    let p2 = hex2.split(",");
    let dir;

    // work out which direction we need to travel in, which corresponds to the
    // tile index from adjacent_tiles()
    if (p1[1] == p2[1]) { // horizontal
        if (p1[0] > p2[0]) dir = 0; // left
        else dir = 1; //right
    } else if (p1[1] > p2[1]) { // diagonal up
        if (p1[0] > p2[0]) dir = 2; // up left
        else dir = 3; // up right
    } else { // diagonal down
        if (p1[0] > p2[0]) dir = 4; // down left
        else dir = 5; // down right
    }

    // now see if there is a route in this direction from hex1 to hex2 over occupied tiles
    let hex = hex1;
    while (this.piece_at(hex)) {
        let adj = this.adjacent_tiles(hex);
        hex = adj[dir];
        if (hex == hex2)
            return true;
    }
    return false;
};

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
                if (p && p[0] != this.turn) {
                    console.log("Can't place a piece adjacent to opponent pieces");
                    return false;
                }
            }
        }
        // can the piece be slid into this slot from outside the playing area?
        // (try finding a slidable route from a place that is just outside the play area)
        let minx = 0, miny = 0;
        for (let hex in this.board) {
            let p = hex.split(",");
            if (p[1] < miny || (p[1] == miny && p[0] < minx)) {
                minx = p[0];
                miny = p[1];
            }
        }
        let minhex = (minx-1) + "," + miny;
        if (this.turnnum != 0 && !this.is_steppable_route(minhex, movetostr)) {
            console.log("Can't slide into place: " + movetostr);
            return false;
        }
    } else if (move[0][0] == 'tile') {
        let movefromstr = move[0][1] + "," + move[0][2];
        let piece = this.piece_at(movefromstr);
        if (piece == false) {
            console.log("Can't move a piece from an empty tile");
            return false;
        }
        if (movetostr == movefromstr) {
            console.log("Piece must be moved");
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
        if (!this.hive_connected(movefromstr)) {
            console.log("Can't disconnect the hive");
            return false;
        }

        if (piece[1] == 'queenbee') {
            if (!this.is_steppable(movefromstr, movetostr)) {
                console.log("queenbee can only move to adjacent tiles");
                return false;
            }
        } else if (piece[1] == 'spider') {
            if (!this.can_spider(movefromstr, movetostr)) {
                console.log("can't spider");
                return false;
            }
        } else if (piece[1] == 'beetle') {
            if (!this.is_adjacent(movefromstr, movetostr)) {
                console.log("beetle can only move to adjacent tiles");
                return false;
            }
            // TODO: Beetles have an important but rarely-seen movement restriction,
            // a variation of the Freedom to Move Rule; a Beetle may not move directly
            // between two adjacent hexes if doing so would require passing through a
            // gap between two stacks of pieces that are both higher than the origin
            // hex (without the Beetle on it) and the destination hex. The Beetle may,
            // however, take two turns to reach this spot by first crawling into either
            // of the stacks blocking its path.
        } else if (piece[1] == 'grasshopper') {
            if (!this.can_grasshopper(movefromstr, movetostr)) {
                console.log("can't grasshopper");
                return false;
            }
        } else if (piece[1] == 'soldierant') {
            if (!this.is_steppable_route(movefromstr, movetostr)) {
                console.log("no route");
                return false;
            }
        }

        if (piece[1] != 'beetle' && this.piece_at(movetostr)) {
            console.log("Can't move on top of another piece");
            return false;
        }
    } else {
        console.log("Unknown move type: " + move[0][0]);
        return false;
    }

    if (this.turnnum > 0 || this.turn == 'black') {
        let have_adjacent = false;
        for (let hex of this.adjacent_tiles(movetostr)) {
            if (this.piece_at(hex))
                have_adjacent = true;
        }
        if (!have_adjacent) {
            console.log("Must place adjacent to hive");
            return false;
        }
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

    if (placepiece[1] == 'queenbee')
        this.queenbee[this.turn] = moveto[0] + "," + moveto[1];

    // TODO: if there are no legal moves for the other player, turn comes back to this player
    this.turn = this.other[this.turn];
    if (this.turn == 'white')
        this.turnnum++;
};

// return 'white', 'black', or false
Hive.prototype.winner = function() {
    if (this.draw())
        return false;

    for (let p of ['white', 'black']) {
        if (!this.queenbee[p])
            continue;
        let adj = this.adjacent_tiles(this.queenbee[p]);
        let surrounded = true;
        for (let hex of adj) {
            if (!this.piece_at(hex)) {
                surrounded = false;
            }
        }
        // if p's queen is surrounded, other[p] wins
        if (surrounded)
            return this.other[p];
    }

    return false;
};

// return true or false
Hive.prototype.draw = function() {
    // it's a draw if both players' queen bees are surrounded
    for (let p of ['white', 'black']) {
        if (!this.queenbee[p])
            return false;
        let adj = this.adjacent_tiles(this.queenbee[p]);
        for (let hex of adj) {
            if (!this.piece_at(hex)) // if there is any tile adjacent to the queen that is not occupied, it's not a draw
                return false;
        }
    }
    return true;
};
