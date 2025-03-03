<script lang="ts">
	import * as THREE from 'three';
	import { onMount } from 'svelte';
	import { MapControls } from 'three/examples/jsm/Addons.js';

	let canvas: HTMLCanvasElement;
	let scene: THREE.Scene;
	let camera: THREE.PerspectiveCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: MapControls;

	onMount(() => {
		init();
		animate();
	});

	function init() {
		// Scène
		scene = new THREE.Scene();

		// Caméra
		camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		camera.position.z = 5;

		// Rendu
		renderer = new THREE.WebGLRenderer({ canvas });
		renderer.setSize(window.innerWidth, window.innerHeight - 10);
		renderer.setClearColor(0xffffff);

		// Contrôles de la caméra
		controls = new MapControls(camera, renderer.domElement);
		controls.screenSpacePanning = true;

		// Création des nœuds (sphères)
		const nodes = [
			{ x: -1, y: 1, z: 0 },
			{ x: 1, y: 1, z: 0 },
			{ x: 0, y: -1, z: 0 }
		];

		nodes.forEach((node) => {
			const geometry = new THREE.BoxGeometry(0.2, 0.1, 0);
			const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
			const rectangle = new THREE.Mesh(geometry, material);
			rectangle.position.set(node.x, node.y, node.z);
			rectangle.name = `nodeLabel-${rectangle.uuid}`;
			scene.add(rectangle);
			addNodeLabel(rectangle, `(${node.x}, ${node.y}, ${node.z})`);
		});

		// Création des arêtes (lignes)
		const edges = [
			{ from: 0, to: 1 },
			{ from: 1, to: 2 },
			{ from: 2, to: 0 }
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
		const nodeLabel = document.createElement('div');
		nodeLabel.textContent = text;
		nodeLabel.style.position = 'absolute';
		nodeLabel.style.color = 'black';
		nodeLabel.style.fontSize = '12px';
		nodeLabel.style.fontFamily = 'Arial';
		nodeLabel.id = `nodeLabel-${node.uuid}`;

		// Convertir les coordonnées 3D en coordonnées 2D
		const vector = node.position.clone().project(camera);
		const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
		const y = -(vector.y * 0.5 - 0.5) * renderer.domElement.clientHeight;

		nodeLabel.style.left = `${x}px`;
		nodeLabel.style.top = `${y}px`;
		document.getElementById('nodeLabels')?.appendChild(nodeLabel);
	}

	function updateNodeLabels() {
		const nodeLabels = document.querySelectorAll('#nodeLabels div');
		for (const nodeLabel of nodeLabels) {
			const nodeId = nodeLabel.id;
			const node = scene.getObjectByName(nodeId);

			if (!node) {
				return;
			}

			const vector = node.position.clone().project(camera);
			const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
			const y = -(vector.y * 0.5 - 0.5) * renderer.domElement.clientHeight;

			nodeLabel.style.left = `${x}px`;
			nodeLabel.style.top = `${y}px`;
		}
	}

	function animate() {
		requestAnimationFrame(animate);
		controls.update(); // Mettre à jour les contrôles de la caméra
		renderer.render(scene, camera);
		updateNodeLabels();
	}
</script>

<div style="position: relative;">
	<canvas id="myCanvas" bind:this={canvas}></canvas>
	<div id="nodeLabels"></div>
</div>

<style>
	canvas {
		width: 100vw;
		height: 100vh;
	}

	#nodeLabels {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}
</style>
