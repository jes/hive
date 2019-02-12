// ui
$(document).ready(function() {
    var game = new Hive();
    var view = new HiveView('#hive', game);

    view.onmove = function(move) {
        if (game.legal_move(move)) {
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
