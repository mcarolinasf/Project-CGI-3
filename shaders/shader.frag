precision highp float;

varying vec3 fNormal;
const int MAX_LIGHTS = 8;
//uniform int uNLights; // Effective number of lights used
//uniform LightInfo uLight[MAX_LIGHTS]; // The array of lights present in the scene
//uniform MaterialInfo uMaterial;  // The material of the object being drawn*/

void main() {
    vec3 c = fNormal + vec3(1.0, 1.0, 1.0);
    gl_FragColor = vec4(0.5*c, 1.0);
}

/*
struct LightInfo {
    vec3 pos;
    vec3 Ia;
    vec3 Id;
    vec3 Is;
    bool isDirectional;
    bool isActive;
};

struct MaterialInfo {
    vec3 Ka;
    vec3 Kd;
    vec3 Ks;
    float shininess;
};*/

