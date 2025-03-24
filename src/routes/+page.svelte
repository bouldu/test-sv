<script lang="ts">
	import LogUploader from '$lib/components/LogUploader.svelte';
	import type { LogEntry } from '$lib/components/LogUploader';
	import { convertLogEntriesToGraph } from '$lib/utils/LogUtils';
	import type { LogEdge, LogNode, LogUnit } from '$lib/components/LogGraph';
	import LogGraph from '$lib/components/LogGraph.svelte';
	import LogTimeline from '$lib/components/LogTimeline.svelte';

	let nodes: LogNode[] = $state([]);
	let edges: LogEdge[] = $state([]);
	let units: LogUnit[] = $state([]);

	let logs: LogEntry[] = [];

	let minDate = $state(new Date('2025-01-01'));
	let maxDate = $state(new Date('2025-12-31'));

	let currentDate = $state(new Date('2023-01-01'));
	function handleLogsUploaded(event: CustomEvent<LogEntry[]>) {
		logs = event.detail;

		const graph = convertLogEntriesToGraph(logs);
		nodes = graph.nodes;
		edges = graph.edges;
		units = graph.units;
		minDate = graph.minDate;
		maxDate = graph.maxDate;
	}
</script>

<LogUploader on:logsUploaded={handleLogsUploaded} />

<LogGraph {nodes} {edges} {units} {currentDate} />

<div class="timeline-container">
	<LogTimeline bind:currentDate width={600} height={50} {minDate} {maxDate} />
</div>

<style>
	.timeline-container {
		position: fixed;
		left: 50%;
		transform: translateX(-50%);
		bottom: 10px;
	}
</style>
