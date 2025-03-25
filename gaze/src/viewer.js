import {
	AmbientLight,
	AnimationMixer,
	AxesHelper,
	Box3,
	Box3Helper,
	Cache,
	Color,
	DirectionalLight,
	GridHelper,
	HemisphereLight,
	LoaderUtils,
	LoadingManager,
	PMREMGenerator,
	PerspectiveCamera,
	PointsMaterial,
	REVISION,
	Scene,
	SkeletonHelper,
	Vector3,
	WebGLRenderer,
	LinearToneMapping,
	ACESFilmicToneMapping,
	BufferGeometry,
	Line,
	LineBasicMaterial,
	Raycaster,
	SphereGeometry,
	MeshBasicMaterial,
	Mesh,
	Sprite,
	SpriteMaterial,
	TextureLoader,
} from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { GUI } from 'dat.gui';

import { environments } from './environments.js';

const DEFAULT_CAMERA = '[default]';

const MANAGER = new LoadingManager();
const THREE_PATH = `https://unpkg.com/three@0.${REVISION}.x`;
const DRACO_LOADER = new DRACOLoader(MANAGER).setDecoderPath(
	`${THREE_PATH}/examples/jsm/libs/draco/gltf/`,
);
const KTX2_LOADER = new KTX2Loader(MANAGER).setTranscoderPath(
	`${THREE_PATH}/examples/jsm/libs/basis/`,
);

const IS_IOS = isIOS();

const Preset = { ASSET_GENERATOR: 'assetgenerator' };

Cache.enabled = true;

export class Viewer {
	constructor(el, options) {
		this.el = el;
		this.options = options;

		this.lights = [];
		this.content = null;
		this.mixer = null;
		this.clips = [];
		this.gui = null;

		this.state = {
			environment:
				options.preset === Preset.ASSET_GENERATOR
					? environments.find((e) => e.id === 'footprint-court').name
					: environments[1].name,
			background: false,
			playbackSpeed: 1.0,
			actionStates: {},
			camera: DEFAULT_CAMERA,
			wireframe: false,
			skeleton: false,
			grid: false,
			autoRotate: false,

			// Lights
			punctualLights: true,
			exposure: 0.0,
			toneMapping: LinearToneMapping,
			ambientIntensity: 0.3,
			ambientColor: '#FFFFFF',
			directIntensity: 0.8 * Math.PI, // TODO(#116)
			directColor: '#FFFFFF',
			bgColor: '#191919',

			pointSize: 1.0,

			// Measurements and Data
			showMeasurements: false,
			showBoundingBox: false,
			showVertexCount: false,
			showModelInfo: false,
			showEdgeMeasurements: false,
			enablePointMeasure: false,
		};

		this.prevTime = 0;

		this.stats = new Stats();
		this.stats.dom.height = '48px';
		[].forEach.call(this.stats.dom.children, (child) => (child.style.display = ''));

		this.backgroundColor = new Color(this.state.bgColor);

		this.scene = new Scene();
		this.scene.background = this.backgroundColor;

		const fov = options.preset === Preset.ASSET_GENERATOR ? (0.8 * 180) / Math.PI : 60;
		const aspect = el.clientWidth / el.clientHeight;
		this.defaultCamera = new PerspectiveCamera(fov, aspect, 0.01, 1000);
		this.activeCamera = this.defaultCamera;
		this.scene.add(this.defaultCamera);

		this.renderer = window.renderer = new WebGLRenderer({ antialias: true });
		this.renderer.setClearColor(0xcccccc);
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(el.clientWidth, el.clientHeight);

		this.pmremGenerator = new PMREMGenerator(this.renderer);
		this.pmremGenerator.compileEquirectangularShader();

		this.neutralEnvironment = this.pmremGenerator.fromScene(new RoomEnvironment()).texture;

		this.controls = new OrbitControls(this.defaultCamera, this.renderer.domElement);
		this.controls.screenSpacePanning = true;

		this.el.appendChild(this.renderer.domElement);

		this.cameraCtrl = null;
		this.cameraFolder = null;
		this.animFolder = null;
		this.animCtrls = [];
		this.morphFolder = null;
		this.morphCtrls = [];
		this.skeletonHelpers = [];
		this.gridHelper = null;
		this.axesHelper = null;

		this.addAxesHelper();
		this.addGUI();
		this.addMeasurementsAndDataControls();
		this.addMeasurementTools(); // Add this line
		if (options.kiosk) this.gui.close();

		this.animate = this.animate.bind(this);
		requestAnimationFrame(this.animate);
		window.addEventListener('resize', this.resize.bind(this), false);
	}

	animate(time) {
		requestAnimationFrame(this.animate);

		const dt = (time - this.prevTime) / 1000;

		this.controls.update();
		this.stats.update();
		this.mixer && this.mixer.update(dt);
		this.render();

		this.prevTime = time;
	}

	render() {
		this.renderer.render(this.scene, this.activeCamera);
		if (this.state.grid) {
			this.axesCamera.position.copy(this.defaultCamera.position);
			this.axesCamera.lookAt(this.axesScene.position);
			this.axesRenderer.render(this.axesScene, this.axesCamera);
		}
	}

	resize() {
		const { clientHeight, clientWidth } = this.el.parentElement;

		this.defaultCamera.aspect = clientWidth / clientHeight;
		this.defaultCamera.updateProjectionMatrix();
		this.renderer.setSize(clientWidth, clientHeight);

		this.axesCamera.aspect = this.axesDiv.clientWidth / this.axesDiv.clientHeight;
		this.axesCamera.updateProjectionMatrix();
		this.axesRenderer.setSize(this.axesDiv.clientWidth, this.axesDiv.clientHeight);
	}

	load(url, rootPath, assetMap) {
		const baseURL = LoaderUtils.extractUrlBase(url);

		// Load.
		return new Promise((resolve, reject) => {
			// Intercept and override relative URLs.
			MANAGER.setURLModifier((url, path) => {
				// URIs in a glTF file may be escaped, or not. Assume that assetMap is
				// from an un-escaped source, and decode all URIs before lookups.
			
				const normalizedURL =
					rootPath +
					decodeURI(url)
						.replace(baseURL, '')
						.replace(/^(\.?\/)/, '');

				if (assetMap.has(normalizedURL)) {
					const blob = assetMap.get(normalizedURL);
					const blobURL = URL.createObjectURL(blob);
					blobURLs.push(blobURL);
					return blobURL;
				}

				return (path || '') + url;
			});

			const loader = new GLTFLoader(MANAGER)
				.setCrossOrigin('anonymous')
				.setDRACOLoader(DRACO_LOADER)
				.setKTX2Loader(KTX2_LOADER.detectSupport(this.renderer))
				.setMeshoptDecoder(MeshoptDecoder);

			const blobURLs = [];

			loader.load(
				url,
				(gltf) => {
					window.VIEWER.json = gltf;

					const scene = gltf.scene || gltf.scenes[0];
					const clips = gltf.animations || [];

					if (!scene) {
						// Valid, but not supported by this viewer.
						throw new Error(
							'This model contains no scene, and cannot be viewed here. However,' +
								' it may contain individual 3D resources.',
						);
					}

					this.setContent(scene, clips);

					blobURLs.forEach(URL.revokeObjectURL);

					// See: https://github.com/google/draco/issues/349
					// DRACOLoader.releaseDecoderModule();

					resolve(gltf);
				},
				undefined,
				reject,
			);
		});
	}

	/**
	 * @param {THREE.Object3D} object
	 * @param {Array<THREE.AnimationClip} clips
	 */
	setContent(object, clips) {
		this.clear();

		object.updateMatrixWorld(); 

		const box = new Box3().setFromObject(object);
		const size = box.getSize(new Vector3()).length();
		const center = box.getCenter(new Vector3());

		this.controls.reset();

		object.position.x -= center.x;
		object.position.y -= center.y;
		object.position.z -= center.z;

		this.controls.maxDistance = size * 10;

		this.defaultCamera.near = size / 100;
		this.defaultCamera.far = size * 100;
		this.defaultCamera.updateProjectionMatrix();

		if (this.options.cameraPosition) {
			this.defaultCamera.position.fromArray(this.options.cameraPosition);
			this.defaultCamera.lookAt(new Vector3());
		} else {
			this.defaultCamera.position.copy(center);
			this.defaultCamera.position.x += size / 2.0;
			this.defaultCamera.position.y += size / 5.0;
			this.defaultCamera.position.z += size / 2.0;
			this.defaultCamera.lookAt(center);
		}

		this.setCamera(DEFAULT_CAMERA);

		this.axesCamera.position.copy(this.defaultCamera.position);
		this.axesCamera.lookAt(this.axesScene.position);
		this.axesCamera.near = size / 100;
		this.axesCamera.far = size * 100;
		this.axesCamera.updateProjectionMatrix();
		this.axesCorner.scale.set(size, size, size);

		this.controls.saveState();

		this.scene.add(object);
		this.content = object;

		this.state.punctualLights = true;

		this.content.traverse((node) => {
			if (node.isLight) {
				this.state.punctualLights = false;
			}
		});

		this.setClips(clips);

		this.updateLights();
		this.updateGUI();
		this.updateEnvironment();
		this.updateDisplay();
		this.updateMeasurementsAndStats(); // Add this line

		window.VIEWER.scene = this.content;

		this.printGraph(this.content);
	}

	printGraph(node) {
		console.group(' <' + node.type + '> ' + node.name);
		node.children.forEach((child) => this.printGraph(child));
		console.groupEnd();
	}

	/**
	 * @param {Array<THREE.AnimationClip} clips
	 */
	setClips(clips) {
		if (this.mixer) {
			this.mixer.stopAllAction();
			this.mixer.uncacheRoot(this.mixer.getRoot());
			this.mixer = null;
		}

		this.clips = clips;
		if (!clips.length) return;

		this.mixer = new AnimationMixer(this.content);
	}

	playAllClips() {
		this.clips.forEach((clip) => {
			this.mixer.clipAction(clip).reset().play();
			this.state.actionStates[clip.name] = true;
		});
	}

	/**
	 * @param {string} name
	 */
	setCamera(name) {
		if (name === DEFAULT_CAMERA) {
			this.controls.enabled = true;
			this.activeCamera = this.defaultCamera;
		} else {
			this.controls.enabled = false;
			this.content.traverse((node) => {
				if (node.isCamera && node.name === name) {
					this.activeCamera = node;
				}
			});
		}
	}

	updateLights() {
		const state = this.state;
		const lights = this.lights;

		if (state.punctualLights && !lights.length) {
			this.addLights();
		} else if (!state.punctualLights && lights.length) {
			this.removeLights();
		}

		this.renderer.toneMapping = Number(state.toneMapping);
		this.renderer.toneMappingExposure = Math.pow(2, state.exposure);

		if (lights.length === 2) {
			lights[0].intensity = state.ambientIntensity;
			lights[0].color.set(state.ambientColor);
			lights[1].intensity = state.directIntensity;
			lights[1].color.set(state.directColor);
		}
	}

	addLights() {
		const state = this.state;

		if (this.options.preset === Preset.ASSET_GENERATOR) {
			const hemiLight = new HemisphereLight();
			hemiLight.name = 'hemi_light';
			this.scene.add(hemiLight);
			this.lights.push(hemiLight);
			return;
		}

		const light1 = new AmbientLight(state.ambientColor, state.ambientIntensity);
		light1.name = 'ambient_light';
		this.defaultCamera.add(light1);

		const light2 = new DirectionalLight(state.directColor, state.directIntensity);
		light2.position.set(0.5, 0, 0.866); // ~60º
		light2.name = 'main_light';
		this.defaultCamera.add(light2);

		this.lights.push(light1, light2);
	}

	removeLights() {
		this.lights.forEach((light) => light.parent.remove(light));
		this.lights.length = 0;
	}

	updateEnvironment() {
		const environment = environments.filter(
			(entry) => entry.name === this.state.environment,
		)[0];

		this.getCubeMapTexture(environment).then(({ envMap }) => {
			this.scene.environment = envMap;
			this.scene.background = this.state.background ? envMap : this.backgroundColor;
		});
	}

	getCubeMapTexture(environment) {
		const { id, path } = environment;

		// neutral (THREE.RoomEnvironment)
		if (id === 'neutral') {
			return Promise.resolve({ envMap: this.neutralEnvironment });
		}

		// none
		if (id === '') {
			return Promise.resolve({ envMap: null });
		}

		return new Promise((resolve, reject) => {
			new EXRLoader().load(
				path,
				(texture) => {
					const envMap = this.pmremGenerator.fromEquirectangular(texture).texture;
					this.pmremGenerator.dispose();

					resolve({ envMap });
				},
				undefined,
				reject,
			);
		});
	}

	updateDisplay() {
		if (this.skeletonHelpers.length) {
			this.skeletonHelpers.forEach((helper) => this.scene.remove(helper));
		}

		traverseMaterials(this.content, (material) => {
			material.wireframe = this.state.wireframe;

			if (material instanceof PointsMaterial) {
				material.size = this.state.pointSize;
			}
		});

		this.content.traverse((node) => {
			if (node.geometry && node.skeleton && this.state.skeleton) {
				const helper = new SkeletonHelper(node.skeleton.bones[0].parent);
				helper.material.linewidth = 3;
				this.scene.add(helper);
				this.skeletonHelpers.push(helper);
			}
		});

		if (this.state.grid !== Boolean(this.gridHelper)) {
			if (this.state.grid) {
				this.gridHelper = new GridHelper();
				this.axesHelper = new AxesHelper();
				this.axesHelper.renderOrder = 999;
				this.axesHelper.onBeforeRender = (renderer) => renderer.clearDepth();
				this.scene.add(this.gridHelper);
				this.scene.add(this.axesHelper);
			} else {
				this.scene.remove(this.gridHelper);
				this.scene.remove(this.axesHelper);
				this.gridHelper = null;
				this.axesHelper = null;
				this.axesRenderer.clear();
			}
		}

		this.controls.autoRotate = this.state.autoRotate;
	}

	updateBackground() {
		this.backgroundColor.set(this.state.bgColor);
	}

	/**
	 * Adds AxesHelper.
	 *
	 * See: https://stackoverflow.com/q/16226693/1314762
	 */
	addAxesHelper() {
		this.axesDiv = document.createElement('div');
		this.el.appendChild(this.axesDiv);
		this.axesDiv.classList.add('axes');

		const { clientWidth, clientHeight } = this.axesDiv;

		this.axesScene = new Scene();
		this.axesCamera = new PerspectiveCamera(50, clientWidth / clientHeight, 0.1, 10);
		this.axesScene.add(this.axesCamera);

		this.axesRenderer = new WebGLRenderer({ alpha: true });
		this.axesRenderer.setPixelRatio(window.devicePixelRatio);
		this.axesRenderer.setSize(this.axesDiv.clientWidth, this.axesDiv.clientHeight);

		this.axesCamera.up = this.defaultCamera.up;

		this.axesCorner = new AxesHelper(5);
		this.axesScene.add(this.axesCorner);
		this.axesDiv.appendChild(this.axesRenderer.domElement);
	}

	addGUI() {
		const gui = (this.gui = new GUI({
			autoPlace: false,
			width: 260,
			hideable: true,
		}));

		// Display controls.
		const dispFolder = gui.addFolder('Display');
		const envBackgroundCtrl = dispFolder.add(this.state, 'background');
		envBackgroundCtrl.onChange(() => this.updateEnvironment());
		const autoRotateCtrl = dispFolder.add(this.state, 'autoRotate');
		autoRotateCtrl.onChange(() => this.updateDisplay());
		const wireframeCtrl = dispFolder.add(this.state, 'wireframe');
		wireframeCtrl.onChange(() => this.updateDisplay());
		const skeletonCtrl = dispFolder.add(this.state, 'skeleton');
		skeletonCtrl.onChange(() => this.updateDisplay());
		const gridCtrl = dispFolder.add(this.state, 'grid');
		gridCtrl.onChange(() => this.updateDisplay());
		dispFolder.add(this.controls, 'screenSpacePanning');
		const pointSizeCtrl = dispFolder.add(this.state, 'pointSize', 1, 16);
		pointSizeCtrl.onChange(() => this.updateDisplay());
		const bgColorCtrl = dispFolder.addColor(this.state, 'bgColor');
		bgColorCtrl.onChange(() => this.updateBackground());

		// Lighting controls.
		const lightFolder = gui.addFolder('Lighting');
		const envMapCtrl = lightFolder.add(
			this.state,
			'environment',
			environments.map((env) => env.name),
		);
		envMapCtrl.onChange(() => this.updateEnvironment());
		[
			lightFolder.add(this.state, 'toneMapping', {
				Linear: LinearToneMapping,
				'ACES Filmic': ACESFilmicToneMapping,
			}),
			lightFolder.add(this.state, 'exposure', -10, 10, 0.01),
			lightFolder.add(this.state, 'punctualLights').listen(),
			lightFolder.add(this.state, 'ambientIntensity', 0, 2),
			lightFolder.addColor(this.state, 'ambientColor'),
			lightFolder.add(this.state, 'directIntensity', 0, 4), // TODO(#116)
			lightFolder.addColor(this.state, 'directColor'),
		].forEach((ctrl) => ctrl.onChange(() => this.updateLights()));

		// Animation controls.
		this.animFolder = gui.addFolder('Animation');
		this.animFolder.domElement.style.display = 'none';
		const playbackSpeedCtrl = this.animFolder.add(this.state, 'playbackSpeed', 0, 1);
		playbackSpeedCtrl.onChange((speed) => {
			if (this.mixer) this.mixer.timeScale = speed;
		});
		this.animFolder.add({ playAll: () => this.playAllClips() }, 'playAll');

		// Morph target controls.
		this.morphFolder = gui.addFolder('Morph Targets');
		this.morphFolder.domElement.style.display = 'none';

		// Camera controls.
		this.cameraFolder = gui.addFolder('Cameras');
		this.cameraFolder.domElement.style.display = 'none';

		// Stats.
		const perfFolder = gui.addFolder('Performance');
		const perfLi = document.createElement('li');
		this.stats.dom.style.position = 'static';
		perfLi.appendChild(this.stats.dom);
		perfLi.classList.add('gui-stats');
		perfFolder.__ul.appendChild(perfLi);

		const guiWrap = document.createElement('div');
		this.el.appendChild(guiWrap);
		guiWrap.classList.add('gui-wrap');
		guiWrap.appendChild(gui.domElement);
		gui.open();
	}

	addMeasurementsAndDataControls() {
		const dataFolder = this.gui.addFolder('Model Data');
		
		// Bounding box control
		const boundingBoxCtrl = dataFolder.add(this.state, 'showBoundingBox')
			.name('Bounding Box');
		boundingBoxCtrl.onChange(() => {
			if (this.state.showBoundingBox) {
				const box = new Box3().setFromObject(this.content);
				// Create bounding box helper
				this.boundingBoxHelper = new Box3Helper(box, 0xffff00);
				this.scene.add(this.boundingBoxHelper);
				
				// Add measurements for each dimension
				const min = box.min;
				const max = box.max;
				
				 // Front face measurements
				this.createBoundingBoxMeasurement(
					new Vector3(min.x, min.y, min.z),
					new Vector3(max.x, min.y, min.z),
					'Width'
				);
				this.createBoundingBoxMeasurement(
					new Vector3(min.x, min.y, min.z),
					new Vector3(min.x, max.y, min.z),
					'Height'
				);
				this.createBoundingBoxMeasurement(
					new Vector3(min.x, min.y, min.z),
					new Vector3(min.x, min.y, max.z),
					'Depth'
				);

				// Back face measurements
				this.createBoundingBoxMeasurement(
					new Vector3(min.x, max.y, max.z),
					new Vector3(max.x, max.y, max.z),
					'Width'
				);
				this.createBoundingBoxMeasurement(
					new Vector3(max.x, min.y, max.z),
					new Vector3(max.x, max.y, max.z),
					'Height'
				);
				this.createBoundingBoxMeasurement(
					new Vector3(max.x, max.y, min.z),
					new Vector3(max.x, max.y, max.z),
					'Depth'
				);
				
			} else {
				this.clearBoundingBoxMeasurements();
			}
		});

		// Model dimensions with units
		const dimensionsFolder = dataFolder.addFolder('Dimensions (meters)');
		this.dimensionsControls = {
			width: dimensionsFolder.add({ value: 0 }, 'value').name('Width (X)').listen(),
			height: dimensionsFolder.add({ value: 0 }, 'value').name('Height (Y)').listen(),
			depth: dimensionsFolder.add({ value: 0 }, 'value').name('Depth (Z)').listen(),
			volume: dimensionsFolder.add({ value: 0 }, 'value').name('Volume (m³)').listen(),
			surfaceArea: dimensionsFolder.add({ value: 0 }, 'value').name('Surface Area (m²)').listen()
		};

		// Model statistics
		const statsFolder = dataFolder.addFolder('Statistics');
		this.modelStats = {
			vertices: statsFolder.add({ value: 0 }, 'value').name('Vertices').listen(),
			triangles: statsFolder.add({ value: 0 }, 'value').name('Triangles').listen(),
			materials: statsFolder.add({ value: 0 }, 'value').name('Materials').listen(),
			objects: statsFolder.add({ value: 0 }, 'value').name('Objects').listen(),
			meshes: statsFolder.add({ value: 0 }, 'value').name('Meshes').listen()
		};
	}

	updateMeasurementsAndStats() {
		if (!this.content) return;

		// Update dimensions
		const box = new Box3().setFromObject(this.content);
		const size = box.getSize(new Vector3());
		
		this.dimensionsControls.width.object.value = size.x.toFixed(3);
		this.dimensionsControls.height.object.value = size.y.toFixed(3);
		this.dimensionsControls.depth.object.value = size.z.toFixed(3);
		
		// Calculate volume (approximate)
		const volume = size.x * size.y * size.z;
		this.dimensionsControls.volume.object.value = volume.toFixed(3);

		// Update statistics
		let vertexCount = 0;
		let triangleCount = 0;
		let meshCount = 0;
		let objectCount = 0;
		const materials = new Set();
		let totalSurfaceArea = 0;

		this.content.traverse((node) => {
			objectCount++;
			
			if (node.isMesh) {
				meshCount++;
				if (node.geometry) {
					const geometry = node.geometry;
					if (geometry.attributes.position) {
						vertexCount += geometry.attributes.position.count;
					}
					if (geometry.index) {
						triangleCount += geometry.index.count / 3;
						// Approximate surface area calculation
						if (geometry.attributes.position && geometry.index) {
							totalSurfaceArea += this.calculateMeshSurfaceArea(geometry);
						}
					}
				}
				if (node.material) {
					if (Array.isArray(node.material)) {
						node.material.forEach(mat => materials.add(mat));
					} else {
						materials.add(node.material);
					}
				}
			}
		});

		this.modelStats.vertices.object.value = vertexCount;
		this.modelStats.triangles.object.value = Math.round(triangleCount);
		this.modelStats.materials.object.value = materials.size;
		this.modelStats.objects.object.value = objectCount;
		this.modelStats.meshes.object.value = meshCount;
		this.dimensionsControls.surfaceArea.object.value = totalSurfaceArea.toFixed(3);
	}

	calculateMeshSurfaceArea(geometry) {
		let area = 0;
		const positions = geometry.attributes.position.array;
		const index = geometry.index.array;
		
		for (let i = 0; i < index.length; i += 3) {
			const a = new Vector3(
				positions[index[i] * 3],
				positions[index[i] * 3 + 1],
				positions[index[i] * 3 + 2]
			);
			const b = new Vector3(
				positions[index[i + 1] * 3],
				positions[index[i + 1] * 3 + 1],
				positions[index[i + 1] * 3 + 2]
			);
			const c = new Vector3(
				positions[index[i + 2] * 3],
				positions[index[i + 2] * 3 + 1],
				positions[index[i + 2] * 3 + 2]
			);
			
			// Calculate triangle area using cross product
			const triangleArea = new Vector3()
				.crossVectors(
					b.sub(a),
					c.sub(a)
				)
				.length() * 0.5;
				
			area += triangleArea;
		}
		
		return area;
	}

	updateGUI() {
		this.cameraFolder.domElement.style.display = 'none';

		this.morphCtrls.forEach((ctrl) => ctrl.remove());
		this.morphCtrls.length = 0;
		this.morphFolder.domElement.style.display = 'none';

		this.animCtrls.forEach((ctrl) => ctrl.remove());
		this.animCtrls.length = 0;
		this.animFolder.domElement.style.display = 'none';

		const cameraNames = [];
		const morphMeshes = [];
		this.content.traverse((node) => {
			if (node.geometry && node.morphTargetInfluences) {
				morphMeshes.push(node);
			}
			if (node.isCamera) {
				node.name = node.name || `VIEWER__camera_${cameraNames.length + 1}`;
				cameraNames.push(node.name);
			}
		});

		if (cameraNames.length) {
			this.cameraFolder.domElement.style.display = '';
			if (this.cameraCtrl) this.cameraCtrl.remove();
			const cameraOptions = [DEFAULT_CAMERA].concat(cameraNames);
			this.cameraCtrl = this.cameraFolder.add(this.state, 'camera', cameraOptions);
			this.cameraCtrl.onChange((name) => this.setCamera(name));
		}

		if (morphMeshes.length) {
			this.morphFolder.domElement.style.display = '';
			morphMeshes.forEach((mesh) => {
				if (mesh.morphTargetInfluences.length) {
					const nameCtrl = this.morphFolder.add(
						{ name: mesh.name || 'Untitled' },
						'name',
					);
					this.morphCtrls.push(nameCtrl);
				}
				for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
					const ctrl = this.morphFolder
						.add(mesh.morphTargetInfluences, i, 0, 1, 0.01)
						.listen();
					Object.keys(mesh.morphTargetDictionary).forEach((key) => {
						if (key && mesh.morphTargetDictionary[key] === i) ctrl.name(key);
					});
					this.morphCtrls.push(ctrl);
				}
			});
		}

		if (this.clips.length) {
			this.animFolder.domElement.style.display = '';
			const actionStates = (this.state.actionStates = {});
			this.clips.forEach((clip, clipIndex) => {
				clip.name = `${clipIndex + 1}. ${clip.name}`;

				// Autoplay the first clip.
				let action;
				if (clipIndex === 0) {
					actionStates[clip.name] = true;
					action = this.mixer.clipAction(clip);
					action.play();
				} else {
					actionStates[clip.name] = false;
				}

				// Play other clips when enabled.
				const ctrl = this.animFolder.add(actionStates, clip.name).listen();
				ctrl.onChange((playAnimation) => {
					action = action || this.mixer.clipAction(clip);
					action.setEffectiveTimeScale(1);
					playAnimation ? action.play() : action.stop();
				});
				this.animCtrls.push(ctrl);
			});
		}
	}

	clear() {
		if (!this.content) return;

		this.scene.remove(this.content);

		// dispose geometry
		this.content.traverse((node) => {
			if (!node.geometry) return;

			node.geometry.dispose();
		});

		// dispose textures
		traverseMaterials(this.content, (material) => {
			for (const key in material) {
				if (key !== 'envMap' && material[key] && material[key].isTexture) {
					material[key].dispose();
				}
			}
		});
	}

	addMeasurementTools() {
		const measureFolder = this.gui.addFolder('Measurements');
		
		// Edge measurements toggle
		measureFolder.add(this.state, 'showEdgeMeasurements')
			.name('Show Edge Measurements')
			.onChange(() => this.toggleEdgeMeasurements());

		// Point-to-point measurement tool
		measureFolder.add(this.state, 'enablePointMeasure')
			.name('Point Measure Tool')
			.onChange(() => this.togglePointMeasurement());

		// Add Clear Measurements button
		measureFolder.add({
			clearMeasurements: () => {
				this.clearEdgeMeasurements();
				this.state.enablePointMeasure = false;
				this.togglePointMeasurement();
			}
		}, 'clearMeasurements').name('Clear Measurements');

		this.measurements = {
			edges: [],
			points: [],
			line: null,
			measuring: false,
			startPoint: null,
			measurementLabels: []
		};

		// Add click listener for point measurements
		this.renderer.domElement.addEventListener('click', (event) => {
			if (!this.state.enablePointMeasure) return;
			this.handleMeasurementClick(event);
		});
	}

	toggleEdgeMeasurements() {
		if (this.state.showEdgeMeasurements) {
			this.showEdgeMeasurements();
		} else {
			this.clearEdgeMeasurements();
		}
	}

	showEdgeMeasurements() {
		this.clearEdgeMeasurements();

		this.content.traverse((node) => {
			if (node.geometry) {
				const edges = this.getSignificantEdges(node.geometry);
				edges.forEach(edge => {
					this.createEdgeMeasurement(edge.start, edge.end);
				});
			}
		});
	}

	getSignificantEdges(geometry) {
		const edges = new Map(); // Use map to track unique edges
		const positions = geometry.attributes.position.array;
		const threshold = this.getBoundingBoxSize() * 0.1; // Dynamic threshold based on model size
		
		// Function to create a unique key for each edge
		const getEdgeKey = (v1, v2) => {
			const p1 = `${v1.x.toFixed(3)},${v1.y.toFixed(3)},${v1.z.toFixed(3)}`;
			const p2 = `${v2.x.toFixed(3)},${v2.y.toFixed(3)},${v2.z.toFixed(3)}`;
			return p1 < p2 ? `${p1}-${p2}` : `${p2}-${p1}`;
		};

		// Get edges from geometry
		for (let i = 0; i < positions.length; i += 9) {
			const vertices = [
				new Vector3(positions[i], positions[i + 1], positions[i + 2]),
				new Vector3(positions[i + 3], positions[i + 4], positions[i + 5]),
				new Vector3(positions[i + 6], positions[i + 7], positions[i + 8])
			];

			// Check each edge of the triangle
			for (let j = 0; j < 3; j++) {
				const v1 = vertices[j];
				const v2 = vertices[(j + 1) % 3];
				const length = v1.distanceTo(v2);

				// Filter edges based on criteria:
				// 1. Length is significant
				// 2. Edge is roughly aligned with major axes
				// 3. Edge is on the outer boundary
				if (length > threshold) {
					const edge = {
						start: v1.clone(),
						end: v2.clone(),
						length: length,
						direction: v2.clone().sub(v1).normalize()
					};

					// Check if edge is aligned with major axes (within 15 degrees)
					const isAligned = edge.direction.toArray().some(component => 
						Math.abs(Math.abs(component) - 1) < 0.26 // cos(15°) ≈ 0.26
					);

					if (isAligned) {
						const key = getEdgeKey(v1, v2);
						if (!edges.has(key) || length > edges.get(key).length) {
							edges.set(key, edge);
						}
					}
				}
			}
		}

		// Convert map to array and filter duplicate edges
		const significantEdges = Array.from(edges.values());

		// Sort by length to get the most significant edges
		significantEdges.sort((a, b) => b.length - a.length);

		// Take only the top N edges or edges above certain length
		const maxEdges = 12; // Adjust this number to show more or fewer edges
		return significantEdges.slice(0, maxEdges);
	}

	// Add this helper method to get model size
	getBoundingBoxSize() {
		const box = new Box3().setFromObject(this.content);
		const size = box.getSize(new Vector3());
		return Math.max(size.x, size.y, size.z);
	}

	handleMeasurementClick(event) {
		const rect = this.renderer.domElement.getBoundingClientRect();
		const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		const raycaster = new Raycaster();
		raycaster.setFromCamera({ x, y }, this.activeCamera);

		const intersects = raycaster.intersectObjects(this.scene.children, true);
		
		if (intersects.length > 0) {
			const point = intersects[0].point;
			
			if (!this.measurements.measuring) {
				// Start measurement
				this.measurements.startPoint = point;
				this.addMeasurementPoint(point);
				this.measurements.measuring = true;
			} else {
				// Complete measurement
				this.addMeasurementPoint(point);
				this.createMeasurementLine(this.measurements.startPoint, point);
				this.measurements.measuring = false;
			}
		}
	}

	addMeasurementPoint(position) {
		const sphereGeometry = new SphereGeometry(0.02, 16, 16);
		const sphereMaterial = new MeshBasicMaterial({ color: 0xff0000 });
		const sphere = new Mesh(sphereGeometry, sphereMaterial);
		
		sphere.position.copy(position);
		this.scene.add(sphere);
		this.measurements.points.push(sphere);
	}

	createMeasurementLine(start, end) {
		const geometry = new BufferGeometry().setFromPoints([start, end]);
		const material = new LineBasicMaterial({ color: 0xff0000 });
		const line = new Line(geometry, material);
		
		this.scene.add(line);
		this.measurements.edges.push(line);

		// Add measurement label
		const distance = start.distanceTo(end).toFixed(2);
		this.createMeasurementLabel(start, end, `${distance}m`);
	}

	createMeasurementLabel(start, end, text) {
		const midPoint = new Vector3().addVectors(start, end).multiplyScalar(0.5);
		
		const canvas = document.createElement('canvas');
		canvas.width = 96;
		canvas.height = 32;
		
		const context = canvas.getContext('2d');
		context.fillStyle = 'rgba(0, 0, 0, 0.8)';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.font = '16px Arial';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillStyle = 'white';
		context.fillText(text, canvas.width/2, canvas.height/2);
		
		const texture = new TextureLoader().load(canvas.toDataURL());
		texture.needsUpdate = true;
		
		const spriteMaterial = new SpriteMaterial({ 
			map: texture,
			sizeAttenuation: true,
			depthTest: false
		});
		
		const sprite = new Sprite(spriteMaterial);
		sprite.position.copy(midPoint);
		
		// Using the same scale factors as bounding box measurements
		const modelSize = this.getBoundingBoxSize();
		const baseScale = modelSize * 0.05;
		
		let scaleFactor;
		if (modelSize < 1) {
			scaleFactor = 2.0;
		} else if (modelSize < 10) {
			scaleFactor = 1.0;
		} else if (modelSize < 100) {
			scaleFactor = 0.5;
		} else {
			scaleFactor = 0.25;
		}
		
		const finalScale = baseScale * scaleFactor;
		sprite.scale.set(finalScale, finalScale/2, 1);
		
		this.scene.add(sprite);
		this.measurements.measurementLabels.push(sprite);
	}

	clearEdgeMeasurements() {
		// Remove all measurements
		this.measurements.edges.forEach(edge => this.scene.remove(edge));
		this.measurements.points.forEach(point => this.scene.remove(point));
		this.measurements.measurementLabels.forEach(label => this.scene.remove(label));
		
		this.measurements.edges = [];
		this.measurements.points = [];
		this.measurements.measurementLabels = [];
		this.measurements.measuring = false;
		this.measurements.startPoint = null;
	}

	createEdgeMeasurement(start, end) {
		// Create line
		const geometry = new BufferGeometry().setFromPoints([start, end]);
		const material = new LineBasicMaterial({ color: 0xff0000 });
		const line = new Line(geometry, material);
		
		this.scene.add(line);
		this.measurements.edges.push(line);

		// Add measurement label
		const distance = start.distanceTo(end).toFixed(2);
		this.createMeasurementLabel(start, end, `${distance}m`);
	}

	// Add this method to the Viewer class
	togglePointMeasurement() {
		if (this.state.enablePointMeasure) {
			// Enable point measurement mode
			this.renderer.domElement.style.cursor = 'crosshair';
		} else {
			// Disable point measurement mode and clear any in-progress measurement
			this.renderer.domElement.style.cursor = 'default';
			if (this.measurements.measuring) {
				// Clear the current measurement points if we're in the middle of measuring
				if (this.measurements.points.length) {
					this.measurements.points.forEach(point => this.scene.remove(point));
					this.measurements.points = [];
				}
				this.measurements.measuring = false;
				this.measurements.startPoint = null;
			}
		}
	}

	createBoundingBoxMeasurement(start, end, dimensionType) {
		// Create line
		const geometry = new BufferGeometry().setFromPoints([start, end]);
		const material = new LineBasicMaterial({ 
			color: 0xff0000,
			linewidth: 2,
			depthTest: false
		});
		const line = new Line(geometry, material);
		
		this.scene.add(line);
		if (!this.boundingBoxMeasurements) {
			this.boundingBoxMeasurements = {
				lines: [],
				labels: []
			};
		}
		this.boundingBoxMeasurements.lines.push(line);

		// Create label with adjusted dimensions
		const distance = start.distanceTo(end).toFixed(2);
		const midPoint = new Vector3().addVectors(start, end).multiplyScalar(0.5);
		
		const canvas = document.createElement('canvas');
		canvas.width = 96;
		canvas.height = 32;
		
		const context = canvas.getContext('2d');
		context.fillStyle = 'rgba(0, 0, 0, 0.8)';
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.font = '16px Arial';
		context.textAlign = 'center';
		context.textBaseline = 'middle';
		context.fillStyle = 'white';
		context.fillText(`${distance}m`, canvas.width/2, canvas.height/2);
		
		const texture = new TextureLoader().load(canvas.toDataURL());
		texture.needsUpdate = true;
		
		const spriteMaterial = new SpriteMaterial({ 
			map: texture,
			sizeAttenuation: true,
			depthTest: false
		});
		
		const sprite = new Sprite(spriteMaterial);
		sprite.position.copy(midPoint);
		
		// Adjusted scale factors for better visibility
		const modelSize = this.getBoundingBoxSize();
		const baseScale = modelSize * 0.05; // Increased from 0.015
		
		// New scale factors for different model sizes
		let scaleFactor;
		if (modelSize < 1) {
			scaleFactor = 2.0;    // Much larger for very small models
		} else if (modelSize < 10) {
			scaleFactor = 1.0;    // Larger for small models
		} else if (modelSize < 100) {
			scaleFactor = 0.5;    // Medium size for regular models
		} else {
			scaleFactor = 0.25;   // Smaller for large models
		}
		
		const finalScale = baseScale * scaleFactor;
		sprite.scale.set(finalScale, finalScale/2, 1);
		
		this.scene.add(sprite);
		this.boundingBoxMeasurements.labels.push(sprite);
	}

	clearBoundingBoxMeasurements() {
		if (this.boundingBoxHelper) {
			this.scene.remove(this.boundingBoxHelper);
			this.boundingBoxHelper = null;
		}
		
		if (this.boundingBoxMeasurements) {
			this.boundingBoxMeasurements.lines.forEach(line => this.scene.remove(line));
			this.boundingBoxMeasurements.labels.forEach(label => this.scene.remove(label));
			this.boundingBoxMeasurements = null;
		}
	}
}

function traverseMaterials(object, callback) {
	object.traverse((node) => {
		if (!node.geometry) return;
		const materials = Array.isArray(node.material) ? node.material : [node.material];
		materials.forEach(callback);
	});
}

// https://stackoverflow.com/a/9039885/1314762
function isIOS() {
	return (
		['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(
			navigator.platform,
		) ||
		// iPad on iOS 13 detection
		(navigator.userAgent.includes('Mac') && 'ontouchend' in document)
	);
}
