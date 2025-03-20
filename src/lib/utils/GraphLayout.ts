import type { LogEdge, LogGraphEdge, LogGraphNode, LogNode } from '$lib/components/LogGraph';
import Dagre from '@dagrejs/dagre';

export function createDagreeGraphLayout(
	nodes: LogNode[],
	edges: LogEdge[],
	nodeWidth: number,
	nodeHeight: number
): { nodes: LogGraphNode[]; edges: LogGraphEdge[] } {
	const g = new Dagre.graphlib.Graph();
	g.setDefaultEdgeLabel(() => ({}));
	g.setGraph({});

	for (const node of nodes) {
		g.setNode(node.id, { label: node.id, width: nodeWidth, height: nodeHeight });
	}

	for (const edge of edges) {
		g.setEdge(edge.from, edge.to);
	}

	Dagre.layout(g);

	const newNodes: LogGraphNode[] = [];
	for (const node of nodes) {
		const dagreNode = g.node(node.id);
		if (!dagreNode) {
			continue;
		}
		newNodes.push({ ...node, x: dagreNode.x, y: dagreNode.y });
	}

	const newEdges: LogGraphEdge[] = [];
	for (const edge of edges) {
		const dagreEdge = g.edge(edge.from, edge.to);
		if (!dagreEdge) {
			continue;
		}
		newEdges.push({ ...edge });
	}

	return {
		nodes: newNodes,
		edges: newEdges
	};
}
