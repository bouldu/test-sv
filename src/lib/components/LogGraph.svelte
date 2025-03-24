<script lang="ts">
	import * as THREE from 'three';
	import { onDestroy, onMount } from 'svelte';
	import { CSS2DObject, CSS2DRenderer, MapControls } from 'three/examples/jsm/Addons.js';
	import type {
		LogEdge,
		LogEdgeUnit,
		LogGraphNode,
		LogNode,
		LogUnit
	} from '$lib/components/LogGraph';
	import type { GUI } from 'dat.gui';
	import { createDagreeGraphLayout } from '$lib/utils/GraphLayout';

	interface Props {
		nodes: LogNode[];
		edges: LogEdge[];
		units: LogUnit[];
		currentDate: Date;
	}

	let { nodes, edges, units, currentDate }: Props = $props();
	let nodeWidth = 100;
	let nodeHeight = 50;

	const { localNodes, localEdges } = $derived.by(() => {
		const layout = createDagreeGraphLayout(nodes, edges, nodeWidth, nodeHeight);
		return {
			localNodes: layout.nodes,
			localEdges: layout.edges
		};
	});

	let nodeById: { [key: string]: LogGraphNode } = $derived.by(() => {
		const result: { [key: string]: LogGraphNode } = {};
		for (const node of localNodes) {
			result[node.id] = node;
		}
		return result;
	});

	$effect(() => {
		if (!localNodes.length) {
			return;
		}
		refresh();
	});

	$effect(() => {
		if (!currentDate) {
			return;
		}
		calculCircles();
	});

	let canvas: HTMLCanvasElement;
	let scene: THREE.Scene;
	let camera: THREE.OrthographicCamera;
	let renderer: THREE.WebGLRenderer;
	let controls: MapControls;
	let labelRenderer: CSS2DRenderer;
	let Gui: GUI;
	let circles: THREE.Mesh[] = [];

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

		for (const node of localNodes) {
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
		if (!localNodes.length) {
			return;
		}

		for (const node of localNodes) {
			const geometry = new THREE.BoxGeometry(nodeWidth, nodeHeight, 0);
			const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
			const rectangle = new THREE.Mesh(geometry, material);

			rectangle.position.set(node.x, node.y, 0);
			rectangle.name = node.id;
			scene.add(rectangle);
			addNodeLabel(rectangle, node.id);
		}

		for (let edge of localEdges) {
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

			const curve = new THREE.CatmullRomCurve3(points, false);
			edge.curve = curve;
		}

		// print draw number of nodes and edges
		console.log('drawGraph', localNodes.length, edges.length);
	}

	let t = 0;
	let speed = 0.002;
	function animate() {
		requestAnimationFrame(animate);
		// controls.update();

		// calculCircles();

		// for (let circle of circles) {
		// 	const unit = circle.userData as LogUnit;
		// 	let edge = findCurrentEdge(unit);
		// 	if (!edge?.curve) {
		// 		continue;
		// 	}

		// 	const curve = edge.curve;
		// 	const currentEdgeUnit = findCurrentEdgeUnit(unit);

		// 	if (!currentEdgeUnit) {
		// 		continue;
		// 	}

		// 	const totalDuration =
		// 		currentEdgeUnit.to.startDate.getTime() - currentEdgeUnit.from.startDate.getTime();
		// 	const elapsedDuration = currentDate.getTime() - currentEdgeUnit.from.startDate.getTime();
		// 	const progress = elapsedDuration / totalDuration;

		// 	if (!isFinite(progress)) {
		// 		continue;
		// 	}
		// 	const position = curve.getPointAt(progress);
		// 	circle.position.copy(position);
		// }
		renderer.render(scene, camera);
		labelRenderer.render(scene, camera);
	}

	function calculCircles() {
		for (let unit of units) {
			let minDate = unit.events[0].startDate;
			let maxDate = unit.events[unit.events.length - 1].startDate;

			let currentCircle = circles.find((circle) => circle.name === unit.id);
			if (minDate > currentDate || maxDate < currentDate) {
				if (currentCircle) {
					scene.remove(currentCircle);
					circles = circles.filter((circle) => circle !== currentCircle);
				}
				continue;
			}

			if (currentCircle) {
				continue;
			}

			currentCircle = new THREE.Mesh(
				new THREE.CircleGeometry(10, 32),
				new THREE.MeshBasicMaterial({ color: 0x0000ff })
			);
			currentCircle.name = unit.id;
			currentCircle.userData = unit;

			const currentEdgeUnit = findCurrentEdgeUnit(unit);
			if (!currentEdgeUnit) {
				continue;
			}

			const edge = localEdges.find(
				(edge) => edge.from === currentEdgeUnit.from.id && edge.to === currentEdgeUnit.to.id
			);

			if (!edge?.curve) {
				continue;
			}

			const curve = edge.curve;

			const totalDuration =
				currentEdgeUnit.to.startDate.getTime() - currentEdgeUnit.from.startDate.getTime();
			const elapsedDuration = currentDate.getTime() - currentEdgeUnit.from.startDate.getTime();
			const progress = elapsedDuration / totalDuration;

			if (!isFinite(progress)) {
				continue;
			}
			const position = curve.getPointAt(progress);
			currentCircle.position.copy(position);

			scene.add(currentCircle);
			circles.push(currentCircle);
		}

		console.log('calculCircles', circles.length);
	}

	function findCurrentEdgeUnit(unit: LogUnit): LogEdgeUnit | undefined {
		for (let i = 0; i < unit.events.length; i++) {
			if (i === unit.events.length - 1) {
				return undefined;
			}
			const unitEvent = unit.events[i];
			const nextUnitEvent = unit.events[i + 1];
			if (unitEvent.startDate < currentDate && nextUnitEvent.startDate > currentDate) {
				return {
					from: unitEvent,
					to: nextUnitEvent
				};
			}
		}
		return undefined;
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
