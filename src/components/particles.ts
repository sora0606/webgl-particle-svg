import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Particle from "./modules/particles";

export default () => {
	let camera, scene, renderer, controls, particle;

	return {
		init() {
			console.log("start Particle");

			this.setup();
		},

		setup(){
			const width = window.innerWidth;
			const height = window.innerHeight;

			camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 5000);
			camera.position.z = 380;

			scene = new THREE.Scene();

			renderer = new THREE.WebGLRenderer({
				antialias: true,
				alpha: true
			});

			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
			renderer.setSize(width, height);
			renderer.setAnimationLoop(this.animate);
			document.body.appendChild(renderer.domElement);

			controls = new OrbitControls(camera, renderer.domElement);
			controls.enableDamping = true;

			const requireSvgs = document.querySelectorAll("svg[data-required]");
			const optionalSvgs = document.querySelectorAll("svg:not([data-required])");
			const selectableSvgs = [
				...Array.from(requireSvgs),
				...this.shuffle(Array.from(optionalSvgs)).slice(0, 3)
			];

			const svgs = {};
			for (const svg of selectableSvgs) {
				svgs[svg.dataset.id] = svg;
			}

			particle = new Particle({scene, renderer}, svgs, selectableSvgs[0]);
		},



		shuffle(array) {
			return array
				.map((a) => ({ rand: Math.random(), value: a }))
				.sort((a, b) => a.rand - b.rand)
				.map((a) => a.value);
		},

		onWindowResize() {
			const width = window.innerWidth;
			const height = window.innerHeight;

			camera.aspect = width / height;
			camera.updateProjectionMatrix();

			renderer.setSize(width, height);
		},

		animate(){
			controls.update();
			renderer.render(scene, camera);

			particle.update();
		},
	};
};
