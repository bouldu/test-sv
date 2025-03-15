<script lang="ts">
	import * as THREE from 'three';
	import { onDestroy, onMount } from 'svelte';
	import { CSS2DObject, CSS2DRenderer, MapControls } from 'three/examples/jsm/Addons.js';
	import type { LogEdge, LogNode } from '$lib/components/LogGraph';
	import type { GUI } from 'dat.gui';
	import { createDagreeGraphLayout } from '$lib/utils/GraphLayout';

	interface Props {
		nodes: LogNode[];
		edges: LogEdge[];
	}

	let { nodes, edges }: Props = $props();
	let nodeWidth = 100;
	let nodeHeight = 50;

	let nodeById: { [key: string]: LogNode } = $derived.by(() => {
		const result: { [key: string]: LogNode } = {};
		for (const node of nodes) {
			result[node.id] = node;
		}
		return result;
	});

	const doLayout = () => {
		const layout = createDagreeGraphLayout(nodes, edges, nodeWidth, nodeHeight);
		nodes = layout.nodes;
	};

	$effect(() => {
		doLayout();
		refresh();
	});

	let canvas: HTMLCanvasElement;
	let scene: THREE.Scene;
	let camera: THREE.OrthographicCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: MapControls;
	let labelRenderer: CSS2DRenderer;
	let Gui: GUI;

	onMount(() => {
		init();
		refresh();
	});

	function refresh() {
		if (!scene) {
			return;
		}
		scene.clear();
		drawGraph();
		animate();
	}

	onDestroy(() => {
		if (labelRenderer?.domElement) {
			document.body.removeChild(labelRenderer.domElement);
		}
		Gui?.destroy();
	});

	const init = async () => {
		// Scène
		scene = new THREE.Scene();

		// Caméra
		// camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
		let minX = -1000;
		let minY = -1000;
		let maxX = 1000;
		let maxY = 1000;
		camera = new THREE.OrthographicCamera(minX, maxX, maxY, minY, 1, 1000);
		camera.position.set(0, 0, 5);

		// Rendu
		renderer = new THREE.WebGLRenderer({ canvas });
		renderer.setSize(window.innerWidth, window.innerHeight - 10);
		renderer.setClearColor(0xffffff);

		// Contrôles de la caméra
		createControls();

		labelRenderer = new CSS2DRenderer();
		labelRenderer.setSize(window.innerWidth, window.innerHeight);
		labelRenderer.domElement.style.position = 'absolute';
		labelRenderer.domElement.style.top = '0px';
		labelRenderer.domElement.style.touchAction = 'none';
		labelRenderer.domElement.style.pointerEvents = 'none';

		document.body.appendChild(labelRenderer.domElement);

		const dat = await import('dat.gui');
		Gui = new dat.GUI();

		const cameraFolder = Gui.addFolder('Camera');
		cameraFolder.add(camera.position, 'x', -1000, 1000).name('X').listen();
		cameraFolder.add(camera.position, 'y', -1000, 1000).name('Y').listen();
		cameraFolder.add(camera.position, 'z', -1000, 1000).name('Z').listen();
		cameraFolder.add(camera.rotation, 'x', -Math.PI, Math.PI).name('Rotation X').listen();
		cameraFolder.add(camera.rotation, 'y', -Math.PI, Math.PI).name('Rotation Y').listen();
		cameraFolder.add(camera.rotation, 'z', -Math.PI, Math.PI).name('Rotation Z').listen();
		cameraFolder.open();

		// Gestion du redimensionnement de la fenêtre
		window.addEventListener('resize', () => {
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
		});
	};

	function createControls() {
		controls = new MapControls(camera, renderer.domElement);
		controls.screenSpacePanning = true;
		controls.enableRotate = false;
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

	const center = () => {
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;

		for (const node of nodes) {
			minX = Math.min(minX, node.x);
			minY = Math.min(minY, node.y);
			maxX = Math.max(maxX, node.x);
			maxY = Math.max(maxY, node.y);
		}

		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;

		camera.position.set(centerX, centerY, 5);
		controls.target.set(centerX, centerY, 5);
		controls.update();
	};

	function drawGraph() {
		if (!nodes.length) {
			return;
		}

		nodes.forEach((node) => {
			const geometry = new THREE.BoxGeometry(nodeWidth, nodeHeight, 0);
			const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
			const rectangle = new THREE.Mesh(geometry, material);

			rectangle.position.set(node.x, node.y, 0);
			rectangle.name = node.id;
			scene.add(rectangle);
			addNodeLabel(rectangle, node.id);
		});

		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		nodes.forEach((node) => {
			minX = Math.min(minX, node.x);
			minY = Math.min(minY, node.y);
			maxX = Math.max(maxX, node.x);
			maxY = Math.max(maxY, node.y);
		});

		// Ajouter une marge
		const margin = 50;
		minX -= margin;
		minY -= margin;
		maxX += margin;
		maxY += margin;

		console.log('minX', minX, 'minY', minY, 'maxX', maxX, 'maxY', maxY);

		edges.forEach((edge) => {
			const startNode = nodeById[edge.from];
			const endNode = nodeById[edge.to];
			const points = [
				new THREE.Vector3(startNode.x, startNode.y, 0),
				new THREE.Vector3(endNode.x, endNode.y, 0)
			];

			const geometry = new THREE.BufferGeometry().setFromPoints(points);
			const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
			const line = new THREE.Line(geometry, material);
			scene.add(line);
		});
		// print draw number of nodes and edges
		console.log('drawGraph', nodes.length, edges.length);
	}

	function animate() {
		requestAnimationFrame(animate);
		// controls.update();
		renderer.render(scene, camera);
		labelRenderer.render(scene, camera);
	}
</script>

<canvas id="myCanvas" bind:this={canvas}></canvas>
<button id="center-btn" onclick={center}>Center</button>

<style>
	canvas {
		width: 100vw;
		height: 100vh;
	}

	#center-btn {
		position: absolute;
		top: 40px;
		left: 10px;
	}
</style>
