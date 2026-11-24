shader_type canvas_item;
// Wind and water for the painted scenes. The mask is painted per scene:
// red = leaves that sway, green = water that shimmers, blue = lamps that flicker.
uniform sampler2D mask : filter_linear;
uniform float sway = 1.0;
uniform float wind = 0.0;   // extra gusts while you type

void fragment() {
	vec4 m = texture(mask, UV);
	float t = TIME;
	vec2 px = TEXTURE_PIXEL_SIZE;
	vec2 uv = UV;
	// leaves: a slow side to side push that ripples up the plant
	float leaf = sin(t * 1.6 + UV.y * 18.0 + UV.x * 6.0) * 0.6 + sin(t * 2.7 + UV.x * 25.0) * 0.4;
	uv.x += leaf * m.r * (1.4 + wind * 1.6) * px.x * sway;
	uv.y += sin(t * 2.1 + UV.x * 30.0) * m.r * 0.7 * px.y * sway;
	// water: small rolling waves
	uv.x += sin(t * 1.3 + UV.y * 90.0) * m.g * 1.3 * px.x;
	uv.y += cos(t * 1.1 + UV.x * 40.0) * m.g * 0.8 * px.y;
	vec4 col = texture(TEXTURE, uv);
	// glints on the water
	float glint = pow(max(0.0, sin(t * 1.7 + UV.x * 70.0 + UV.y * 35.0) * sin(t * 1.1 - UV.x * 33.0 + UV.y * 60.0)), 12.0);
	col.rgb += vec3(0.55, 0.75, 0.8) * glint * m.g * 0.55;
	// lamps breathe a little
	float fl = 0.5 + 0.5 * sin(t * 5.3) * sin(t * 2.3 + 1.7);
	col.rgb *= 1.0 + m.b * (fl - 0.4) * 0.12;
	COLOR = col * COLOR;
}
