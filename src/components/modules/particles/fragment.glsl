varying vec3 vColor;

void main() {
    float strength = distance(gl_PointCoord, vec2(0.5,0.5));
    if (strength > 0.4) discard;
    strength = step(0.4, strength);
    strength = 1.0 - strength;

    gl_FragColor = vec4(vColor * strength, strength);
}