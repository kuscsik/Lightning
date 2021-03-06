import lng from '../../lightning.mjs';

import FlowingGradientShader from "./FlowingGradientShader.mjs";

export default class FlowingGradientExample extends lng.Application {

    static _template() {
        return {
            Shader: {shader: {type: FlowingGradientShader, random: false, graining: 0.01}, texture: {type: lng.textures.NoiseTexture}, w: 1600, h: 1000}
        }
    }

    get speed() {
        return this._speed
    }

    set speed(v) {
        this._speed = v
    }

    _step(dt) {
        const shader = this.tag("Shader").shader

        this._t += dt
        shader.setPos1(Math.cos(-0.42 * this._t), Math.sin(0.5 * this._t))
        shader.setPos2(0.7 * Math.cos(0.7 * this._t), 0.7*Math.sin(-0.32*this._t))
    }

    static _states() {
        return {
            _construct: function() {
                this._t = 0
                this._speed = 1

                this._frameStartListener = () => {
                    this._step(this.stage.dt * this._speed)
                }
            },
            _init: function() {
                this.tag("Shader").animation({duration: 60, repeat: -1, actions: [
                    {p: 'shader.color1', v: {0: 0xFFFF0000, 0.1: 0xFFFFFF00, 0.4: 0xFF00FF00, 0.6: 0xFFFF0000, 0.8: 0xFF0000FF, 1: 0xFFFF0000}},
                    {p: 'shader.color2', v: {0: 0xFF0000FF, 0.1: 0xFFFF00FF, 0.4: 0xFF0000FF, 0.6: 0xFF0000FF, 0.8: 0xFFFF0000, 1: 0xFF0000FF}},
                    //{p: 'shader.graining', v: {0.2: 0, 0.3: 0.05, 0.4: 0.05, 0.5: 0, 0.7: 0, 0.8: 0.05, 0.9: 0.05, 1: 0}},
                    {p: 'shader.banding', v: {sm: 0, 0.4: 0, 0.5: 0.80, 0.6: 0.95, 0.8: 0.95, 0.95: 0.95, 1: 0}}
                ]}).start()
            },
            _enable: function() {
                this.stage.on('frameStart', this._frameStartListener)
            },
            _disable: function() {
                this.stage.off('frameStart', this._frameStartListener)
            }
        }
    }

}

