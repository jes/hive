// Hive game board view
function HiveView(element_id, game) {
    this.element_id = element_id;
    this.game = game;

    this.images_loaded = 0;
    this.zoom = 2.5;
    this.onmovestart = function() {};
    this.onmove = function() {};
    this.movestart = false;

    $('#' + element_id).html("<div style=\"float:left\" id=\"" + element_id + "-white-pieces\"></div><canvas style=\"margin:auto; border:solid 1px black\" id=\"" + element_id + "-canvas\" width=\"400\" height=\"400\"></canvas><div style=\"float:right\" id=\"" + element_id + "-black-pieces\"></div>");
    this.populate_pieces();

    $('#' + element_id + "-canvas").click(function() {
    });
}

HiveView.prototype.populate_pieces = function() {
    let thishive = this;

    for (let player of ["white","black"]) {
        let html = '';
        for (let piece of ["queenbee", "spider", "beetle", "grasshopper", "soldierant"]) {
            html += "<img style=\"width:64px\" id=\"" + this.element_id + "-" + player + "-" + piece + "\" src=\"img/" + player + "-" + piece + ".png\"><br>";
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

// "2,3" => [100, 150]
HiveView.prototype.hex2xy = function(hex) {
    let parts = hex.split(",");

    // hex width at zoom level 1 = 160 px
    let x = (parts[0] * 160) / this.zoom;
    let y = (parts[1] * 160) / this.zoom;

    // odd-numbered rows are offset in x by -80px and in y by -29px
    if (parts[1]%2 == 1) {
        x -= 80/this.zoom;
        y -= 29/this.zoom;
    }

    return [x, y];
};

HiveView.prototype.redraw = function() {
    // TODO: work out what offx/offy is required (pre-zoom) to centre the game board
    let offx = 200;
    let offy = 20;

    // TODO: work out what zoom level we need, update this.zoom

    let canvas = document.getElementById(this.element_id + "-canvas");
    let ctx = canvas.getContext('2d');

    // draw the pieces
    for (let hex in this.game.board) {
        let xy = this.hex2xy(hex);
        xy[0] += offx/this.zoom;
        xy[1] += offy/this.zoom;

        let colour = this.game.board[hex][0][0];
        let piece = this.game.board[hex][0][1];

        let img = document.getElementById(this.element_id + "-" + colour + "-" + piece);
        console.log(colour + " " + piece + " at " + xy[0] + "," + xy[1]);
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, xy[0], xy[1], img.naturalWidth/this.zoom, img.naturalHeight/this.zoom);
        ctx.stroke();
    }

    // if (this.movestart), hide the piece they picked up?
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
        if (this.onmovestart(click)) {
            this.movestart = click;
            this.redraw();
        }
    } else {
        let moveend = [click[1], click[2]]; // [3, 2]
        this.onmove([this.movestart, moveend]);
    }
};
