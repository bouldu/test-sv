export interface LogNode {
	id: string;
}

export interface LogEdge {
	from: string;
	to: string;
}

export interface LogEvent extends LogNode {
	startDate: Date;
}

export interface LogUnit {
	id: string;
	events: LogEvent[];
}

export interface LogEdgeUnit {
	from: LogEvent;
	to: LogEvent;
}

export interface LogGraphNode extends LogNode {
	x: number;
	y: number;
}

export interface LogGraphEdge extends LogEdge {
	curve?: CatmullRomCurve3;
}
