// Hive game board view
function HiveView(element_id, game) {
    this.element_id = element_id;
    this.game = game;

    this.images_loaded = 0;
    this.zoom = 2.5;
    this.onmovestart = function() {};
    this.onmove = function() {};
    this.movestart = false;

    $('#' + element_id).html("<div style=\"float:left; margin-right:10px\" id=\"" + element_id + "-white-pieces\"></div><canvas style=\"float: left;border:solid 1px black\" id=\"" + element_id + "-canvas\" width=\"900\" height=\"400\"></canvas><div style=\"float:left; margin-left: 10px\" id=\"" + element_id + "-black-pieces\"></div><div style=\"clear:both\"></div>");
    this.populate_pieces();

    let thishive = this;
    $('#' + element_id + "-canvas").click(function(e) {
        let offset = $(this).offset();
        let x = e.pageX - offset.left;
        let y = e.pageY - offset.top;
        let hex = thishive.xy2hex([x, y]);
        thishive.handle_click(['tile', hex[0], hex[1]]);
    });
}

HiveView.prototype.populate_pieces = function() {
    let thishive = this;

    for (let player of ["white","black"]) {
        let html = '';
        for (let piece of ["queenbee", "spider", "beetle", "grasshopper", "soldierant"]) {
            html += "<img style=\"width:64px; margin-bottom: 10px\" id=\"" + this.element_id + "-" + player + "-" + piece + "\" src=\"img/" + player + "-" + piece + ".png\"><span id=\"" + this.element_id + "-" + player + "-" + piece + "-label\"></span><br>";
        }
        console.log(html);
        $('#' + this.element_id + "-" + player + "-pieces").html(html);

        for (let piece of ["queenbee", "spider", "beetle", "grasshopper", "soldierant"]) {
            $('#' + this.element_id + "-" + player + "-" + piece).click(function() {
                thishive.handle_click(['piece', player, piece]);
            });

            // XXX: doesn't seem to be possible to do this with jquery:
            document.getElementById(this.element_id + "-" + player + "-" + piece).onload = function() {
                thishive.images_loaded++;
                // once all images are loaded, draw the canvas
                if (thishive.images_loaded == 10) {
                    thishive.redraw();
                }
            };
        }
    }
};

// [100,150] => [2,3]
HiveView.prototype.xy2hex = function(xy) {
    // TODO: work out what offx/offy is required (pre-zoom) to centre the game board
    // and this should be applied in hex2xy/xy2hex instead of redraw()
    let offx = 1000;
    let offy = 300;

    let x = Math.round((this.zoom*xy[0]-offx)/160);
    let y = Math.round((this.zoom*xy[1]-offy)/130);

    // now we have the rough x,y coords in hex space that generate this point in pixel space,
    // we need to see which of the adjacent hexes is closest to where we clicked
    // XXX: is there a less stupid way to do this?
    let bestr = 100000;
    let besthex;
    for (let hy of [y-2, y-1, y, y+1, y+2]) {
        for (let hx of [x-2, x-1, x, x+1, x+2]) {
            let hxy = this.hex2xy([hx,hy]);
            hxy[0] += offx/this.zoom;
            hxy[1] += offy/this.zoom;
            let dx = hxy[0]-xy[0];
            let dy = hxy[1]-xy[1];
            let r = Math.sqrt(dx*dx + dy*dy);
            if (r < bestr) {
                bestr = r;
                besthex = [hx,hy];
            }
        }
    }

    // XXX: -0 => 0
    if (besthex[0] == 0) besthex[0] = 0;
    if (besthex[1] == 0) besthex[1] = 0;

    return besthex
};

// [2,3] => [100, 150]
HiveView.prototype.hex2xy = function(hex) {
    // hex width at zoom level 1 = 160 px
    let x = (hex[0] * 160) / this.zoom;
    let y = (hex[1] * 130) / this.zoom;

    // odd-numbered rows are offset in x by -80px
    if (hex[1]%2 != 0)
        x -= 80/this.zoom;

    return [x, y];
};

HiveView.prototype.redraw = function() {
    // TODO: work out what offx/offy is required (pre-zoom) to centre the game board
    // and this should be applied in hex2xy/xy2hex instead of redraw()
    let offx = 1000;
    let offy = 300;

    // TODO: work out what zoom level we need, update this.zoom

    let canvas = document.getElementById(this.element_id + "-canvas");
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw the pieces
    for (let hex in this.game.board) {
        let len = this.game.board[hex].length;

        // if we're partway through a move, and we're removing a piece from this tile, hide it from the view
        if (this.movestart && this.movestart[0] == 'tile' && (this.movestart[1] + "," + this.movestart[2]) == hex)
            len--;

        if (len <= 0)
            continue;

        let xy = this.hex2xy(hex.split(","));
        xy[0] += offx/this.zoom;
        xy[1] += offy/this.zoom;

        let colour = this.game.board[hex][len-1][0];
        let piece = this.game.board[hex][len-1][1];

        let img = document.getElementById(this.element_id + "-" + colour + "-" + piece);
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, xy[0]-(img.naturalWidth/(2*this.zoom)), xy[1]-(img.naturalHeight/(2*this.zoom)), img.naturalWidth/this.zoom, img.naturalHeight/this.zoom);
    }

    // hide the pieces they've already used
    for (let player of ["white","black"]) {
        for (let piece of ["queenbee", "spider", "beetle", "grasshopper", "soldierant"]) {
            if (this.game.remaining_pieces[player][piece] <= 0) {
                $('#' + this.element_id + "-" + player + "-" + piece).css('opacity', '0.3');
                $('#' + this.element_id + "-" + player + "-" + piece + "-label").text("");
            } else {
                $('#' + this.element_id + "-" + player + "-" + piece + "-label").text("x" + this.game.remaining_pieces[player][piece]);
            }
        }
    }
};

// click = ['piece', 'white', 'beetle'] for unplayed pieces
// click = ['tile', 3, 2] for clicks in play area
HiveView.prototype.handle_click = function(click) {
    if (click[0] == "piece") {
        if (click[1] == this.game.turn)
            click = [click[0], click[2]]; // ["piece", "beetle"]
        else
            return;
    }

    if (click[0] == "piece" || !this.movestart) {
        // TODO: not allowed to move opponent's pieces

        if (this.onmovestart(click)) {
            this.movestart = click;
            this.redraw();
        }

        // TODO: if it's turn 1 for white, just place their piece at 0,0
    } else {
        // this click is on the destination tile
        let moveend = [click[1], click[2]]; // [3, 2]
        let move = [this.movestart, moveend];
        this.movestart = false;
        this.onmove(move);
    }
};
