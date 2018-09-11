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

var d3 = require("d3");
var _ = require("underscore");
var basemodel = require("./MarkModel");
var serialize = require("./serialize");

var ScatterMegaModel = basemodel.MarkModel.extend({

    defaults: function() {
        return _.extend(basemodel.MarkModel.prototype.defaults(), {
            _model_name: "ScatterMegaModel",
            _view_name: "ScatterMega",
            x: [],
            y: [],
            color: null,
            skew: null,
            marker: "circle",
            stroke: null,
            stroke_width: 1.5,
            default_skew: 0.5,
            default_size: 64,
            names: [],
            display_names: true,
            fill: true,
            drag_color: null,
            drag_size: 5.0,
            names_unique: true,
        });
    },

    initialize: function() {
        ScatterMegaModel.__super__.initialize.apply(this, arguments);
        this.update_domains()
    },

    update_domains: function() {
        // color scale needs an issue in DateScaleModel to be fixed. It
        // should be moved here as soon as that is fixed.

       var scales = this.get("scales");
       for (var key in scales) {
            if(scales.hasOwnProperty(key) && key != "color") {
                var scale = scales[key];
                if(!this.get("preserve_domain")[key]) {
                    scale.compute_and_set_domain(this.get(key), this.model_id + key);
                } else {
                    scale.del_domain([], this.model_id + key);
                }
            }
       }
    }


}, {serializers: _.extend({
        x: serialize.array_or_json,
        y: serialize.array_or_json,
        color: serialize.array_or_json,
        size: serialize.array_or_json,
        selected: serialize.array_or_json,
        rotation: serialize.array_or_json,
        opacity: serialize.array_or_json,
        default_opacities: serialize.array_or_json
    }, basemodel.MarkModel.serializers)
});

module.exports = {
    ScatterMegaModel: ScatterMegaModel
};