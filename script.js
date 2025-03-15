import * as THREE from 'three';
//testing testing

// import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import { OBJLoader } from "https://cdn.jsdelivr.net/npm/three@0.155/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "https://cdn.jsdelivr.net/npm/three@0.155/examples/jsm/loaders/MTLLoader.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.155/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.155/examples/jsm/controls/OrbitControls.js";
import { EXRLoader } from 'https://cdn.jsdelivr.net/npm/three@0.155/examples/jsm/loaders/EXRLoader.js';

import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.17/+esm';





function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({antialias: true, canvas});

    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);

    const fov = 75;
    const aspect = 2;

    const near = 0.01;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    camera.position.set(0, 10, 20); 

    class MinMaxGUIHelper {

        constructor( obj, minProp, maxProp, minDif ) {

            this.obj = obj;
            this.minProp = minProp;
            this.maxProp = maxProp;
            this.minDif = minDif;

        }
        get min() {

            return this.obj[ this.minProp ];

        }
        set min( v ) {

            this.obj[ this.minProp ] = v;
            this.obj[ this.maxProp ] = Math.max( this.obj[ this.maxProp ], v + this.minDif );

        }
        get max() {

            return this.obj[ this.maxProp ];

        }
        set max( v ) {

            this.obj[ this.maxProp ] = v;
            this.min = this.min;

        }

    }

    class PickHelper {
        constructor() {
            this.raycaster = new THREE.Raycaster();
            this.pickedObject = null;
            this.pickedObjectSavedColor = 0;
        }
    
        pick(normalizedPosition, scene, camera, time) {
            // Restore the original color if there was a previous picked object
            if (this.pickedObject) {
                if (this.pickedObject.material && this.pickedObject.material.emissive) {
                    this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
                }
                this.pickedObject = undefined;
            }
    
            // Cast a ray through the scene
            this.raycaster.setFromCamera(normalizedPosition, camera);
            const intersectedObjects = this.raycaster.intersectObjects(scene.children, true);
    
            if (intersectedObjects.length) {
                this.pickedObject = intersectedObjects[0].object;

                // ✅ Check if the picked object has an emissive property
                if (this.pickedObject.material && this.pickedObject.material.emissive !== undefined) {
                    this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
                    this.pickedObject.material.emissive.setHex((time * 8) % 2 > 1 ? 0xFFFF00 : 0xFF0000); // Flash effect
                }
            }
        }
    }

    // ✅ Track Mouse Movement & Convert to Normalized Coordinates
    const pickPosition = { x: 0, y: 0 };

    function getCanvasRelativePosition(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * canvas.width / rect.width,
            y: (event.clientY - rect.top) * canvas.height / rect.height,
        };
    }

    function setPickPosition(event) {
        const pos = getCanvasRelativePosition(event);
        pickPosition.x = (pos.x / canvas.width) * 2 - 1;
        pickPosition.y = (pos.y / canvas.height) * -2 + 1; // Flip Y-axis
    }

    function clearPickPosition() {
        pickPosition.x = -100000;
        pickPosition.y = -100000;
    }

    // ✅ Add Mouse Event Listeners
    window.addEventListener('mousemove', setPickPosition);
    window.addEventListener('mouseout', clearPickPosition);
    window.addEventListener('mouseleave', clearPickPosition);

    // ✅ Initialize PickHelper
    const pickHelper = new PickHelper();


    function updateCamera() {
        camera.updateProjectionMatrix();
    }

    const scene = new THREE.Scene();
    const exrLoader = new EXRLoader();
    exrLoader.load(
        'resources/images/empty_play_room_4k.exr',
        (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.colorSpace = THREE.SRGBColorSpace;
            scene.background = texture;
        }
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controls.target.set(0, 1, 0);  
    controls.update();

    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    });

    function updateCamera() {
        camera.updateProjectionMatrix();
    }

    const gui = new GUI();
    gui.add( camera, 'fov', 1, 180 ).onChange( updateCamera );
    const minMaxGUIHelper = new MinMaxGUIHelper( camera, 'near', 'far', 0.1 );
    gui.add( minMaxGUIHelper, 'min', 0.1, 50, 0.1 ).name( 'near' ).onChange( updateCamera );
    gui.add( minMaxGUIHelper, 'max', 0.1, 50, 0.1 ).name( 'far' ).onChange( updateCamera );

    controls.target.set( 0, 5, 0 );
    controls.update();

    scene.background = new THREE.Color( 'black' );
    

    const loadManager = new THREE.LoadingManager();

    const loadingElem = document.querySelector('#loading');
    const progressBarElem = loadingElem.querySelector('.progressbar');  

    loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
        const progress = itemsLoaded / itemsTotal;
        progressBarElem.style.transform = `scaleX(${progress})`;
    };

    loadManager.onLoad = () => {
        loadingElem.style.display = 'none';
    };
    
    //lighting
    const color = 0xFFFFFF;
    const intensity = 3;

    const directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.position.set(-1, 10, 4);
    directionalLight.target.position.set(-5, 0, 0);
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    const ambientLight = new THREE.AmbientLight(color, intensity);
    scene.add(ambientLight);   

    const skyColor = 0xB1E1FF;
    const groundColor = 0xB97A20;
    const hemishpereLight = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(hemishpereLight);

    class ColorGUIHelper {
        constructor(object, prop) {
        this.object = object;
        this.prop = prop;
        }
        get value() {
        return `#${this.object[this.prop].getHexString()}`;
        }
        set value(hexString) {
        this.object[this.prop].set(hexString);
        }
    }

    const fogColor = 0xAAAAAA;
    const fogNear = 10;
    const fogFar = 80;
    scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
    scene.background = new THREE.Color(fogColor);

    class FogGUIHelper {
        constructor(fog, backgroundColor) {
            this.fog = fog;
            this.backgroundColor = backgroundColor;
        }
        get near() {
            return this.fog.near;
        }
        set near(v) {
            this.fog.near = v;
            this.fog.far = Math.max(this.fog.far, v);
        }
        get far() {
            return this.fog.far;
        }
        set far(v) {
            this.fog.far = v;   
            this.fog.near = Math.min(this.fog.near, v);
        }
        get color() {
            return `#${this.fog.color.getHexString()}`;
        }
        set color(hexString) {
            this.fog.color.set(hexString);
            this.backgroundColor.set(hexString);
        }
    }

    const fogGUIHelper = new FogGUIHelper(scene.fog, scene.background);
    const fogFolder = gui.addFolder("Fog Controls");
    fogFolder.add(fogGUIHelper, 'near', 1, 100).listen();
    fogFolder.add(fogGUIHelper, 'far', 10, 200).listen();
    fogFolder.addColor(fogGUIHelper, 'color').name("Fog Color");
    fogFolder.open();

    

    gui.addColor(new ColorGUIHelper(ambientLight, 'color'), 'value').name('color');
    gui.add(ambientLight, 'intensity', 0, 5, 0.01);


    gui.addColor(new ColorGUIHelper(hemishpereLight, 'color'), 'value').name('skyColor');
    gui.addColor(new ColorGUIHelper(hemishpereLight, 'groundColor'), 'value').name('groundColor');
    gui.add(hemishpereLight, 'intensity', 0, 5, 0.01);

    gui.addColor(new ColorGUIHelper(directionalLight, 'color'), 'value').name('color');
    gui.add(directionalLight, 'intensity', 0, 5, 0.01);
    gui.add(directionalLight.target.position, 'x', -10, 10);
    gui.add(directionalLight.target.position, 'z', -10, 10);
    gui.add(directionalLight.target.position, 'y', 0, 10);


    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    const textureLoader = new THREE.TextureLoader();
    const woodTexture = textureLoader.load('resources/images/wood-2045379_640.jpg');
    const aBlockTexture = textureLoader.load('resources/images/a_block.png');
    const bBlockTexture = textureLoader.load('resources/images/b_block.png');
    const cBlockTexture = textureLoader.load('resources/images/c_block.png');
    const dBlockTexture = textureLoader.load('resources/images/d_block.png');
    const eBlockTexture = textureLoader.load('resources/images/e_block.png');
    const fBlockTexture = textureLoader.load('resources/images/f_block.png');


    const cubeMaterials = [
        new THREE.MeshPhongMaterial({ map: aBlockTexture }),
        new THREE.MeshPhongMaterial({ map: bBlockTexture }),
        new THREE.MeshPhongMaterial({ map: cBlockTexture }),
        new THREE.MeshPhongMaterial({ map: dBlockTexture }),
        new THREE.MeshPhongMaterial({ map: eBlockTexture }),
        new THREE.MeshPhongMaterial({ map: fBlockTexture })
    ];


    const cubeSize = 3;
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    function createBlock(x, y, z, rotationY) {
        const cube = new THREE.Mesh(cubeGeo, cubeMaterials);
        cube.position.set(x, y, z);
        cube.rotation.y = rotationY;
        scene.add(cube);
    }
    createBlock(-16, cubeSize / 2, 0, Math.PI / 4);
    createBlock(-14, cubeSize / 2, -3, Math.PI / 2);
    createBlock(-12, cubeSize / 2, 3, -Math.PI / 2);
    createBlock(-18, cubeSize / 2, 3, Math.PI);
    createBlock(-20, cubeSize / 2, -2, Math.PI / 6);
    createBlock(-22, cubeSize / 2, 1, -Math.PI / 4);

    woodTexture.wrapS = THREE.RepeatWrapping;
    woodTexture.wrapT = THREE.RepeatWrapping;
    woodTexture.repeat.set(2, 2);

    const tableMat = new THREE.MeshPhongMaterial({
        map: woodTexture,
    });


    const tableWidth = 50;
    const tableDepth = 40;
    const tableHeight = 1;

    const tableGeo = new THREE.BoxGeometry(tableWidth, tableHeight, tableDepth);
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, -0.5, 0);
    scene.add(table);



    const mtlLoader = new MTLLoader();
    mtlLoader.load('/asg5/resources/models/basketball.mtl', (mtl) => {
        mtl.preload();
        console.log("✅ MTL Loaded:", mtl);

        //  Load OBJ
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load('/asg5/resources/models/basketball.obj', (basketball) => {
            basketball.scale.set(3, 3, 3);
            basketball.position.set(0, 1, 0);

            // apply materails and textures
            basketball.traverse((child) => {
                if (child.isMesh) {
                    console.log(" Applying material to:", child.name);
                    console.log("Material found:", child.material);
            
                    //  Force wireframe mode to check the entire structure
                    child.material.wireframe = true;
                    child.material.side = THREE.DoubleSide;
            
                    // If no texture, apply a default color
                    if (!child.material.map) {
                        console.warn(` No texture found for: ${child.name}`);
                        child.material = new THREE.MeshBasicMaterial({ 
                            color: 0xff6600, 
                            side: THREE.DoubleSide,  
                            wireframe: false 
                        });
                    }
                }
            });

            scene.add(basketball);
            console.log("Basketball Model Loaded:", basketball);
            controls.target.copy(basketball.position);
            controls.update();
        }, undefined, (error) => {
            console.error("Error loading basketball model:", error);
        });
    });

    const gltfLoader = new GLTFLoader();
    gltfLoader.load('resources/models/doctor_strange.glb', (gltf) => {
        const model = gltf.scene;

        model.scale.set(4.5, 4.5, 4.5);
        model.position.set(10, 0, 15);
        model.rotation.set(0, Math.PI, 0);

        scene.add(model);
        console.log("Doctor Strange Loaded!");
    }, undefined, (error) => {
        console.error("Error loading Strange  GLB:", error);
    });

    gltfLoader.load('resources/models/spiderman.glb', (gltf) => {
        const model = gltf.scene;

        model.scale.set(0.04, 0.04, 0.04);
        model.position.set(17, 0, 15);
        model.rotation.set(0, Math.PI, 0);

        scene.add(model);
        console.log("spiderman Loaded!");
    }, undefined, (error) => {
        console.error("Error loading spiderman  GLB:", error);
    });

    gltfLoader.load('resources/models/banner.glb', (gltf) => {
        const model = gltf.scene;

        model.scale.set(0.045, 0.045, 0.045);
        model.position.set(4, 0, 15);
        model.rotation.set(0, Math.PI, 0);

        scene.add(model);
        console.log("banner Loaded!");
    }, undefined, (error) => {
        console.error("Error loading banner  GLB:", error);
    });


    gltfLoader.load('resources/models/thor.glb', (gltf) => {
        const model = gltf.scene;

        model.scale.set(3, 3, 3);
        model.position.set(-2, 0, 15);
        model.rotation.set(0, Math.PI, 0);

        scene.add(model);
        console.log("thor Loaded!");
    }, undefined, (error) => {
        console.error("Error loading thor  GLB:", error);
    });


    gltfLoader.load('resources/models/rick.glb', (gltf) => {
        const model = gltf.scene;

        model.scale.set(4, 4, 4);
        model.position.set(16, 0, 0);
        model.rotation.set(0, -45, 0);

        scene.add(model);
        console.log("rick Loaded!");
    }, undefined, (error) => {
        console.error("Error loading rick  GLB:", error);
    });

    // rhmobuses
    const rhombusArray = [];

    function createRhombus(x, y, z) {
        const vertices = new Float32Array([
            0, 2, 0,
            -1, 0, -1,
            1, 0, -1,
            1, 0, 1,
            -1, 0, 1,
            0, -2, 0
        ]);

        const indices = [
            0, 1, 2,
            0, 2, 3,
            0, 3, 4,
            0, 4, 1,

            5, 2, 1,
            5, 3, 2,
            5, 4, 3,
            5, 1, 4
        ];

        const geometry = new THREE.BufferGeometry();
        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhongMaterial({ 
            color: 0x00ff99, 
            shininess: 100, 
            emissive: 0x001100, 
            side: THREE.DoubleSide 
        });

        const rhombus = new THREE.Mesh(geometry, material);
        rhombus.position.set(x, y, z);
        rhombus.rotation.y = Math.random() * Math.PI * 2; // random start rotation

        scene.add(rhombus);
        rhombusArray.push(rhombus);
    }


    for (let i = 0; i < 10; i++) {
        createRhombus(
            Math.random() * 30 - 15,
            Math.random() * 10 + 10, 
            Math.random() * 30 - 15 
        );
    }

    const pyramidArray = []; // Store all pyramids

    function createPyramid(x, y, z) {
        const vertices = new Float32Array([
            0, 2, 0,
            -1, 0, -1,
            1, 0, -1,
            1, 0, 1, 
            -1, 0, 1
        ]);

        const indices = [
            0, 1, 2,
            0, 2, 3,
            0, 3, 4,
            0, 4, 1,
            1, 2, 3,
            1, 3, 4
        ];

        const geometry = new THREE.BufferGeometry();
        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.computeVertexNormals(); 

        const material = new THREE.MeshPhongMaterial({ 
            color: 0xff6600,
            shininess: 80, 
            emissive: 0x330000, 
            side: THREE.DoubleSide 
        });

        const pyramid = new THREE.Mesh(geometry, material);
        pyramid.position.set(x, y, z);
        scene.add(pyramid);
        pyramidArray.push(pyramid);
    }


    const numPyramids = 10;
    const minX = -20, maxX = 20;
    const minZ = -20, maxZ = 20;

    for (let i = 0; i < numPyramids; i++) {
        const x = Math.random() * (maxX - minX) + minX;
        const z = Math.random() * (maxZ - minZ) + minZ;
        createPyramid(x, 0, z);
    }

    // render to texture cube
    const rtWidth = 512;
    const rtHeight = 512;
    const rtRenderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight);

    const rtFov = 75;
    const rtAspect = rtWidth / rtHeight;
    const rtNear = 0.1;
    const rtFar = 5;
    const rtCamera = new THREE.PerspectiveCamera(rtFov, rtAspect, rtNear, rtFar);
    rtCamera.position.z = 2;

    const rtScene = new THREE.Scene();
    rtScene.background = new THREE.Color('cyan');

    const rtLight = new THREE.DirectionalLight(0xFFFFFF, 3);
    rtLight.position.set(-1, 2, 4);
    rtScene.add(rtLight);

    function createRTCube(geometry, color, x) {
        const material = new THREE.MeshPhongMaterial({ color });
        const cube = new THREE.Mesh(geometry, material);
        rtScene.add(cube);
        cube.position.x = x;
        return cube;
    }

    const rtGeometry = new THREE.BoxGeometry(1, 1, 1);
    const rtCubes = [
        createRTCube(rtGeometry, 0x44aa88, 0),
        createRTCube(rtGeometry, 0x8844aa, -2),
        createRTCube(rtGeometry, 0xaa8844, 2),
    ];

    const rtMaterial = new THREE.MeshPhongMaterial({ map: rtRenderTarget.texture });
    const rtCube = new THREE.Mesh(rtGeometry, rtMaterial);
    rtCube.scale.set(3,3,3);
    rtCube.position.set(5, 10, 0);
    scene.add(rtCube);
    




    function render(time) {
        time *= 0.001;  // convert time to seconds

        rtCubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * 0.1;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });

        renderer.setRenderTarget(rtRenderTarget);
        renderer.render(rtScene, rtCamera);
        renderer.setRenderTarget(null);

        rtCube.rotation.x = time;
        rtCube.rotation.y = time * 1.1;

        rhombusArray.forEach((rhombus, i) => {
            rhombus.rotation.y += 0.02; // Spin slowly
            rhombus.position.y += Math.sin(time + i) * 0.02; // Floating effect
        });

    
        // cube.rotation.x = time;
        // cube.rotation.y = time;

        pickHelper.pick(pickPosition, scene, camera, time);
        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);


}





main();
