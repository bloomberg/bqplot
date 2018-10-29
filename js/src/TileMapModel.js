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

var widgets = require("@jupyter-widgets/base");
var _ = require("underscore");
var d3 = require("d3");
var basemodel = require("./BaseModel");
var semver_range = "^" + require("../package.json").version;

var TileMapModel = basemodel.BaseModel.extend({

    defaults: function() {
        return _.extend(basemodel.BaseModel.prototype.defaults(), {
            _model_name: "TileMapModel",
            _view_name: "TileMap",
            _model_module: "bqplot",
            _view_module: "bqplot",
            _model_module_version: semver_range,
            _view_module_version: semver_range,

            map_width: 1080,
            map_height: 800,

            names: [],
            groups: [],
            display_text: [],
            ref_data: undefined,
            title: "",

            tooltip_fields: [],
            tooltip_formats: [],
            show_groups: false,

            cols: 0,
            rows: 0,

            row_groups: 1,
            colors: d3.scale.category20().range(),
            scales: {},
            axes: [],
            color: [],
            map_margin: {
                top: 50,
                right: 50,
                left: 50,
                bottom: 50
            },
            preserve_aspect: false,
            stroke: "white",
            group_stroke: "black",
            selected_stroke: "dodgerblue",
            hovered_stroke: "orangered",
            font_style: {},
            title_style: {},

            selected: [],
            enable_hover: true,
            enable_select: true,
            tooltip_widget: null
        });
    }
}, {
    serializers: _.extend({
        scales: { deserialize: widgets.unpack_models },
        axes: { deserialize: widgets.unpack_models },
        tooltip_widget: { deserialize: widgets.unpack_models },
        style: { deserialize: widgets.unpack_models },
        layout:  { deserialize: widgets.unpack_models }
    }, basemodel.BaseModel.serializers)
});

module.exports = {
    TileMapModel: TileMapModel
};
