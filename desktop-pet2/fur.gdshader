// Recolours only the part of a picture that a mask marks as fur (or as cloak).
// The drawing stays as it is; its brightness is read and mapped onto a new dark-to-light pair, so
// the fur keeps all of its shading and its ink outline while changing colour.
shader_type canvas_item;

uniform sampler2D mask : hint_default_white, filter_linear;
uniform vec4 dark_col : source_color = vec4(0.35, 0.22, 0.12, 1.0);
uniform vec4 light_col : source_color = vec4(0.82, 0.64, 0.46, 1.0);
uniform float amount = 0.0;       // 0 keeps the drawing exactly as it was
uniform float gain = 1.0;
uniform float clip_to_mask = 0.0;   // 1 = draw only where the mask is, for a layer laid over another

void fragment() {
	vec4 c = texture(TEXTURE, UV);
	float m = texture(mask, UV).r;
	float l = clamp(dot(c.rgb, vec3(0.299, 0.587, 0.114)) * gain, 0.0, 1.0);
	vec3 re = mix(dark_col.rgb, light_col.rgb, smoothstep(0.08, 0.92, l));
	c.rgb = mix(c.rgb, re, clamp(m * amount, 0.0, 1.0));
	c.a *= mix(1.0, m, clip_to_mask);
	COLOR = c;
}
