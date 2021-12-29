precision mediump float;

varying vec3 fPosition;
varying vec3 fNormal;

uniform mat4 mModelView; 
uniform mat4 mNormals; 
uniform mat4 mView; 
uniform mat4 mViewNormals; 
uniform mat4 mProjection;
uniform int uNLights; // Effective number of lights used


const int MAX_LIGHTS = 8;


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
};


uniform LightInfo uLight[MAX_LIGHTS]; // The array of lights present in the scene
uniform MaterialInfo uMaterial;  // The material of the object being drawn*/




void main() {
    // compute light vector in camera frame
    vec3 L, I;

    if(true){
        L = normalize((mViewNormals * vec4(0,1,0,0)).xyz);
    }
    else{
        L = normalize((mView * vec4(0,1,0,0)).xyz - fPosition);
    }

    vec3 V = normalize(-fPosition);
    vec3 N = normalize(fNormal);
    vec3 R = reflect(-L,N);

    float diffuseFactor = max( dot(L,N), 0.0 );
    vec3 diffuse = diffuseFactor * vec3(0.5,0.5,0.5);
    
    float specularFactor = pow(max(dot(R,V), 0.0), uMaterial.shininess);
    vec3 specular = specularFactor * vec3(0.5,0.5,0.5);

    if( dot(N,L) < 0.0 ) {
        specular = vec3(0.0, 0.0, 0.0);
    }

    // add all 3 components from the illumination model
    // (ambient, diffuse and specular)

    for(int i=0; i<MAX_LIGHTS; i++){

        if(i == uNLights) break; 
        
        vec3 ambient = uLight[i].Ia * uMaterial.Ka;
        vec3 diff = uLight[i].Id * uMaterial.Kd * dot(N,L);
        vec3 spec = uLight[i].Is * uMaterial.Ks * pow(dot(R,V), uMaterial.shininess);
        I += ambient + diff + spec;
        
    }

    gl_FragColor = vec4(I, 1.0);
}






