shader_type canvas_item;
// Soft "bones" for a single painted pose: each bone bends the pixels inside a
// soft ellipse around its pivot, like a mesh deform without cutting the art up.
// bone_a = (pivot.x, pivot.y, center.x, center.y) in image pixels
// bone_b = (radius.x, radius.y, angle in radians, where the soft edge starts 0..1)
uniform vec4 bone_a[4];
uniform vec4 bone_b[4];
uniform int bone_count = 0;
uniform vec2 tex_size = vec2(512.0, 512.0);

vec2 rot(vec2 v, float a) {
	float c = cos(a);
	float s = sin(a);
	return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

void fragment() {
	vec2 p = UV * tex_size;
	for (int i = 0; i < 4; i++) {
		if (i >= bone_count) { break; }
		vec2 pivot = bone_a[i].xy;
		vec2 center = bone_a[i].zw;
		vec2 rad = bone_b[i].xy;
		float ang = bone_b[i].z;
		float d = length((p - center) / rad);
		float w = 1.0 - smoothstep(bone_b[i].w, 1.0, d);
		p = pivot + rot(p - pivot, -ang * w);
	}
	vec2 uv = p / tex_size;
	vec4 col = texture(TEXTURE, uv);
	if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) { col.a = 0.0; }
	COLOR = col * COLOR;
}
