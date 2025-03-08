<script lang="ts">
	import * as THREE from 'three';
	import { onDestroy, onMount } from 'svelte';
	import { CSS2DObject, CSS2DRenderer, MapControls } from 'three/examples/jsm/Addons.js';
	import LogUploader from '$lib/components/LogUploader.svelte';
	import type { LogEntry } from '$lib/components/LogUploader';
	import { convertLogEntriesToGraph } from '$lib/utils/LogUtils';
	import { createDagreeGraphLayout } from '$lib/utils/GraphLayout';
	import type { LogEdge, LogNode } from '$lib/components/LogGraph';

	let canvas: HTMLCanvasElement;
	let scene: THREE.Scene;
	let camera: THREE.OrthographicCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: MapControls;
	let labelRenderer: CSS2DRenderer;

	let nodeWidth = 100;
	let nodeHeight = 50;
	let nodes: LogNode[] = [];
	let edges: LogEdge[] = [];

	let nodeById: { [key: string]: LogNode } = $derived.by(() => {
		const result: { [key: string]: LogNode } = {};
		for (const node of nodes) {
			result[node.id] = node;
		}
		return result;
	});

	onMount(() => {
		init();
		drawGraph();
		animate();
	});

	onDestroy(() => {
		if (labelRenderer?.domElement) {
			document.body.removeChild(labelRenderer.domElement);
		}
	});

	function init() {
		// Scène
		scene = new THREE.Scene();

		// Caméra
		// camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
		let minX = -1000;
		let minY = -1000;
		let maxX = 1000;
		let maxY = 1000;
		camera = new THREE.OrthographicCamera(minX, maxX, maxY, minY, 1, 1000);
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

		// Gestion du redimensionnement de la fenêtre
		window.addEventListener('resize', () => {
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
		controls.update();
		renderer.render(scene, camera);
		labelRenderer.render(scene, camera);
	}

	let logs: LogEntry[] = [];
	function handleLogsUploaded(event: CustomEvent<LogEntry[]>) {
		logs = event.detail;
		console.log('Logs structurés :', logs);

		const graph = convertLogEntriesToGraph(logs);

		const graphLayout = createDagreeGraphLayout(graph.nodes, graph.edges, nodeWidth, nodeHeight);

		nodes = graphLayout.nodes;
		edges = graphLayout.edges;

		drawGraph();
		animate();
	}
</script>

<!-- <div style="position: relative;"> -->
<LogUploader on:logsUploaded={handleLogsUploaded} />
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
