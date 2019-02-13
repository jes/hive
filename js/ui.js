// ui
$(document).ready(function() {
    let game = new Hive();
    let view = new HiveView('hive', game);

    view.onmovestart = function(piece) {
        if (game.winner() || game.draw())
            return false;
        else
            return true;
    };

    view.onmove = function(move) {
        if (game.is_legal_move(move)) {
            game.play_move(move);
            if (game.winner()) {
                $('#status').text(game.winner() + " wins");
            } else if (game.draw()) {
                $('#status').text("It's a draw");
            } else {
                $('#status').text(game.turn + " to play");
            }
        } else {
            $('#status').text("Illegal move. " + game.turn + " still to play");
        }
        view.redraw();
    };

    $('#status').text(game.turn + " to play");
    view.redraw();
});