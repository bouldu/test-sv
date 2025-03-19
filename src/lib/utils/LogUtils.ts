import type { LogEdge, LogNode, LogUnit } from '$lib/components/LogGraph';
import type { LogEntry } from '$lib/components/LogUploader';

export function convertLogEntriesToGraph(logs: LogEntry[]): {
	nodes: LogNode[];
	edges: LogEdge[];
	units: LogUnit[];
} {
	const nodesMap: Map<string, LogNode> = new Map();
	const edges: LogEdge[] = [];
	const units: LogUnit[] = [];
	let currentUnit: LogUnit = { id: '', events: [] };

	for (let i = 0; i < logs.length; i++) {
		const currentLog = logs[i];
		const currentNodeId = currentLog.eventId;

		if (!currentNodeId) {
			continue;
		}

		const currentNode = { id: currentNodeId, x: 0, y: 0 };
		if (!nodesMap.has(currentNodeId)) {
			nodesMap.set(currentNodeId, currentNode);
		}

		if (currentUnit.id != currentLog.unitId) {
			currentUnit = { id: currentLog.unitId, events: [] };
			units.push(currentUnit);
		}

		currentUnit.events.push({
			...currentNode,
			startDate: currentLog.startDate
		});

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

	return { nodes: Array.from(nodesMap.values()), edges, units };
}
