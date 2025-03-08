<script lang="ts">
	import * as THREE from 'three';
	import { onDestroy, onMount } from 'svelte';
	import { CSS2DObject, CSS2DRenderer, MapControls } from 'three/examples/jsm/Addons.js';

	let canvas: HTMLCanvasElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: MapControls;
	let labelRenderer: CSS2DRenderer;

	onMount(() => {
		init();
		animate();
	});

	onDestroy(() => {
		if (labelRenderer && labelRenderer.domElement) {
			document.body.removeChild(labelRenderer.domElement);
		}
	});

	function init() {
		// Scène
		scene = new THREE.Scene();

		// Caméra
		camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.z = 5;

		// Rendu
		renderer = new THREE.WebGLRenderer({ canvas });
		renderer.setSize(window.innerWidth, window.innerHeight - 10);
		renderer.setClearColor(0xffffff);

		// Contrôles de la caméra
		controls = new MapControls(camera, renderer.domElement);
		controls.screenSpacePanning = true;

		labelRenderer = new CSS2DRenderer();
		labelRenderer.setSize(window.innerWidth, window.innerHeight);
		labelRenderer.domElement.style.position = 'absolute';
		labelRenderer.domElement.style.top = '0px';
		labelRenderer.domElement.style.touchAction = 'none';
		labelRenderer.domElement.style.pointerEvents = 'none';

		document.body.appendChild(labelRenderer.domElement);

		// Création des nœuds (sphères)
		const nodes = [
			{ x: -1, y: 1, z: 0, label: 'Create' },
			{ x: 1, y: 1, z: 0, label: 'Received' },
			{ x: 0, y: 0, z: 0, label: 'Delivered' },
			{ x: 1, y: 0, z: 0, label: 'Returned' },
			{ x: -1, y: 0, z: 0, label: 'Cancelled' },
			{ x: 0, y: -1, z: 0, label: 'Refunded' }
		];

		nodes.forEach((node) => {
			const geometry = new THREE.BoxGeometry(0.2, 0.1, 0);
			const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
			const rectangle = new THREE.Mesh(geometry, material);
			rectangle.position.set(node.x, node.y, node.z);
			rectangle.name = `nodeLabel-${rectangle.uuid}`;
			scene.add(rectangle);
			addNodeLabel(rectangle, node.label);
		});

		// Création des arêtes (lignes)
		const edges = [
			{ from: 0, to: 1 },
			{ from: 1, to: 2 },
			{ from: 2, to: 0 },
			{ from: 1, to: 3 },
			{ from: 0, to: 4 },
			{ from: 3, to: 5 }
		];

		edges.forEach((edge) => {
			const startNode = nodes[edge.from];
			const endNode = nodes[edge.to];

			const points = [
				new THREE.Vector3(startNode.x, startNode.y, startNode.z),
				new THREE.Vector3(endNode.x, endNode.y, endNode.z)
			];

			const geometry = new THREE.BufferGeometry().setFromPoints(points);
			const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
			const line = new THREE.Line(geometry, material);
			scene.add(line);
		});

		// Gestion du redimensionnement de la fenêtre
		window.addEventListener('resize', () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		});
	}

	function addNodeLabel(node: THREE.Mesh, text: string) {
		const divLabel = document.createElement('div');
		divLabel.textContent = text;
		divLabel.style.color = 'black';
		divLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Fond semi-transparent
		divLabel.style.padding = '2px';
		divLabel.style.borderRadius = '4px';

		// divLabel.style.fontSize = '12px';
		// divLabel.style.fontFamily = 'Arial';
		// divLabel.id = `nodeLabel-${node.uuid}`;

		const label = new CSS2DObject(divLabel);
		node.add(label);
	}

	function animate() {
		requestAnimationFrame(animate);
		controls.update(); // Mettre à jour les contrôles de la caméra
		renderer.render(scene, camera);
		labelRenderer.render(scene, camera);
	}
</script>

<!-- <div style="position: relative;"> -->
<canvas id="myCanvas" bind:this={canvas}></canvas>

<!-- </div> -->

<style>
	canvas {
		width: 100vw;
		height: 100vh;
	}

	/* #nodeLabels {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	} */
</style>
