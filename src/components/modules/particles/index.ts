import { gsap, Power3 } from "gsap";
import * as THREE from "three";
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";

class Particle {
	params: {
		guiMaxDesity: number;
		density: number;
		size: number;
		gradientStartColor: string;
		gradientEndColor: string;
		amplitude: number;
	};
	imageSize: number;
	scene: THREE.Scene;
	renderer: THREE.WebGLRenderer;

	baseVertices: any;
	diffuseVertices: any;

	particleTimeline: any;
	progress: number;

	svgs: HTMLElement[];
	currentSvg: any;

	material: THREE.ShaderMaterial;
	geometry: THREE.BufferGeometry;

	particle: THREE.Points;

	gui: any;

	constructor({ scene, renderer }, svgs, initialSvg) {
		this.params = {
			guiMaxDesity: 5,
			density: 5,
			size: 10,
			gradientStartColor: "#ffffff",
			gradientEndColor: "#ffffff",
			amplitude: 0, //ゆらゆら
		};
		this.imageSize = 2.8;
		this.scene = scene;
		this.renderer = renderer;

		this.baseVertices = [];
		this.diffuseVertices = [];

		this.particleTimeline = gsap.timeline();
		this.progress = 0;

		this.svgs = svgs;
		this.currentSvg = initialSvg;

		this.material = new THREE.ShaderMaterial({
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			uniforms: {
				uSize: {
					value: this.params.size * this.renderer.getPixelRatio(),
				},
				uTime: {
					value: 0,
				},
				uAmp: {
					value: this.params.amplitude,
				},
			},
            transparent: true,
            depthTest: false
		});

		this.geometry = new THREE.BufferGeometry();
		this.particle = new THREE.Points(this.geometry, this.material);
		this.scene.add(this.particle);
		this.particle.scale.set(this.imageSize, this.imageSize, this.imageSize);

		this.#updateGeometry();

		this.#initGui();

		this.particleTimeline.progress(1).pause();
	}

	startAnimation() {
		this.particleTimeline.restart();
		this.progress = this.particleTimeline.progress();

		this.particle.scale.set(this.imageSize, this.imageSize, this.imageSize);
		this.particle.rotation.y = Math.PI;
	}

	update() {
		this.progress = this.particleTimeline.progress();

		// @ts-ignore
		this.particle.material.uniforms.uTime.value += 0.03;

		this.geometry.setFromPoints(this.diffuseVertices);

		let scale = (this.imageSize + 1) * (1 - this.progress) + this.imageSize;
		this.particle.scale.x += (scale - this.particle.scale.x) * 0.2;
		this.particle.scale.y = this.particle.scale.z = this.particle.scale.x;

		let _progress = this.progress * 1.5;
		_progress = Math.min(1, _progress);
		let ry = (1 - _progress) * Math.PI;
		this.particle.rotation.y += (ry - this.particle.rotation.y) * 0.05;
	}

	#updateGeometry() {
        this.baseVertices = [];
        this.diffuseVertices = [];
        this.geometry.dispose();
        this.geometry = new THREE.BufferGeometry();
		const pathPoints = [];

		this.currentSvg.querySelectorAll("path").forEach((path) => {
			for (
				let offset = 0;
				offset < path.getTotalLength(); // path要素の全長を取得
				offset += 1 / this.params.density // もし密度densityが2だったらoffsetは、[0, 0.5, 1, 1.5, 2,・・・]
			) {
				const point = path.getPointAtLength(offset); // path要素に沿ったポイントのxy座標を取得
				pathPoints.push(point);
			}
		});

		const viewBox = this.currentSvg.viewBox.baseVal;

		pathPoints.forEach((pathPoint) => {

			// 矩形の中心を原点とする座標に計算し直す
			const basePosition = new THREE.Vector3(
				pathPoint.x - viewBox.width / 2,
				-pathPoint.y + viewBox.height / 2,
				0
			);

			const diffusion = 250;
			const diffusePosition = new THREE.Vector3(
				basePosition.x + (Math.random() - 0.5) * diffusion,
				basePosition.y + (Math.random() - 0.5) * diffusion,
				basePosition.z + (Math.random() - 0.5) * diffusion
			);

			const delay = (basePosition.x + viewBox.width / 2) / viewBox.width;
			this.particleTimeline.to(
				diffusePosition,
				{
					x: basePosition.x,
					y: basePosition.y,
					z: basePosition.z,
					ease: Power3.easeOut,
					duration: 0.6,
				},
				delay * 0.7
			);

            this.baseVertices.push(basePosition);
            this.diffuseVertices.push(diffusePosition);
		});

        this.#updateColor();
        this.particle.geometry = this.geometry;
	}

	#updateColor() {
		const colors = new Float32Array(this.baseVertices.length * 3);
		const viewBox = this.currentSvg.viewBox.baseVal;

		this.baseVertices.forEach((baseVertex: any, i: number) => {
			const i3 = i * 3;

			/*
                ratio
                X成分だけを抽出する。
                矩形の中心を基準とする座標になっているので、左端原点に計算しなおし、頂点のx座標を出す。
                viewBoxの横幅に対する頂点のx座標の割合を計算する。
            */
			const ratio = (baseVertex.x + viewBox.width / 2) / viewBox.width;

			const gradientStartColor = new THREE.Color(this.params.gradientStartColor);
			const gradientEndColor = new THREE.Color(this.params.gradientEndColor);

			const mixedColor = gradientStartColor.lerp(gradientEndColor, ratio); // 2点間の線形補間
			colors[i3] = mixedColor.r;
			colors[i3 + 1] = mixedColor.g;
			colors[i3 + 2] = mixedColor.b;
		});

		this.geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
	}

	#initGui() {
		// @ts-ignore
		this.gui = new GUI();

		const playFolder = this.gui.addFolder("Play");
		playFolder.open();

		const controlsFolder = this.gui.addFolder("Controls");
		controlsFolder.close();

		playFolder.add(this, "startAnimation").name("Animation Play");

		controlsFolder
			.add(this, "progress", 0, 1, 0.001)
			.name("progress")
			.listen()
			.onChange((value) => {
				this.particleTimeline.progress(value).pause();
			});

		controlsFolder
			.addColor(this.params, "gradientStartColor")
			.name("color 1")
			.listen()
			.onFinishChange(() => {
				this.#updateColor();
			});

		controlsFolder
			.addColor(this.params, "gradientEndColor")
			.name("color 2")
			.listen()
			.onFinishChange(() => {
				this.#updateColor();
			});

		controlsFolder
			.add(this.params, "density", 1, this.params.guiMaxDesity, 1)
			.name("粒子の密度")
			.listen()
			.onFinishChange(() => {
                this.#updateGeometry();
                this.particleTimeline.restart();
                this.particleTimeline.progress(this.progress).pause();
			});

		controlsFolder
			.add(this.params, "size", 1, 30, 1)
			.name("粒子の大きさ")
			.listen()
			.onChange((value) => {
                // @ts-ignore
                this.particle.material.uniforms.uSize.value = value * this.renderer.getPixelRatio();
			});

		controlsFolder
			.add(this.params, "amplitude", 0, 1, 0.1)
			.name("ゆらゆら〜")
			.listen()
			.onChange((value) => {
                // @ts-ignore
                this.particle.material.uniforms.uAmp.value = value;
			});
	}
}

export default Particle;
