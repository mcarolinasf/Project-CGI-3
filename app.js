import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, perspective, vec3, vec4 } from "../../libs/MV.js";
import {modelView, loadMatrix, multRotationY,multRotationZ, multRotationX, multScale, multTranslation, popMatrix, pushMatrix} from "../../libs/stack.js";

import * as TORUS from '../../libs/torus.js';
import * as CUBE from '../../libs/cube.js';
import * as SPHERE from '../../libs/sphere.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as PYRAMID from '../../libs/pyramid.js';
import * as dat from '../../libs/dat.gui.module.js';
import { inverse, mult, normalMatrix, rotate, rotateY, scale } from "./libs/MV.js";


/** @type WebGLRenderingContext */
let gl;


let mouseDown = false;
let mouseX = 0,mouseY = 0;
let mode,lighsMode,mView, mProjection;

//Arrays
let lightsArray = [];
let objectsArray = ['DONUT', 'CUBE', 'SPHERE', 'CYLINDER', 'PYRAMID'];

//Constants
const FLOORX_SCALE = 3,FLOORY_SCALE = 0.1, FLOORZ_SCALE = 3;
const LIGHT_DIAMETER = 0.1;
const MAX_LIGHT = 8;
const ANGLE = 1;

function setup(shaders){
    let canvas = document.getElementById("gl-canvas");

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    const gui = new dat.GUI();
    const obj = new dat.GUI();

    let object = {
        type :  objectsArray[1]
    }

    let material = {
        Ka : [0,25,0],
        Kd : [102,192,187],
        Ks : [255,255,255],
        shininess : 50,
        solid : true      
    }

    obj.add(object, 'type', objectsArray);

    //Creating Folders for obj
    var materialF = obj.addFolder('material');

    //Adding material variables
    materialF.addColor(material,'Ka');
    materialF.addColor(material,'Kd');
    materialF.addColor(material,'Ks');
    materialF.add(material,'shininess').min(1);
    materialF.add(material,'solid');
   

    //Creating Folders for gui
    var optionsF = gui.addFolder('options');
    var cameraF = gui.addFolder('camera');
    var lightsF = gui.addFolder('lights');
    var eyeF = cameraF.addFolder('eye');
    var atF = cameraF.addFolder('at');
    var upF = cameraF.addFolder('up');


    let options = {
        culling : true,
        depth : true,
        lights : true,
        solid : true
    }

    let button = {
        name: function() {
            addLight();
        }
    }

    lightsF.add(button,"name").name("Add light");

    //Adding light variables
    function addLight(){

        let i = lightsArray.length + 1;

        if(MAX_LIGHT >= i){

        let light = {
            position : vec3(1,1.2,0),
            ambient: [75,75,75],
            diffuse: [175,175,175],
            specular: [255,255,255],
            directional : false,
            active : true,
            animation : true
        }


        let lightsX = lightsF.addFolder('light ' + i);
        let positionLF = lightsX.addFolder('position');
        let optionsLF = lightsX.addFolder('options');

        positionLF.add(light.position, '0').listen();
        positionLF.add(light.position, '1').listen();
        positionLF.add(light.position, '2').listen();

        optionsLF.add(light,'directional').listen();
        optionsLF.add(light,'active').listen();
        optionsLF.add(light,'animation').listen();

        lightsX.addColor(light,'ambient').listen();
        lightsX.addColor(light,'diffuse').listen();
        lightsX.addColor(light,'specular').listen();

      
        lightsArray.push(light);
        }
    }

  
    //Adding options variables
    optionsF.add(options, 'culling');
    optionsF.add(options, 'depth');
    optionsF.add(options, 'lights');
    optionsF.add(options, 'solid');

    let camera = {
       
        eye : vec3(1,2,5),
        at : vec3(0,0,0),
        up : vec3(0,1,0),
        fovy : 45,
        aspect : canvas.width / canvas.height,
        near : 0.1,
        far : 20           
    }

    //Adding camera variables
    cameraF.add(camera, 'fovy', 0, 100 , 0.2).listen();
    cameraF.add(camera, 'near', 0, 19.9).listen();
    cameraF.add(camera, 'far', 0, 20).listen();


    //Adding eye variables
    eyeF.add(camera.eye, 0).listen();
    eyeF.add(camera.eye, 1).listen();
    eyeF.add(camera.eye, 2).listen();

    //Adding at variables
    atF.add(camera.at, '0').listen();
    atF.add(camera.at, '1').listen();
    atF.add(camera.at, '2').listen();

    //Adding up variables
    upF.add(camera.up, '0').listen();
    upF.add(camera.up, '1').listen();
    upF.add(camera.up, '2').listen();


    resize_canvas();
    window.addEventListener("resize", resize_canvas);


    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    TORUS.init(gl);
    CUBE.init(gl);
    SPHERE.init(gl);
    CYLINDER.init(gl);
    PYRAMID.init(gl);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    
    window.requestAnimationFrame(render);


    canvas.addEventListener('wheel', function(e) {
        let offset = 0.5;
        if(e.deltaY > 0){ //Zoom out
            offset = -offset;
        }
        if(e.altKey)
        moveEyeAtCloser(offset);

        if(e.shiftKey)
        moveBothEyeAt(offset);

        camera.fovy  -= offset;    

    });

    function moveEyeAtCloser(offset){
       
        for(let i = 0; i < 3; i++){
            let diff = camera.eye[i] - camera.at[i];
            if(diff > 1)
            camera.eye[i] -= offset;
        }
    }

    function moveBothEyeAt(offset){

        if(camera.up[0] == 1 || camera.up[3] == 1 ){
            camera.eye[1] += offset;
            camera.at[1] += offset;
        }else {
            camera.eye[2] -= offset;
            camera.at[2] -= offset;
        }
    }

    canvas.addEventListener('mousemove', function (evt) {
        if (!mouseDown) {return} // is the button pressed?
        evt.preventDefault();
        var deltaX = evt.clientX - mouseX,
            deltaY = evt.clientY - mouseY;
        mouseX = evt.clientX;
        mouseY = evt.clientY;
        if(deltaX !=0 || deltaY != 0)
        dragAction(deltaX, deltaY);
    }, false);

    function dragAction(deltaX, deltaY) {

        let axisR = vec3(deltaY/10, deltaX/10,0);

        let WC = normalMatrix(inverse(mView));

        let axisRWC = vec4(mult(WC,vec4(axisR,0)));

        let R = rotate(1,axisRWC);
    
        let tempEye = mult(R,vec4(camera.eye,1));

        camera.eye[0] = tempEye[0];
        camera.eye[1] = tempEye[1];
        camera.eye[2] = tempEye[2];


    }


    canvas.addEventListener('mouseup', function (evt) {
        mouseDown = false;
    }, false);

    canvas.addEventListener('mousedown', function (evt) {
        evt.preventDefault();
        mouseDown = true;
        mouseX = evt.clientX;
        mouseY = evt.clientY;
    }, false);

    function resize_canvas(event){
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        camera.aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = perspective(camera.fovy, camera.aspect, camera.near,camera.far);
    }

    function uploadModelView(){
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }


    function floor(){
        multTranslation([0,-FLOORY_SCALE/2 - 0.5,0]);
        multScale([FLOORX_SCALE,FLOORY_SCALE,FLOORZ_SCALE]);
     
        uploadModelView();
        CUBE.draw(gl, program, options.solid ? gl.TRIANGLES : gl.LINES);
    }

    function lights(){

        for(let i = 0; i < lightsArray.length ;i++){
            
            pushMatrix();
                let l = lightsArray[i];
            
                if(l.animation) {
                
                    let R = rotate(ANGLE, vec4(camera.eye,0));
                    let temp = mult(R,vec4(l.position,1));
                    l.position[0] = temp[0];
                    l.position[1] = temp[1];
                    l.position[2] = temp[2];
                }
                
                if(options.lights)
                    if(l.active){
                        light(l.position[0],l.position[1],l.position[2]);
                    }else l.animation = false;
            popMatrix();
            
        }
   
    }


    function light(x,y,z){

        multTranslation([x,y,z]);
        multScale([LIGHT_DIAMETER,LIGHT_DIAMETER,LIGHT_DIAMETER]);
     
        uploadModelView();
        SPHERE.draw(gl, program, lighsMode);
    }

  
    function objectD(){
        uploadModelView();
        let mode = material.solid ? gl.TRIANGLES : gl.LINES
        switch(object.type){
            case objectsArray[0]:
                TORUS.draw(gl, program, mode)
                break;
            case objectsArray[1]:
                CUBE.draw(gl, program, mode)
                break;
            case objectsArray[2]:
                SPHERE.draw(gl, program, mode)
                break;
            case objectsArray[3]:
                CYLINDER.draw(gl, program, mode)
                break;
            case objectsArray[4]:
                PYRAMID.draw(gl, program, mode)
                break;
        }
    }


    function uploadLight(){

        for(let i = 0; i < lightsArray.length; i++){
            
            gl.uniform3fv(gl.getUniformLocation(program, "uLight[" + i +"].Ia"), scale(1/255, lightsArray[i].ambient));
            gl.uniform3fv(gl.getUniformLocation(program, "uLight[" + i +"].Id"), scale(1/255, lightsArray[i].diffuse));
            gl.uniform3fv(gl.getUniformLocation(program, "uLight[" + i +"].Is"), scale(1/255, lightsArray[i].specular));
            gl.uniform3fv(gl.getUniformLocation(program, "uLight[" + i +"].pos"), lightsArray[i].position);
            gl.uniform1i(gl.getUniformLocation(program, "uLight[" + i +"].isDirectional"), lightsArray[i].directional?1:0);
            gl.uniform1i(gl.getUniformLocation(program, "uLight[" + i +"].isActive"), lightsArray[i].active?1:0);
            gl.uniform1i(gl.getUniformLocation(program, "uNLights"), lightsArray.length);
        }
    }

    function uploadMaterial(){

        gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Ka"),scale(1/255, material.Ka));
        gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Kd"),scale(1/255, material.Kd));
        gl.uniform3fv(gl.getUniformLocation(program, "uMaterial.Ks"),scale(1/255, material.Ks));
        gl.uniform1f(gl.getUniformLocation(program, "uMaterial.shininess"),material.shininess);
       
    }


    function render(){
        if(options.culling) gl.enable(gl.CULL_FACE);
        else gl.disable(gl.CULL_FACE);

        gl.depthMask(options.depth); 
    
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mView = lookAt(camera.eye ,camera.at,camera.up);
        loadMatrix(mView);

        mProjection = perspective(camera.fovy, camera.aspect, camera.near, camera.far);

        gl.useProgram(program);


        //Ver se dá para chamar noutro sitio
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mView"), false, flatten(mView));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mViewNormals"), false, flatten(normalMatrix(mView)));
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mNormals"), false, flatten(normalMatrix(modelView())));
               
        
        if(options.lights)  //Not sure se é isto que é para acontecer
        lighsMode = gl.LINES;
        else lighsMode = gl.TRIANGLES;

        uploadLight();
        uploadMaterial();

        pushMatrix();
            objectD();
        popMatrix();
        pushMatrix();
            floor();
        popMatrix();
        pushMatrix();
            lights();
        popMatrix();
       
        
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders));