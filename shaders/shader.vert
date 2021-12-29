
uniform mat4 mNormals; // model-view transformation for normals
uniform mat4 mModelView; // model-view transformation
uniform mat4 mProjection; // projection matrix

attribute vec4 vPosition; // vertex position in modelling coordinates
attribute vec4 vNormal; // vertex normal in modelling coordinates

varying vec3 fNormal;
varying vec3 fPosition;


void main(){
// compute position in camera frame
fPosition = (mModelView * vPosition).xyz;
// compute normal in camera frame
fNormal = (mNormals * vNormal).xyz;


gl_Position =  mProjection * mModelView * vPosition;

}

