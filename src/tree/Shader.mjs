import Utils from "./Utils.mjs";

export default class Shader {

    constructor(coreContext) {
        this._initialized = false;

        this.ctx = coreContext;

        /**
         * The (enabled) views that use this shader.
         * @type {Set<ViewCore>}
         */
        this._views = new Set();
    }

    static create(stage, v) {
        let shader;
        if (Utils.isObjectLiteral(v)) {
            if (v.type) {
                shader = stage.renderer.createShader(stage.ctx, v);
            } else {
                shader = this.shader;
            }

            if (shader) {
                stage.patchObject(shader, v);
            }
        } else if (v === null) {
            shader = stage.ctx.renderState.defaultShader;
        } else if (v === undefined) {
            shader = null;
        } else {
            if (v.isShader) {
                if (!stage.renderer.isValidShaderType(v.constructor)) {
                    console.error("Invalid shader type");
                    v = null;
                }
                shader = v;
            } else {
                console.error("Please specify a shader type.");
                return;
            }
        }

        return shader;
    }

    static getWebGL() {
        return undefined;
    }

    static getC2d() {
        return undefined;
    }

    addView(viewCore) {
        this._views.add(viewCore);
    }

    removeView(viewCore) {
        this._views.delete(viewCore);
        if (!this._views) {
            this.cleanup();
        }
    }

    redraw() {
        this._views.forEach(viewCore => {
            viewCore.setHasRenderUpdates(2);
        });
    }

    patch(settings) {
        this.ctx.stage.patchObject(this, settings);
    }

    useDefault() {
        // Should return true if this shader is configured (using it's properties) to not have any effect.
        // This may allow the render engine to avoid unnecessary shader program switches or even texture copies.
        return false;
    }

    addEmpty() {
        // Draws this shader even if there are no quads to be added.
        // This is handy for custom shaders.
        return false;
    }

    cleanup() {
        // Called when no more enabled views have this shader.
    }

    get isShader() {
        return true;
    }
}

