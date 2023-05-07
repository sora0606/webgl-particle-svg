attribute vec3 color;
varying vec3 vColor;
uniform float uSize;
uniform float uTime;
uniform float uAmp;

void main() {
    /**
    * Position
    */
    vec3 newPosition = position;
    newPosition.x += sin(uTime + position.y * 0.5) * uAmp;
    newPosition.z += cos(uTime + position.y * 0.5) * uAmp;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);


    /**
    * Size
    */
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;

    gl_PointSize = uSize;
    gl_PointSize *= (100.0 / - viewPosition.z);//sizeAttenuation: true

    /**
    * Color
    */
    vColor = color;
}