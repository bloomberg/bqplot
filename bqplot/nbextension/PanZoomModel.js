/* Copyright 2015 Bloomberg Finance L.P.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

define(["jupyter-js-widgets", "./BaseModel", "underscore"],
       function(widgets, BaseModel, _) {
    "use strict";

    var PanZoomModel = BaseModel.BaseModel.extend({

        defaults: _.extend({}, widgets.WidgetModel.prototype.defaults, {
            _model_name: "PanZoomModel",
            _view_name: "PanZoom",
            _model_module: "bqplot",
            _view_module: "bqplot",
            scales: {},
            allow_pan: true,
            allow_zoom: true,
        }),

        initialize: function() {
            this.on("change:scales", this.snapshot_scales, this);
            this.snapshot_scales();
        },

        reset_scales: function() {
            var that = this;
            widgets.resolvePromisesDict(this.get("scales")).then(function(scales) {
                _.each(Object.keys(scales), function(k) {
                    _.each(scales[k], function(s, i) {
                        s.set_state(that.scales_states[k][i]);
                    }, that);
                }, that);
            });
        },

        snapshot_scales: function() {
            // Save the state of the scales.
            var that = this;
            widgets.resolvePromisesDict(this.get("scales")).then(function(scales) {
                that.scales_states = Object.keys(scales).reduce(function(obj, key) {
                    obj[key] = scales[key].map(function(s) {
                        return s.get_state()
                    });
                    return obj;
                }, {});
            });
        }
    }, {
        serializers: _.extend({
            scales: { deserialize: widgets.unpack_models },
        }, BaseModel.BaseModel.serializers),
    });

    return {
        PanZoomModel: PanZoomModel,
    };
});
