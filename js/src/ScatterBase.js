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
var utils = require("./utils");
var mark = require("./Mark");

var ScatterBase = mark.Mark.extend({

    render: function() {
        var base_creation_promise = ScatterBase.__super__.render.apply(this);

        var that = this;
        this.drag_listener = d3.behavior.drag()
          .on("dragstart", function(d, i) { return that.drag_start(d, i, this); })
          .on("drag", function(d, i) { return that.on_drag(d, i, this); })
          .on("dragend", function(d, i) { return that.drag_ended(d, i, this); });

        this.selected_style = this.model.get("selected_style");
        this.unselected_style = this.model.get("unselected_style");
        this.selected_indices = this.model.get("selected");

        this.hovered_style = this.model.get("hovered_style");
        this.unhovered_style = this.model.get("unhovered_style");
        this.hovered_index = (!this.model.get("hovered_point")) ? null: [this.model.get("hovered_point")];

        this.display_el_classes = ["dot", "legendtext"]; //FIXME
        this.event_metadata = {
            "mouse_over": {
                "msg_name": "hover",
                "lookup_data": false,
                "hit_test": true
            },
            "legend_clicked":  {
                "msg_name": "legend_click",
                "hit_test": true
            },
            "element_clicked": {
                "msg_name": "element_click",
                "lookup_data": false,
                "hit_test": true
            },
            "parent_clicked": {
                "msg_name": "background_click",
                "hit_test": false
            }
        };
        this.displayed.then(function() {
            that.parent.tooltip_div.node().appendChild(that.tooltip_div.node());
            that.create_tooltip();
        });

        return base_creation_promise.then(function() {
            that.event_listeners = {};
            that.process_interactions();
            that.create_listeners();
            that.compute_view_padding();
            that.draw();
        });
    },

    set_ranges: function() {
        var x_scale = this.scales.x,
            y_scale = this.scales.y,
            size_scale = this.scales.size,
            opacity_scale = this.scales.opacity,
            skew_scale = this.scales.skew,
            rotation_scale = this.scales.rotation;
        if(x_scale) {
            x_scale.set_range(this.parent.padded_range("x", x_scale.model));
        }
        if(y_scale) {
            y_scale.set_range(this.parent.padded_range("y", y_scale.model));
        }
        if(size_scale) {
            size_scale.set_range([0, this.model.get("default_size")]);
        }
        if(opacity_scale) {
            opacity_scale.set_range([0.2, 1]);
        }
        if(skew_scale) {
            skew_scale.set_range([0, 1]);
        }
        if(rotation_scale) {
            rotation_scale.set_range([0, 180]);
        }
    },

    set_positional_scales: function() {
        this.x_scale = this.scales.x;
        this.y_scale = this.scales.y;
        // If no scale for "x" or "y" is specified, figure scales are used.
        if(!this.x_scale) {
            this.x_scale = this.parent.scale_x;
        }
        if(!this.y_scale) {
            this.y_scale = this.parent.scale_y;
        }
        this.listenTo(this.x_scale, "domain_changed", function() {
            if (!this.model.dirty) {
                var animate = true;
                this.update_position(animate); }
        });
        this.listenTo(this.y_scale, "domain_changed", function() {
            if (!this.model.dirty) {
                var animate = true;
                this.update_position(animate); }
        });
    },

    initialize_additional_scales: function() {
        // function to create the additional scales and create the
        // listeners for the additional scales
        var color_scale = this.scales.color,
            size_scale = this.scales.size,
            opacity_scale = this.scales.opacity,
            skew_scale = this.scales.skew,
            rotation_scale = this.scales.rotation;
        // the following handlers are for changes in data that does not
        // impact the position of the elements
        if (color_scale) {
            this.listenTo(color_scale, "domain_changed", function() {
                var animate = true;
                this.color_scale_updated(animate);
            });
            color_scale.on("color_scale_range_changed",
                            this.color_scale_updated, this);
        }
        if (size_scale) {
            this.listenTo(size_scale, "domain_changed", function() {
                var animate = true;
                this.update_default_size(animate);
            });
        }
        if (opacity_scale) {
            this.listenTo(opacity_scale, "domain_changed", function() {
                var animate = true;
                this.update_default_opacities(animate);
            });
        }
        if (skew_scale) {
            this.listenTo(skew_scale, "domain_changed", function() {
                var animate = true;
                this.update_default_skew(animate);
            });
        }
        if (rotation_scale) {
            this.listenTo(rotation_scale, "domain_changed", function() {
                var animate = true;
                this.update_position(animate);
            });
        }
    },

    create_listeners: function() {
        ScatterBase.__super__.create_listeners.apply(this);
        this.d3el.on("mouseover", _.bind(function() {
              this.event_dispatcher("mouse_over");
          }, this))
          .on("mousemove", _.bind(function() {
              this.event_dispatcher("mouse_move");
          }, this))
          .on("mouseout", _.bind(function() {
              this.event_dispatcher("mouse_out");
          }, this));

        this.listenTo(this.model, "data_updated", function() {
            //animate dots on data update
            var animate = true;
            this.draw(animate);
        }, this);
        this.listenTo(this.model, "change:tooltip", this.create_tooltip, this);
        this.listenTo(this.model, "change:enable_hover", function() { this.hide_tooltip(); }, this);
        this.listenTo(this.model, "change:interactions", this.process_interactions);
        this.listenTo(this.model, "change:enable_move", this.set_drag_behavior);
        this.listenTo(this.model, "change:selected", this.update_selected);
        this.listenTo(this.model, "change:hovered_point", this.update_hovered);
        this.listenTo(this.model, "change:hovered_style", this.hovered_style_updated, this);
        this.listenTo(this.model, "change:unhovered_style", this.unhovered_style_updated, this);
        this.listenTo(this.parent, "bg_clicked", function() {
            this.event_dispatcher("parent_clicked");
        });
    },

    // The following three functions are convenience functions to get
    // the fill color / opacity / size of an element given the data.
    // In fact they are more than convenience functions as they limit the
    // points of entry to that logic which makes it easier to manage and to
    // keep consistent across different places where we use it.
    get_element_color: function(data, index) {
        var color_scale = this.scales.color;
        var colors = this.model.get("colors");
        var len = colors.length;
        if(color_scale && data.color !== undefined && data.color !== null) {
            return color_scale.scale(data.color);
        }
        return colors[index % len];
    },

    get_element_size: function(data) {
        var size_scale = this.scales.size;
        if(size_scale && data.size !== undefined) {
            return size_scale.scale(data.size);
        }
        return this.model.get("default_size");
    },

    get_element_opacity: function(data, index) {
        var opacity_scale = this.scales.opacity;
        var default_opacities = this.model.get("default_opacities");
        var len = default_opacities.length;
        if(opacity_scale && data.opacity !== undefined) {
            return opacity_scale.scale(data.opacity);
        }
        return default_opacities[index % len];
    },

    get_element_skew: function(data) {
        var skew_scale = this.scales.skew;
        if(skew_scale && data.skew !== undefined) {
            return skew_scale.scale(data.skew);
        }
        return this.model.get("default_skew");
    },

    get_element_rotation: function(d) {
        var rotation_scale = this.scales.rotation;
        return (!rotation_scale || !d.rotation) ? "" :
            "rotate(" + rotation_scale.scale(d.rotation) + ")";
    },

    relayout: function() {
        this.set_ranges();
        this.update_position();
    },

    update_position: function(animate) {
        var x_scale = this.scales.x, y_scale = this.scales.y;
        var that = this;
        var animation_duration = animate === true ? this.parent.model.get("animation_duration") : 0;

        this.d3el.selectAll(".object_grp").transition("update_position")
            .duration(animation_duration)
            .attr("transform", function(d) {
                return "translate(" + (x_scale.scale(d.x) + x_scale.offset) +
                                "," + (y_scale.scale(d.y) + y_scale.offset) + ")" +
                       that.get_element_rotation(d);
            });
        this.x_pixels = this.model.mark_data.map(function(el) { return x_scale.scale(el.x) + x_scale.offset; });
        this.y_pixels = this.model.mark_data.map(function(el) { return y_scale.scale(el.y) + y_scale.offset; });
        this.pixel_coords = this.model.mark_data.map(function(el) {
                return [x_scale.scale(el.x) + x_scale.offset,
                        y_scale.scale(el.y) + y_scale.offset];
            });
    },

    draw: function(animate) {
        this.set_ranges();
        var x_scale = this.scales.x, y_scale = this.scales.y;
        var that = this,
            fill = this.model.get("fill");

        var animation_duration = animate === true ? this.parent.model.get("animation_duration") : 0;

        var elements = this.d3el.selectAll(".object_grp")
            .data(this.model.mark_data, function(d) { return d.unique_id; });

        var elements_added = elements.enter().append("g")
            .attr("class", "object_grp")

        this.update_position(animate);

        this.set_drag_behavior();
        elements.on("click", _.bind(function(d, i) {
            this.event_dispatcher("element_clicked",
			      {"data": d, "index": i});
        }, this));
	    elements.on("mouseover", _.bind(function(d, i) {
		    this.scatter_hover_handler({"data": d, "index": i});
	    }, this));
	    elements.on("mouseout", _.bind(function() {
		    this.reset_hover();
	    }, this));

        this.draw_elements(animate, elements_added)

        // Removed the transition on exit as it was causing issues.
        // Elements are not removed until the transition is complete and
        // hence the setting styles function doesn't behave as intended.
        // The only way to call the function after all of the elements are
        // removed is round-about and doesn't look very nice visually.
        elements.exit().remove();
    },

    draw_elements: function(animate, elements_added) {},

    process_interactions: function() {
        var interactions = this.model.get("interactions");
        if(_.isEmpty(interactions)) {
            //set all the event listeners to blank functions
            this.reset_interactions();
        } else {
            if(interactions.click !== undefined &&
               interactions.click !== null) {
                if(interactions.click === "tooltip") {
                    this.event_listeners.element_clicked = function() {
                        return this.refresh_tooltip(true);
                    };
                    this.event_listeners.parent_clicked = this.hide_tooltip;
                } else if (interactions.click === "add") {
                    this.event_listeners.parent_clicked = this.add_element;
                    this.event_listeners.element_clicked = function() {};
                } else if (interactions.click === "delete") {
                    this.event_listeners.parent_clicked = function() {};
                    this.event_listeners.element_clicked = this.delete_element;
                } else if (interactions.click == 'select') {
   		            this.event_listeners.parent_clicked = this.reset_selection;
		            this.event_listeners.element_clicked = this.scatter_click_handler;
	            }
            } else {
                this.reset_click();
            }
            if(interactions.hover !== undefined &&
              interactions.hover !== null) {
                if(interactions.hover === "tooltip") {
                    this.event_listeners.mouse_over = this.refresh_tooltip;
                    this.event_listeners.mouse_move = this.move_tooltip;
                    this.event_listeners.mouse_out = this.hide_tooltip;
                }
            } else {
                this.reset_hover();
            }
            if(interactions.legend_click !== undefined &&
              interactions.legend_click !== null) {
                if(interactions.legend_click === "tooltip") {
                    this.event_listeners.legend_clicked = function() {
                        return this.refresh_tooltip(true);
                    };
                    this.event_listeners.parent_clicked = this.hide_tooltip;
                }
            } else {
                this.event_listeners.legend_clicked = function() {};
            }
            if(interactions.legend_hover !== undefined &&
              interactions.legend_hover !== null) {
                if(interactions.legend_hover === "highlight_axes") {
                    this.event_listeners.legend_mouse_over = _.bind(this.highlight_axes, this);
                    this.event_listeners.legend_mouse_out = _.bind(this.unhighlight_axes, this);
                }
            } else {
                this.reset_legend_hover();
            }
        }
    },

	reset_hover: function() {
	    this.model.set("hovered_point", null);
	    this.hovered_index = null;
	    this.touch();
	},

	scatter_hover_handler: function(args) {
	    var data = args.data;
        var index = args.index;

        this.model.set("hovered_point",
                       index, {updated_view: this});
	    this.touch();
    },

    reset_selection: function() {
        this.model.set("selected", null);
        this.selected_indices = null;
        this.touch();
    },

    scatter_click_handler: function(args) {
        var data = args.data;
        var index = args.index;
        var that = this;
        var idx = this.model.get("selected");
        var selected = idx ? utils.deepCopy(idx) : [];
        // index of bar i. Checking if it is already present in the list.
        var elem_index = selected.indexOf(index);
        // Replacement for "Accel" modifier.
        var accelKey = d3.event.ctrlKey || d3.event.metaKey;

        if(elem_index > -1 && accelKey) {
            // if the index is already selected and if accel key is
            // pressed, remove the element from the list
            selected.splice(elem_index, 1);
        } else {
            if(accelKey) {
                //If accel is pressed and the bar is not already selcted
                //add the bar to the list of selected bars.
                selected.push(index);
            }
            // updating the array containing the bar indexes selected
            // and updating the style
            else {
                //if accel is not pressed, then clear the selected ones
                //and set the current element to the selected
                selected = [];
                selected.push(index);
            }
        }
        this.model.set("selected",
                       ((selected.length === 0) ? null : selected),
                       {updated_view: this});
        this.touch();
        if(!d3.event) {
            d3.event = window.event;
        }
        var e = d3.event;
        if(e.cancelBubble !== undefined) { // IE
            e.cancelBubble = true;
        }
        if(e.stopPropagation) {
            e.stopPropagation();
        }
        e.preventDefault();
	},

    // Hovered Style related functions
    hovered_style_updated: function(model, style) {
        this.hovered_style = style;
        this.clear_style(model.previous("hovered_style"), this.hovered_index);
        this.style_updated(style, this.hovered_index);
    },

    unhovered_style_updated: function(model, style) {
        this.unhovered_style = style;
        var hov_indices = this.hovered_index;
        var unhovered_indices = (hov_indices) ?
            _.range(this.model.mark_data.length).filter(function(index){
                return hov_indices.indexOf(index) === -1;
            }) : [];
        this.clear_style(model.previous("unhovered_style"), unhovered_indices);
        this.style_updated(style, unhovered_indices);
    },


    draw_legend: function(elem, x_disp, y_disp, inter_x_disp, inter_y_disp) {
        this.legend_el = elem.selectAll(".legend" + this.uuid)
          .data([this.model.mark_data[0]]);
        var colors = this.model.get("colors"),
            len = colors.length;

        var that = this;
        var rect_dim = inter_y_disp * 0.8;
        var el_added = this.legend_el.enter()
          .append("g")
            .attr("class", "legend" + this.uuid)
            .attr("transform", function(d, i) {
                return "translate(0, " + (i * inter_y_disp + y_disp)  + ")";
            })
            .on("mouseover", _.bind(function() {
               this.event_dispatcher("legend_mouse_over");
            }, this))
            .on("mouseout", _.bind(function() {
               this.event_dispatcher("legend_mouse_out");
            }, this))
            .on("click", _.bind(function() {
                this.event_dispatcher("legend_clicked");
            }, this));

        this.draw_legend_elements(el_added, rect_dim)

        this.legend_el.append("text")
          .attr("class","legendtext")
          .attr("x", rect_dim * 1.2)
          .attr("y", rect_dim / 2)
          .attr("dy", "0.35em")
          .text(function(d, i) {
              return that.model.get("labels")[i];
          })
          .style("fill", function(d, i) {
              return colors[i % len];
          });

        var max_length = d3.max(this.model.get("labels"), function(d) {
            return d.length;
        });

        this.legend_el.exit().remove();
        return [1, max_length];
    },

    draw_legend_elements: function(elements_added, rect_dim) {},

    invert_point: function(pixel) {
        if(pixel === undefined) {
            this.model.set("selected", null);
            this.touch();
            return;
        }

        var x_scale = this.scales.x;
        var abs_diff = this.x_pixels.map(function(elem) { return Math.abs(elem - pixel); });
        var sel_index = abs_diff.indexOf(d3.min(abs_diff));

        this.model.set("selected", [sel_index]);
        this.touch();
    },

    selector_changed: function(point_selector, rect_selector) {
        if(point_selector === undefined) {
            this.model.set("selected", null);
            this.touch();
            return [];
        }
        var pixels = this.pixel_coords;
        var indices = _.range(pixels.length);
        var selected = _.filter(indices, function(index) {
            return point_selector(pixels[index]);
        });
        this.model.set("selected", selected);
        this.touch();
    },

    update_selected: function(model, value) {
        this.selected_indices = value;
        this.apply_styles();
    },

    update_hovered: function(model, value) {
        this.hovered_index = value === null ? value : [value];
        this.apply_styles();
    },

    apply_styles: function(style_arr) {
        if(style_arr === undefined || style_arr == null) {
            style_arr = [this.selected_style, this.unselected_style,
                         this.hovered_style, this.unhovered_style];
        }
        ScatterBase.__super__.apply_styles.apply(this, [style_arr]);

        var all_indices = _.range(this.model.mark_data.length);

        this.set_style_on_elements(this.hovered_style, this.hovered_index);
        var unhovered_indices = (!this.hovered_index) ?
            [] : _.difference(all_indices, this.hovered_index);
        this.set_style_on_elements(this.unhovered_style, unhovered_indices);
    },

    clear_style: function(style_dict, indices) {
        // Function to clear the style of a dict on some or all the elements of the
        // chart.If indices is null, clears the style on all elements. If
        // not, clears on only the elements whose indices are mathcing.
        //
        // This function is not used right now. But it can be used if we
        // decide to accommodate more properties than those set by default.
        // Because those have to cleared specifically.
        var elements = this.d3el.selectAll(".element");
        if(indices) {
            elements = elements.filter(function(d, index) {
                return indices.indexOf(index) !== -1;
            });
        }
        var clearing_style = {};
        for(var key in style_dict) {
            clearing_style[key] = null;
        }
        elements.style(clearing_style);
    },

    set_style_on_elements: function(style, indices) {
        // If the index array is undefined or of length=0, exit the
        // function without doing anything
        if(!indices || indices.length === 0) {
            return;
        }
        // Also, return if the style object itself is blank
        if(Object.keys(style).length === 0) {
            return;
        }
        var elements = this.d3el.selectAll(".element");
        elements = elements.filter(function(data, index) {
            return indices.indexOf(index) !== -1;
        });
        elements.style(style);
    },

    compute_view_padding: function() {
        //This function computes the padding along the x and y directions.
        //The value is in pixels.
        var x_padding = Math.sqrt(this.model.get("default_size")) / 2 + 1.0;

        if(x_padding !== this.x_padding || x_padding !== this.y_padding) {
            this.x_padding = x_padding;
            this.y_padding = x_padding;
            this.trigger("mark_padding_updated");
        }
    },

    update_array: function(d, i) {
        var x_scale = this.scales.x,
            y_scale = this.scales.y;

        if (!this.model.get("restrict_y")){
            var x = this.model.get('x').slice(); // copy
            x[i] = x_scale.scale.invert(d[0]);
            this.model.set("x", x);
        }
        if (!this.model.get("restrict_x")){
            var y = this.model.get('y').slice()
            y[i] = y_scale.scale.invert(d[1]);
            this.model.set("y", y);
        }
        this.touch();
    },

    set_drag_behavior: function() {
        var elements = this.d3el.selectAll(".object_grp");
        if (this.model.get("enable_move")) {
            elements.call(this.drag_listener);
        } else {
            elements.on(".drag", null);
        }
    },

    set_drag_style: function(d, i, dragged_node) {},

    reset_drag_style: function(d, i, dragged_node) {},

    drag_start: function(d, i, dragged_node) {
        // d[0] and d[1] will contain the previous position (in pixels)
        // of the dragged point, for the length of the drag event
        var x_scale = this.scales.x, y_scale = this.scales.y;
        d[0] = x_scale.scale(d.x) + x_scale.offset;
        d[1] = y_scale.scale(d.y) + y_scale.offset;

        this.set_drag_style(d, i, dragged_node)

        this.send({
            event: "drag_start",
            point: {x : d.x, y: d.y},
            index: i
        });
    },

    on_drag: function(d, i, dragged_node) {
        var x_scale = this.scales.x, y_scale = this.scales.y;
        // If restrict_x is true, then the move is restricted only to the X
        // direction.
        var restrict_x = this.model.get("restrict_x"),
            restrict_y = this.model.get("restrict_y");
        if (restrict_x && restrict_y) { return; }
        if (!restrict_y) { d[0] = d3.event.x; }
        if (!restrict_x) { d[1] = d3.event.y; }

        d3.select(dragged_node)
          .attr("transform", function() {
              return "translate(" + d[0] + "," + d[1] + ")";
          });
        this.send({
            event: "drag",
            origin: {x: d.x, y: d.y},
	        point: {
                x: x_scale.invert(d[0]),
                y: y_scale.invert(d[1])
            },
            index: i
        });
        if(this.model.get("update_on_move")) {
            // saving on move if flag is set
            this.update_array(d, i);
        }
    },

    drag_ended: function(d, i, dragged_node) {
        var x_scale = this.scales.x, y_scale = this.scales.y;

        this.reset_drag_style(d, i, dragged_node);
        this.update_array(d, i);
        this.send({
            event: "drag_end",
            point: {
                x: x_scale.invert(d[0]),
                y: y_scale.invert(d[1])
            },
            index: i
        });
    },

    selected_deleter: function() {
        d3.event.stopPropagation();
        return;
    },

    add_element: function() {
        var mouse_pos = d3.mouse(this.el);
        var curr_pos = [mouse_pos[0], mouse_pos[1]];

        var x_scale = this.scales.x, y_scale = this.scales.y;
        //add the new point to data
        var x_data = [];
        var x = this.model.get('x');
        var y = this.model.get('y');
        // copy data and fill in the last value
        var xn = new x.constructor(x.length+1)
        var yn = new y.constructor(y.length+1)
        xn.set(x)
        yn.set(y)
        xn[x.length] = x_scale.scale.invert(curr_pos[0]);
        yn[y.length] = y_scale.scale.invert(curr_pos[1]);
        this.model.set("x", xn);
        this.model.set("y", yn);
        this.touch();
        // adding the point and saving the model automatically triggers a
        // draw which adds the new point because the data now has a new
        // point
    },

    delete_element: function(args) {
        var data = args.data;
        var index = args.index;

        // Remove the point from model data
        var x_data = [];
        // copy data to avoid modifying in place (will not detect a change)
        var x = this.model.get("x").slice();
        var y = this.model.get("y").slice();
        x.copyWithin(index, index+1, x.length);
        y.copyWithin(index, index+1, y.length);
        x = x.slice(0, x.length-1);
        y = y.slice(0, x.length-1);

        this.model.set("x", x);
        this.model.set("y", y);
        this.touch();
    }
});

module.exports = {
    ScatterBase: ScatterBase
};
