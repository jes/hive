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
                // TODO: abstract ai into a separate file
                if (game.turn == 'black') {
                    let moves = game.legal_moves();
                    let move = moves[Math.round(Math.random() * moves.length)];
                    game.play_move(move);
                    view.redraw();
                }

                if (game.winner()) {
                    $('#status').text(game.winner() + " wins");
                } else if (game.draw()) {
                    $('#status').text("It's a draw");
                } else {
                    $('#status').text(game.turn + " to play");
                }
            }
        } else {
            $('#status').text("Illegal move. " + game.turn + " still to play");
        }
    };

    $('#status').text(game.turn + " to play");
});
