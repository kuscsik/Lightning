/**
 *
 */
var start = function(wpe) {

    wpe = wpe || {};

    with(wpe) {
        var options = {w: 900, h: 900, glClearColor: 0xFF000000, useTextureAtlas: false, debugTextureAtlas: false};

        // Nodejs-specific options.
        if (Utils.isNode) {
            options.window = {title: "Usage example", fullscreen: false};
            options.supercharger = {localImagePath: __dirname};
        }

        var stage = new Stage(options);

        if (!Utils.isNode) {
            document.body.appendChild(stage.getCanvas());
        }

        stage.root.add([{rect: true, w: 900, h: 900, colorLeft: 0xFF000000, colorRight: 0xFF0000FF, children: [
            {rect: true, color: 0xFFFF0000, shader: {type: Light3dShader, rx: 0.5}, w: 450, h: 300, x: 300, y: 300}
        ]}])

    }
};

if (typeof window === "undefined") {
    // Nodejs: start.
    start(require('../../wpe'));
}