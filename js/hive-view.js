// Hive game board view
function HiveView(element_id, game) {
    this.element_id = element_id;
    this.game = game;

    this.zoom = 1;
    this.onmove = function() {};

    $(element_id).html("<canvas id=\"" + element_id + "-canvas\"></canvas>");

    $(element_id).click(function() {
    });
}

HiveView.prototype.redraw = function() {
};
