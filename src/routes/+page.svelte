<script lang="ts">
	import LogUploader from '$lib/components/LogUploader.svelte';
	import type { LogEntry } from '$lib/components/LogUploader';
	import { convertLogEntriesToGraph } from '$lib/utils/LogUtils';
	import type { LogEdge, LogNode } from '$lib/components/LogGraph';
	import LogGraph from '$lib/components/LogGraph.svelte';

	let nodes: LogNode[] = [];
	let edges: LogEdge[] = [];

	let logs: LogEntry[] = [];
	function handleLogsUploaded(event: CustomEvent<LogEntry[]>) {
		logs = event.detail;
		console.log('Logs structurés :', logs);

		const graph = convertLogEntriesToGraph(logs);
		nodes = graph.nodes;
		edges = graph.edges;
	}
</script>

<LogUploader on:logsUploaded={handleLogsUploaded} />
<LogGraph {nodes} {edges} />
