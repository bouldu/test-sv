import type { LogEdge, LogNode } from '$lib/components/LogGraph';
import type { LogEntry } from '$lib/components/LogUploader';

export function convertLogEntriesToGraph(logs: LogEntry[]): { nodes: LogNode[]; edges: LogEdge[] } {
	const nodesMap: Map<string, LogNode> = new Map();
	const edges: LogEdge[] = [];

	for (let i = 0; i < logs.length; i++) {
		const currentLog = logs[i];
		const currentNodeId = currentLog.eventId;

		if (!currentNodeId) {
			continue;
		}

		if (!nodesMap.has(currentNodeId)) {
			nodesMap.set(currentNodeId, { id: currentNodeId });
		}
		if (i == 0) {
			continue;
		}

		const previousLog = logs[i - 1];
		if (previousLog.unitId !== currentLog.unitId) {
			continue;
		}

		const previousNodeId = previousLog.eventId;
		edges.push({ from: previousNodeId, to: currentNodeId });
	}

	return { nodes: Array.from(nodesMap.values()), edges };
}
