<script lang="ts">
	import * as THREE from 'three'
	import { onDestroy, onMount } from 'svelte'
	import { CSS2DObject, CSS2DRenderer, MapControls } from 'three/examples/jsm/Addons.js'
	import type {
		LogEdge,
		LogEdgeUnit,
		LogGraphNode,
		LogNode,
		LogUnit
	} from '$lib/components/LogGraph'
	import type { GUI } from 'dat.gui'
	import { createDagreeGraphLayout } from '$lib/utils/GraphLayout'
	import gsap from 'gsap'
	import Stats from 'three/examples/jsm/libs/stats.module.js'
	interface Props {
		nodes: LogNode[]
		edges: LogEdge[]
		units: LogUnit[]
		currentDate: Date
		isPlaying: boolean
	}

	let { nodes, edges, units, currentDate, isPlaying = false }: Props = $props()
	let nodeWidth = 100
	let nodeHeight = 50

	let currentSpeed = 1000 * 60 * 60 * 24

	const { localNodes, localEdges } = $derived.by(() => {
		const layout = createDagreeGraphLayout(nodes, edges, nodeWidth, nodeHeight)
		return {
			localNodes: layout.nodes,
			localEdges: layout.edges
		}
	})

	let nodeById: { [key: string]: LogGraphNode } = $derived.by(() => {
		const result: { [key: string]: LogGraphNode } = {}
		for (const node of localNodes) {
			result[node.id] = node
		}
		return result
	})

	$effect(() => {
		if (!localNodes.length) {
			return
		}
		refresh()
	})

	$effect(() => {
		if (!currentDate) {
			return
		}
		refreshCircles()
	})

	$effect(() => {
		console.log('isPlaying', isPlaying)
		for (let bundle of circleBundles) {
			const anim = bundle.timeline
			if (!isPlaying) {
				anim.pause()
				continue
			}

			if (bundle.visible) {
				anim.play()
			}
		}
	})

	let canvas: HTMLCanvasElement
	let scene: THREE.Scene
	let camera: THREE.OrthographicCamera
	let renderer: THREE.WebGLRenderer
	let controls: MapControls
	let labelRenderer: CSS2DRenderer
	let Gui: GUI
	let stats: Stats
	let circles: THREE.Mesh[] = []
	let circlesMesh: THREE.InstancedMesh

	let circleAnimations: gsap.core.Timeline[] = []

	interface CircleBundle {
		unit: LogUnit
		timeline: gsap.core.Timeline
		index: number
		visible: boolean
	}
	let circleBundles: CircleBundle[] = []

	let raycaster = new THREE.Raycaster()
	let mouse = new THREE.Vector2()
	let selectedCircle: THREE.Mesh | undefined = $state(undefined)

	function onResize() {
		camera.updateProjectionMatrix()
		renderer.setSize(window.innerWidth, window.innerHeight)
		labelRenderer.setSize(window.innerWidth, window.innerHeight)
	}

	function onClick(event: MouseEvent) {
		event.preventDefault()

		mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1
		mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1

		raycaster.setFromCamera(mouse, camera)

		var intersects = raycaster.intersectObjects(scene.children, true)

		if (intersects.length == 0) {
			if (selectedCircle) {
				selectedCircle.material = new THREE.MeshBasicMaterial({ color: 0x0000ff })
				selectedCircle = undefined
			}
			return
		}

		let object = intersects[0].object
		// check if the object is a circle
		if (object.userData?.type === 'circle') {
			selectedCircle = object as THREE.Mesh
			selectedCircle.material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
		}
	}

	onMount(() => {
		init()
		refresh()
	})

	function refresh() {
		if (!scene) {
			return
		}
		scene.clear()
		drawGraph()
		animate()
	}

	onDestroy(() => {
		if (labelRenderer?.domElement) {
			document.body.removeChild(labelRenderer.domElement)
		}
		Gui?.destroy()
		if (stats?.dom) {
			document.body.removeChild(stats.dom)
		}
	})

	const init = async () => {
		// Scène
		scene = new THREE.Scene()
		stats = new Stats()
		document.body.appendChild(stats.dom)

		// Caméra
		// camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
		let minX = -1000
		let minY = -1000
		let maxX = 1000
		let maxY = 1000
		camera = new THREE.OrthographicCamera(minX, maxX, maxY, minY, 1, 1000)
		camera.position.set(0, 0, 5)

		// Rendu
		renderer = new THREE.WebGLRenderer({ canvas })
		renderer.setSize(window.innerWidth, window.innerHeight - 10)
		renderer.setClearColor(0xffffff)

		// Contrôles de la caméra
		createControls()

		labelRenderer = new CSS2DRenderer()
		labelRenderer.setSize(window.innerWidth, window.innerHeight)
		labelRenderer.domElement.style.position = 'absolute'
		labelRenderer.domElement.style.top = '0px'
		labelRenderer.domElement.style.touchAction = 'none'
		labelRenderer.domElement.style.pointerEvents = 'none'

		document.body.appendChild(labelRenderer.domElement)

		const dat = await import('dat.gui')
		Gui?.destroy()
		Gui = new dat.GUI()

		const cameraFolder = Gui.addFolder('Camera')
		cameraFolder.add(camera.position, 'x', -1000, 1000).name('X').listen()
		cameraFolder.add(camera.position, 'y', -1000, 1000).name('Y').listen()
		cameraFolder.add(camera.position, 'z', -1000, 1000).name('Z').listen()
		cameraFolder.add(camera.rotation, 'x', -Math.PI, Math.PI).name('Rotation X').listen()
		cameraFolder.add(camera.rotation, 'y', -Math.PI, Math.PI).name('Rotation Y').listen()
		cameraFolder.add(camera.rotation, 'z', -Math.PI, Math.PI).name('Rotation Z').listen()
		cameraFolder.open()

		// Gestion du redimensionnement de la fenêtre
		window.addEventListener('resize', onResize)

		canvas.addEventListener('click', onClick)
	}

	function createControls() {
		controls = new MapControls(camera, renderer.domElement)
		controls.screenSpacePanning = true
		controls.enableRotate = false
	}

	function addNodeLabel(node: THREE.Mesh, text: string) {
		const divLabel = document.createElement('div')
		divLabel.textContent = text
		divLabel.style.color = 'black'
		divLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)' // Fond semi-transparent
		divLabel.style.padding = '2px'
		divLabel.style.borderRadius = '4px'

		// divLabel.style.fontSize = '12px';
		// divLabel.style.fontFamily = 'Arial';
		// divLabel.id = `nodeLabel-${node.uuid}`;

		const label = new CSS2DObject(divLabel)
		node.add(label)
	}

	const center = () => {
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity

		for (const node of localNodes) {
			minX = Math.min(minX, node.x)
			minY = Math.min(minY, node.y)
			maxX = Math.max(maxX, node.x)
			maxY = Math.max(maxY, node.y)
		}

		const centerX = (minX + maxX) / 2
		const centerY = (minY + maxY) / 2

		camera.position.set(centerX, centerY, 5)
		controls.target.set(centerX, centerY, 5)
		controls.update()
	}

	function drawGraph() {
		if (!localNodes.length) {
			return
		}
		const geometry = new THREE.BoxGeometry(nodeWidth, nodeHeight, 0)
		const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
		for (const node of localNodes) {
			const rectangle = new THREE.Mesh(geometry, material)

			rectangle.position.set(node.x, node.y, 0)
			rectangle.name = node.id
			scene.add(rectangle)
			addNodeLabel(rectangle, node.id)
		}

		// Combine all edges into a single geometry
		const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 })
		const lineGeometry = new THREE.BufferGeometry()
		const lineVertices: number[] = []

		const loopBufferGeometry = new THREE.BufferGeometry()

		for (let edge of localEdges) {
			const startNode = nodeById[edge.from]
			const endNode = nodeById[edge.to]

			if (startNode.id !== endNode.id) {
				lineVertices.push(startNode.x, startNode.y, 0, endNode.x, endNode.y, 0)

				const points = [
					new THREE.Vector3(startNode.x, startNode.y, 0),
					new THREE.Vector3(endNode.x, endNode.y, 0)
				]
				const curve = new THREE.CatmullRomCurve3(points, false)
				edge.curve = curve
			} else {
				// Create a loop below the node
				const loopRadius = 20
				const loopSegments = 32
				const loopGeometry = new THREE.CircleGeometry(loopRadius, loopSegments, 0, Math.PI * 2)
				const loopPositions = loopGeometry.getAttribute('position')
				const loopVertices = []

				for (let i = 0; i < loopPositions.count; i++) {
					loopVertices.push(
						new THREE.Vector3(loopPositions.getX(i), loopPositions.getY(i), loopPositions.getZ(i))
					)
				}
				loopVertices.shift() // Remove the center vertex

				const loop = new THREE.LineLoop(
					loopBufferGeometry.setFromPoints(loopVertices),
					lineMaterial
				)

				loop.position.set(startNode.x, startNode.y - nodeHeight / 2 - loopRadius, 0)
				scene.add(loop)

				// Correctly create the curve for the loop
				edge.curve = new THREE.CatmullRomCurve3(
					loopVertices.map(
						(v) =>
							new THREE.Vector3(
								v.x + startNode.x,
								v.y + startNode.y - nodeHeight / 2 - loopRadius,
								0
							)
					),
					true // Ensure the curve is closed
				)
			}
		}

		lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lineVertices, 3))

		const combinedLine = new THREE.Line(lineGeometry, lineMaterial)
		scene.add(combinedLine)

		createCircles()
	}

	function animate() {
		requestAnimationFrame(animate)
		renderer.render(scene, camera)
		labelRenderer.render(scene, camera)
		stats.update()
	}

	function refreshCircles() {
		for (let circle of circleBundles) {
			const minDate = circle.unit.events[0].startDate
			const maxDate = circle.unit.events[circle.unit.events.length - 1].startDate

			if (minDate > currentDate || maxDate < currentDate) {
				hideCircle(circle.index)
				circle.visible = false
				continue
			}
			circle.visible = true

			let circleTimeline = circle.timeline
			if (!circleTimeline) {
				continue
			}

			// If the animation is already playing, the progress will be updated in the next frame
			if (isPlaying && circleTimeline.paused()) {
				circleTimeline.play()
				continue
			}

			const progress =
				(currentDate.getTime() - minDate.getTime()) / (maxDate.getTime() - minDate.getTime())

			setCirclePosition(circle, progress)
		}
	}

	function findCurrentEdgeUnit(unit: LogUnit): LogEdgeUnit | undefined {
		for (let i = 0; i < unit.events.length; i++) {
			if (i === unit.events.length - 1) {
				return undefined
			}
			const unitEvent = unit.events[i]
			const nextUnitEvent = unit.events[i + 1]
			if (unitEvent.startDate < currentDate && nextUnitEvent.startDate > currentDate) {
				return {
					from: unitEvent,
					to: nextUnitEvent
				}
			}
		}
		return undefined
	}

	function setCirclePosition(circleBundle: CircleBundle, progress: number) {
		const circleIndex = circleBundle.index
		const unit = circleBundle.unit

		// find the edge that contains the current date
		const edgeUnit = findCurrentEdgeUnit(unit)
		if (!edgeUnit) {
			hideCircle(circleIndex)
			return
		}
		const edge = localEdges.find(
			(edge) => edge.from === edgeUnit.from.id && edge.to === edgeUnit.to.id
		)
		if (!edge?.curve) {
			hideCircle(circleIndex)
			return
		}
		const pos = edge.curve.getPointAt(progress)
		const dummy = new THREE.Object3D()
		dummy.position.set(pos.x, pos.y, pos.z)
		dummy.updateMatrix()
		circlesMesh.setMatrixAt(circleIndex, dummy.matrix)
	}

	function hideCircle(circleIndex: number) {
		const dummy = new THREE.Object3D()
		dummy.position.set(9999, 9999, 9999) // Déplacement hors champ
		dummy.updateMatrix()
		circlesMesh.setMatrixAt(circleIndex, dummy.matrix)
		circlesMesh.instanceMatrix.needsUpdate = true
	}

	function createCircles() {
		circles = []
		circleAnimations = []
		circleBundles = []

		const filteredUnits = units.filter((unit) => unit.events.length >= 2)
		const instanceCount = filteredUnits.length

		if (instanceCount === 0) {
			return
		}

		const circleGeometry = new THREE.CircleGeometry(10, 32)
		const circleMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff })

		circlesMesh = new THREE.InstancedMesh(circleGeometry, circleMaterial, instanceCount)
		scene.add(circlesMesh)

		for (let i = 0; i < filteredUnits.length - 1; i++) {
			const unit = filteredUnits[i]

			const timeline = gsap.timeline({
				repeat: 0,
				paused: true,
				onComplete: () => {
					circleBundles[i].visible = false
				}
			})

			const circleBundle = {
				unit,
				timeline,
				index: i,
				visible: true
			}
			circleBundles.push(circleBundle)
			circleAnimations.push(timeline)

			for (let i = 0; i < unit.events.length - 1; i++) {
				let from = unit.events[i]
				let to = unit.events[i + 1]

				const edge = localEdges.find((edge) => edge.from === from.id && edge.to === to.id)
				if (!edge?.curve) {
					continue
				}

				let durationMs = to.startDate.getTime() - from.startDate.getTime()
				let animDuration = durationMs / currentSpeed

				let progress = { t: 0 } // Variable intermédiaire

				timeline.to(progress, {
					duration: animDuration,
					t: 1, // Progression de 0 à 1 sur la courbe
					ease: 'linear',
					onUpdate: () => {
						setCirclePosition(circleBundle, progress.t)
					}
				})
			}
		}
	}
</script>

{#if selectedCircle}
	<div class="circle-pophover">
		<h3>Unit</h3>
		<p>{selectedCircle.userData?.id}</p>
		<h3>Events</h3>
		<ul>
			{#each selectedCircle.userData?.events as event}
				<li>{event.id} - {event.startDate.toLocaleString()}</li>
			{/each}
		</ul>
	</div>
{/if}

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

	.circle-pophover {
		position: absolute;
		top: 150px;
		left: 10px;
		background-color: rgba(0, 0, 0, 0.5);
		padding: 10px;
		border-radius: 5px;
	}
</style>
