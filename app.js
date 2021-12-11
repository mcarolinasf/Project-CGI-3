import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, perspective, vec3 } from "../../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multScale, multTranslation, popMatrix, pushMatrix} from "../../libs/stack.js";

import * as TORUS from '../../libs/torus.js';
import * as CUBE from '../../libs/cube.js';
import * as SPHERE from '../../libs/sphere.js';
import * as dat from '../../libs/dat.gui.module.js';


/** @type WebGLRenderingContext */
let gl;

let mode;
let mView, mProjection;
let aspect;


const FLOORX_SCALE = 3,FLOORY_SCALE = 0.1, FLOORZ_SCALE = 3;
const TORUSX_SCALE = 1,TORUSY_SCALE = 1, TORUSZ_SCALE = 1;
const LIGHT_DIAMETER = 0.1;

const torus_DISK_RADIUS = 0.2 * TORUSY_SCALE;

function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    //let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    //const gui = new dat.GUI();

    var gui = new dat.GUI();

    //Creating Folders
    const optionsF = gui.addFolder('options');
    var cameraF = gui.addFolder('camera');
    var eyeF = cameraF.addFolder('eye');
    var atF = cameraF.addFolder('at');
    var upF = cameraF.addFolder('up');

    let options = {
        wireframe : true,
        normals : false
    }


    //Creating options variables and adding them

    optionsF.add(options, 'wireframe').listen().onChange(function(){
        options.wireframe = true;
        options.normals = false;
    });

    optionsF.add(options, 'normals').listen().onChange(function(){
        options.wireframe = false;
        options.normals = true;
    });

    let camera = {
       
        eye : vec3(0,0,5),
        at : vec3(0,0,0),
        up : vec3(0,1,0),
        fovy : 45,
        aspect : canvas.width / canvas.height,
        near : 0.1,
        far : 20
            
    }

    //Creating camera variables and adding them
    cameraF.add(camera, 'fovy', 0, 100).listen();
    cameraF.add(camera, 'aspect',0,10).listen();
    cameraF.add(camera, 'near', 0, 19.9).listen();
    cameraF.add(camera, 'far', 0, 20).listen();


    //Creating eye variables and adding them
    eyeF.add(camera.eye, '0').listen();
    eyeF.add(camera.eye, '1').listen();
    eyeF.add(camera.eye, '2').listen();

    //Creating at variables and adding them
    atF.add(camera.at, '0').listen();
    atF.add(camera.at, '1').listen();
    atF.add(camera.at, '2').listen();

    //Creating up variables and adding them
    upF.add(camera.up, '0').listen();
    upF.add(camera.up, '1').listen();
    upF.add(camera.up, '2').listen();

    
   

    resize_canvas();
    window.addEventListener("resize", resize_canvas);


    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    TORUS.init(gl);
    CUBE.init(gl);
    SPHERE.init(gl);
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

       function resize_canvas(event)
    
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = perspective(camera.fovy, camera.aspect, camera.near,camera.far);

    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function torus(){
     
        multTranslation([0,torus_DISK_RADIUS,0]);
        multScale([TORUSX_SCALE,TORUSY_SCALE,TORUSZ_SCALE]);

        uploadModelView();
        TORUS.draw(gl, program, mode);
    }

    function cube(){
        multTranslation([0,-FLOORY_SCALE/2,0]);
        multScale([FLOORX_SCALE,FLOORY_SCALE,FLOORZ_SCALE]);
     
        uploadModelView();
        CUBE.draw(gl, program, mode);
    }

    function light(){
        multTranslation([0,TORUSY_SCALE,0]);
        multScale([LIGHT_DIAMETER,LIGHT_DIAMETER,LIGHT_DIAMETER]);
     
        uploadModelView();
        SPHERE.draw(gl, program, mode);
    }



    function render()
    {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mView = lookAt(camera.eye ,camera.at,camera.up);
        loadMatrix(mView);

        mProjection = perspective(camera.fovy, camera.aspect, camera.near,camera.far);

        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
        
        if(options.wireframe == true)
        mode = gl.LINES;
        else mode = gl.TRIANGLES;
        
        pushMatrix();
            torus();
        popMatrix();
        pushMatrix();
            cube();
        popMatrix();
        pushMatrix();
            light();
        popMatrix();
       
      
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))