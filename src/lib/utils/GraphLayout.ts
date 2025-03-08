import type { LogEdge, LogNode } from '$lib/components/LogGraph';
import Dagre from '@dagrejs/dagre';

export function createDagreeGraphLayout(
	nodes: LogNode[],
	edges: LogEdge[],
	nodeWidth: number,
	nodeHeight: number
): { nodes: LogNode[]; edges: LogEdge[] } {
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

	for (const node of nodes) {
		const dagreNode = g.node(node.id);
		node.x = dagreNode.x;
		node.y = dagreNode.y;
	}

	return { nodes, edges };
}
