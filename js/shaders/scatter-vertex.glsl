#include <fog_pars_vertex>
#include <scales>

 // for animation, all between 0 and 1
uniform float animation_time_x;
uniform float animation_time_y;
uniform float animation_time_z;
uniform float animation_time_vx;
uniform float animation_time_vy;
uniform float animation_time_vz;
uniform float animation_time_size;
uniform float animation_time_color;
uniform float animation_time_rotation;
uniform float animation_time_opacity;

uniform bool has_selection;
uniform bool has_hover;

// maybe faster to use #IFDEFS
uniform bool has_selected_fill;
uniform vec4 selected_fill;
uniform bool has_selected_stroke;
uniform vec4 selected_stroke;
uniform bool has_selected_opacity;
uniform float selected_opacity;

uniform bool has_unselected_fill;
uniform vec4 unselected_fill;
uniform bool has_unselected_stroke;
uniform vec4 unselected_stroke;
uniform bool has_unselected_opacity;
uniform float unselected_opacity;


uniform bool has_hovered_fill;
uniform vec4 hovered_fill;
uniform bool has_hovered_stroke;
uniform vec4 hovered_stroke;
uniform bool has_hovered_opacity;
uniform float hovered_opacity;

uniform bool has_unhovered_fill;
uniform vec4 unhovered_fill;
uniform bool has_unhovered_stroke;
uniform vec4 unhovered_stroke;
uniform bool has_unhovered_opacity;
uniform float unhovered_opacity;

uniform vec2 domain_x;
uniform vec2 domain_y;
uniform vec2 domain_z;
uniform vec2 domain_size;
uniform vec2 domain_rotation;
uniform vec2 domain_opacity;

uniform vec2 range_x;
uniform vec2 range_y;
uniform vec2 range_z;
uniform vec2 range_size;
uniform vec2 range_rotation;
uniform vec2 range_opacity;

varying vec4 fill_color;
varying vec4 stroke_color;
varying vec3 vertex_position;
varying vec2 vertex_uv;
varying vec2 vUv;

// #ifdef AS_LINE
// attribute vec3 position_previous;
// #else
attribute float x;
attribute float x_previous;
attribute float y;
attribute float y_previous;

attribute float size;
attribute float size_previous;

attribute float rotation;
attribute float rotation_previous;

attribute float opacity;
attribute float opacity_previous;

// boolean not supported, so float will do
attribute float selected;
attribute float selected_previous;
// #endif

uniform sampler2D colormap;
uniform sampler2D colormap_previous;
attribute vec2 domain_color;

#ifdef USE_COLORMAP
attribute float color;
#else
attribute vec3 color;
#endif

#ifdef USE_COLORMAP_PREVIOUS
attribute float color_previous;
#else
attribute vec3 color_previous;
#endif



#define SCALE_SIZE(x) scale_transform_linear(x, range_size, domain_size)
#define SCALE_ROTATION(x) scale_transform_linear(x, range_rotation, domain_rotation)
#define SCALE_OPACITY(x) scale_transform_linear(x, range_opacity, domain_opacity)

vec3 rotate_xy(vec3 x, float angle) {
    float sina = sin(angle);
    float cosa = cos(angle);
    mat2 m = mat2(cosa, -sina, sina, cosa);
    return vec3(m * x.xy, x.z);
}

void main(void) {
    vUv = uv;

    vec3 animation_time = vec3(animation_time_x, animation_time_y, animation_time_z);


    vec3 domain_offset = vec3(domain_x.x, domain_y.x, domain_z.x);
    vec3 domain_scale  = vec3(domain_x.y, domain_y.y, domain_z.y) - domain_offset;
    vec3 range_offset = vec3(range_x.x, range_y.x, range_z.x);
    vec3 range_scale  = vec3(range_x.y, range_y.y, range_z.y) - range_offset;

    vec3 center = mix(vec3(x_previous, y_previous, 0), vec3(x, y, 0), animation_time);
    vec3 center_normalized = (center - domain_offset) / domain_scale;
    vec3 center_pixels = ((center_normalized*2.)-0.) * range_scale + range_offset;

    float s = sqrt(mix(SCALE_SIZE(size_previous), SCALE_SIZE(size), animation_time_size));
    float angle = SCALE_ROTATION(mix(rotation_previous, rotation, animation_time_rotation));
    vec3 model_pos = rotate_xy(position, 1.) * s + center_pixels;

#ifdef USE_COLORMAP
    float color_index = color; //(color - domain_color[0]) / (domain_color[1] - domain_color[0]);
    vec4 color_rgba = texture2D(colormap, vec2(color_index, 0.5));
#else
    vec4 color_rgba = vec4(color, 1.0);
#endif
#ifdef USE_COLORMAP_PREVIOUS
    float color_index_previous = color_previous;
    vec4 color_rgba_previous = texture2D(colormap, vec2(color_index_previous, 0.5));
#else
    vec4 color_rgba_previous = vec4(color_previous, 1.0);
#endif
    // we don't have selected_color_previous, should we?
    // if(selected )
    color_rgba = mix(color_rgba_previous, color_rgba, animation_time_color);
    color_rgba.a *= SCALE_OPACITY(mix(opacity_previous, opacity, animation_time_opacity));
    fill_color = color_rgba;
    stroke_color = color_rgba;

    if(has_selection) {
        if(has_selected_fill && selected > 0.5 )
            fill_color = selected_fill;
        if(has_unselected_fill && selected < 0.5 )
            fill_color = unselected_fill;
        if(has_selected_stroke && selected > 0.5 )
            stroke_color = selected_stroke;
        if(has_unselected_stroke && selected < 0.5 )
            stroke_color = unselected_stroke;
        if(has_selected_opacity && selected > 0.5 ) {
            stroke_color.a *= selected_opacity;
            fill_color.a *= selected_opacity;
        }
        if(has_unselected_opacity && selected < 0.5 ) {
            stroke_color.a *= unselected_opacity;
            fill_color.a *= unselected_opacity;
        }

    }
    fill_color.rgb *= fill_color.a;
    stroke_color.rgb *= stroke_color.a;

    // color_rgba = has_selection && has_selected_color ? (selected > 0.5 ? selected_color : unselected_color) : color_rgba;
    // color_rgb_previous = selected_previous > 0.5 ? selected_color : color_rgb;
    gl_Position = projectionMatrix * vec4(rotate_xy(position, angle) * s, 1.0) +
                  projectionMatrix*modelViewMatrix * vec4(center_pixels + vec3(0., 0., 0.), 1.0);
}