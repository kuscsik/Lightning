/**
 * Copyright Metrological, 2017
 */

class CoreContext {

    constructor(stage) {
        this.stage = stage

        this.gl = stage.gl

        this.root = null

        this.updateTreeOrder = 0
        this.updateTreeOrderForceUpdate = 0

        this.shaderPrograms = new Map()

        this.renderState = new CoreRenderState(this)

        this.renderExec = new CoreRenderExecutor(this)
        this.renderExec.init()

        this._renderTexturePool = []
        this._renderTexturePoolPixels = 0

        this._renderTextureId = 1
    }

    destroy() {
        this.shaderPrograms.forEach(shaderProgram => shaderProgram.destroy())
        this._renderTexturePool.forEach(texture => this._freeRenderTexture(texture));
    }

    visit() {
        this.root.visit()
    }

    frame() {
        //if (this.stage.frameCounter % 100 != 99) return
        if (!this.root._parent._hasRenderUpdates) {
            return false
        }

        this.visit()

        this.update()

        this.render()

        // Clear flag to identify if anything changes before the next frame.
        this.root._parent._hasRenderUpdates = false

        this._freeUnusedRenderTextures(6000)

        return true
    }

    update() {
        this.updateTreeOrderForceUpdate = 0
        this.updateTreeOrder = 0

        this.root.update()
    }

    render() {
        // Obtain a sequence of the quad and filter operations.
        this.renderState.reset()
        this.root.render()
        this.renderState.finish()

        // Now run them with the render executor.
        this.renderExec.execute()
    }

    allocateRenderTexture(w, h) {
        let prec = this.stage.getRenderPrecision()
        let aw = Math.max(1, Math.min(2048, Math.round(w * prec)))
        let ah = Math.max(1, Math.min(2048, Math.round(h * prec)))

        for (let i = 0, n = this._renderTexturePool.length; i < n; i++) {
            let texture = this._renderTexturePool[i];
            if (texture.w === aw && texture.h === ah) {
                texture.f = this.stage.frameCounter;
                this._renderTexturePool.splice(i, 1);
                return texture;
            }
        }

        let texture = this._createRenderTexture(aw, ah);

        texture.f = this.stage.frameCounter;
        texture.precision = prec;
        texture.projection = new Float32Array([2/w, 2/h])

        return texture;
    }

    releaseRenderTexture(texture) {
        this._renderTexturePool.push(texture);
    }

    _freeUnusedRenderTextures(maxAge = 60) {
        // Clean up all textures that are no longer used.
        // This cache is short-lived because it is really just meant to supply running shaders and filters that are
        // updated during a number of frames.
        let limit = this.stage.frameCounter - maxAge;

        this._renderTexturePool = this._renderTexturePool.filter(texture => {
            if (texture.f < limit) {
                this._freeRenderTexture(texture);
                this._renderTexturePoolPixels -= texture.w * texture.h
                return false;
            }
            return true;
        });
    }

    _createRenderTexture(w, h) {
        if (this._renderTexturePoolPixels > this.stage.options.renderTexturePoolPixels) {
            this._freeUnusedRenderTextures()
            if (this._renderTexturePoolPixels > this.stage.options.renderTexturePoolPixels) {
                console.warn("Render texture pool overflow: " + this._renderTexturePoolPixels + "px")
            }
        }

        let gl = this.gl;
        let sourceTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, sourceTexture);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // We need a specific framebuffer for every render texture.
        sourceTexture.framebuffer = gl.createFramebuffer();
        sourceTexture.w = w;
        sourceTexture.h = h;
        sourceTexture.id = this._renderTextureId++

        gl.bindFramebuffer(gl.FRAMEBUFFER, sourceTexture.framebuffer)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sourceTexture, 0);

        return sourceTexture;
    }

    _freeRenderTexture(glTexture) {
        let gl = this.stage.gl;
        this._renderTexturePoolPixels -= glTexture.w * glTexture.h
        gl.deleteFramebuffer(glTexture.framebuffer);
        gl.deleteTexture(glTexture);
    }

}

module.exports = CoreContext

let CoreRenderState = require('./CoreRenderState')
let CoreRenderExecutor = require('./CoreRenderExecutor')