export interface LogNode {
	id: string;
	x: number;
	y: number;
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
