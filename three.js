/*=========================================================================================
	Item Name: Divided Globe
    Module: three.js
	Version: 1.0
	Author: Sergey Patokin
    Last Update: 02.12.2024
	Author URL: https://sergeyforever.online/
===========================================================================================*/

import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

let camera, renderer, controls;
const frustumSize = 7;

let sphere;
let sphere_wire = [];
let material, material_texture;

const params = {
  texture: true,
  wireframe: true,
  fixed: false,
  subdivision: 3,
};

// Info text element
const info = document.getElementById('info');
let faces = 0;
const earthArea = 510100000;

let initialRotation = new THREE.Quaternion();

init();
animate();

function init() {

    // Renderer Settings //
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor( 0x000000, 0.0 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // Camera Setting //
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, 
    frustumSize / 2, frustumSize / - 2, 0.1, 100 );
    camera.position.z = 5;
  
    // Load a texture
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('src/8k_earth_daymap.jpg'); // Replace 'path_to_your_texture.jpg' with your image file

    // Create a material using the texture
    material_texture = new THREE.MeshBasicMaterial({ map: texture });
  	material = new THREE.MeshBasicMaterial({ color: 0xc1e6d4 });

    // Create a sphere geometry
    const geometry = new THREE.SphereGeometry(1.6975, 64, 64);

    // Combine geometry and material to create the mesh
    sphere = new THREE.Mesh(geometry, material_texture);

    // Add the sphere to the scene
    scene.add(sphere);
  
    // Control Settings //
    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
  
  
  	// JSON parsing for creating wire
    async function fetchData(path) {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to fetch JSON: ${response.statusText}`);
        }
        const data = await response.json();
		
        sphere_wire = [];
        for (let i = 0; i < data.length; i += 1) {
          const face = createFace(data[i]);
          scene.add(face);
          sphere_wire.push(face);
          //console.log(data[i]);
        }
        
      } catch (error) {
        console.error('Error fetching JSON:', error);
      }
    }

    fetchData(`./data/sub${params.subdivision}coords.json`);
  	
  	faces = 12*Math.pow(6,params.subdivision);
  	info.innerText = `Faces: 12*6^${params.subdivision} = ${faces.toLocaleString('en-US')}
	Face area: ~${(earthArea/faces).toLocaleString('en-US', { maximumFractionDigits: 2 })} km^2`;
  
  
  	// GUI //
  
  	const gui = new GUI();
    gui.add(params, 'texture').onChange( function( flag )
    {
        if(flag) sphere.material = material_texture;
      	else sphere.material = material;
    });
  	gui.add(params, 'wireframe').onChange( function( flag )
    {
      for (let i = 0; i < sphere_wire.length; i += 1){
        sphere_wire[i].visible = flag;
      }
    });
    gui.add(params, 'fixed').onChange( function( flag )
    {
      if (flag) {
        initialCameraRotation = camera.quaternion.clone();
        initialRotation.copy(camera.quaternion.clone().invert());
        
        console.log("Sphere rotations:", sphere.quaternion.x, sphere.quaternion.y, sphere.quaternion.z, sphere.quaternion.w);
        console.log("Camera rotations:", camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w);
      } else {
        console.log("Sphere rotations AFTER:", sphere.quaternion.x, sphere.quaternion.y, sphere.quaternion.z, sphere.quaternion.w);
        console.log("Camera rotations AFTER:", camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w);
      }
    });
    gui.add(params, 'subdivision', [1,2,3,4,5]).onChange( function( subdivision )
    {
      // Current wire remove
      for (let i = 0; i < sphere_wire.length; i += 1){
        scene.remove(sphere_wire[i]);
      }
      // Creating new wire
      faces = 12*Math.pow(6,subdivision);
      fetchData(`./data/sub${subdivision}coords.json`);
      info.innerText = `Faces: 12*6^${subdivision} = ${faces.toLocaleString('en-US')}
	  Face area: ~${(earthArea/faces).toLocaleString('en-US', { maximumFractionDigits: 2 })} km^2`;
      // Correcting sphere radius
	  switch(subdivision){
        case '1':
          sphere.geometry = new THREE.SphereGeometry(1.672, 64, 64);
          break;
        case '2':
          sphere.geometry = new THREE.SphereGeometry(1.692, 64, 64);
          break;
        default:
          sphere.geometry = new THREE.SphereGeometry(1.6975, 64, 64);
      }
    });
  	
    // Additional Functions //
    window.addEventListener( 'resize', onWindowResize );
    onWindowResize();

}

// Face creation
function createFace(vertices){

  vertices.push(vertices[0]); // to close geometry
  const material = new THREE.LineBasicMaterial({ color: 0x000 });
  const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
  const face = new THREE.Line(geometry, material);
  return face;

}

function animate() {

    requestAnimationFrame( animate );

    if (params.fixed) {
      	// Apply additional rotation using quaternion multiplication
        sphere.quaternion.copy(camera.quaternion);
        sphere.quaternion.multiplyQuaternions(sphere.quaternion, initialRotation).normalize();
    }

    renderer.render(scene, camera);
  	controls.update();
  
}

function onWindowResize() {

    const aspect = window.innerWidth / window.innerHeight;

    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;

    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );

}