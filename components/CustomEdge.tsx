"use client";

import React, {
	useState,
	useCallback,
	useEffect,
	useRef,
	useLayoutEffect,
} from "react";

interface Edge {
	id: string;
	source: string;
	target: string;
	sourceX: number;
	sourceY: number;
	targetX: number;
	targetY: number;
	type: string;
	data: {
		label: string;
		onLabelChange: (id: string, newLabel: string) => void;
	};
}

interface CustomEdgeProps {
	edge?: Edge;
	path?: {
		sourceX: number;
		sourceY: number;
		targetX: number;
		targetY: number;
	};
	nodes?: Node[];
	onDeleteEdge?: (id: string) => void;
	setSelectedEdgeId: (id: string | null) => void;
	selectedEdgeId: string | null;
}

interface Node {
	id: string;
	type: string;
	position: { x: number; y: number };
	data: { label: string; conflictType?: string; conflictToken?: string };
	width: number;
	height: number;
}

const CustomEdge: React.FC<CustomEdgeProps> = ({
	edge,
	path,
	nodes,
	onDeleteEdge,
	setSelectedEdgeId,
	selectedEdgeId,
}) => {
	const [isEditing, setIsEditing] = useState(false);
	const label = edge?.data?.label || "";

	const isSelected = edge?.id === selectedEdgeId;

	const textRef = useRef<SVGTextElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [labelDimensions, setLabelDimensions] = useState<{ width: number; height: number }>({
		width: 0,
		height: 0,
	});

	const LABEL_PADDING = 8;
	const labelWidthRef = useRef<number>(0);

	useEffect(() => {
		const markerId = "arrowhead-marker";
		if (!document.getElementById(markerId)) {
			const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
			const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
			marker.setAttribute("id", markerId);
			marker.setAttribute("markerWidth", "6");
			marker.setAttribute("markerHeight", "6");
			marker.setAttribute("viewBox", "0 0 6 6");
			marker.setAttribute("refX", "5");
			marker.setAttribute("refY", "3");
			marker.setAttribute("orient", "auto");
			marker.setAttribute("markerUnits", "strokeWidth");

			const pathElement = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"path"
			);
			pathElement.setAttribute("d", "M0,0 L6,3 L0,6 Z");
			pathElement.setAttribute("fill", "#b1b1b7");
			pathElement.setAttribute("stroke", "none");

			marker.appendChild(pathElement);
			defs.appendChild(marker);

			let svg = document.querySelector("svg");
			if (!svg) {
				svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
				svg.setAttribute("style", "position:absolute; width:0; height:0;");
				document.body.appendChild(svg);
			}
			svg.appendChild(defs);
		}
	}, []);

	useLayoutEffect(() => {
		if (textRef.current && !isEditing) {
			const bbox = textRef.current.getBBox();
			labelWidthRef.current = bbox.width;
			setLabelDimensions({ width: bbox.width, height: bbox.height });
		}
	}, [label, isEditing]);

	useLayoutEffect(() => {
		if (isEditing && textareaRef.current) {
			const textarea = textareaRef.current;
			textarea.style.height = "auto";
			textarea.style.height = `${textarea.scrollHeight}px`;

			setLabelDimensions(() => ({
				width: labelWidthRef.current,
				height: textarea.scrollHeight,
			}));
		}
	}, [isEditing, label]);

	const handleLabelClick = useCallback(
		(event: React.MouseEvent | React.KeyboardEvent) => {
			event.stopPropagation();
			setIsEditing(true);
		},
		[]
	);

	const handleLabelChange = useCallback(
		(event: React.ChangeEvent<HTMLTextAreaElement>) => {
			const newLabel = event.target.value;
			if (edge?.data?.onLabelChange) {
				edge.data.onLabelChange(edge.id, newLabel);
			}
		},
		[edge]
	);

	const handleBlur = useCallback(() => {
		setIsEditing(false);
	}, []);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (event.key === "Enter" && !event.shiftKey) {
				event.preventDefault();
				setIsEditing(false);
			}
		},
		[]
	);

	const handleEdgeClick = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation();
			if (edge?.id !== selectedEdgeId) {
				setSelectedEdgeId(edge?.id || null);
			} else if(edge?.id === selectedEdgeId) {
				setSelectedEdgeId(null);
			}
		},
		[edge, selectedEdgeId, setSelectedEdgeId]
	);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (isSelected && (event.key === "Delete" || event.key === "Backspace") && edge && !isEditing) {
				onDeleteEdge?.(edge.id);
				setSelectedEdgeId(null);
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isSelected, edge, onDeleteEdge, setSelectedEdgeId]);

	let sourceX, sourceY, targetX, targetY;

	if (edge && nodes) {
		const sourceNode = nodes.find((n) => n.id === edge.source);
		const targetNode = nodes.find((n) => n.id === edge.target);
		if (!sourceNode || !targetNode) return null;

		sourceX = sourceNode.position.x + sourceNode.width / 2;
		sourceY = sourceNode.position.y + sourceNode.height;
		targetX = targetNode.position.x + targetNode.width / 2;
		targetY = targetNode.position.y;
	} else if (path) {
		sourceX = path.sourceX;
		sourceY = path.sourceY;
		targetX = path.targetX;
		targetY = path.targetY;
	} else {
		return null;
	}

	const isSelfConnection = edge ? edge.source === edge.target : false;

	const calculatePathData = () => {
		if (isSelfConnection && edge) {
			const node = nodes?.find((n) => n.id === edge.source);
			if (!node) return { pathData: "", labelX: 0, labelY: 0 };

			const RADIUS_SCALE_X = 0.4;
			const RADIUS_SCALE_Y = 0.9;
			const PADDING = 15;

			const radiusX = node.width * RADIUS_SCALE_X + PADDING;
			const radiusY = node.height * RADIUS_SCALE_Y + PADDING;

			const pathData = `
				M ${sourceX} ${sourceY}
				A ${radiusX} ${radiusY} 0 1 1 ${targetX} ${targetY}`;

			const labelX = sourceX - radiusX - 10;
			const labelY = sourceY - radiusY - 20;

			return { pathData, labelX, labelY };
		} else {
			const deltaY = targetY - sourceY;
			const controlPointOffset = Math.min(100, Math.abs(deltaY) / 2);

			const controlX1 = sourceX;
			const controlY1 = sourceY + controlPointOffset;

			const controlX2 = targetX;
			const controlY2 = targetY - controlPointOffset;

			const pathData = `M ${sourceX} ${sourceY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${targetX} ${targetY}`;

			const labelX = (sourceX + targetX) / 2;
			const labelY = (sourceY + targetY) / 2 - 20;

			return { pathData, labelX, labelY };
		}
	};

	const { pathData, labelX, labelY } = calculatePathData();

	const svgStyle: React.CSSProperties = {
		position: "absolute",
		left: 0,
		top: 0,
		width: "100%",
		height: "100%",
		pointerEvents: "none",
		zIndex: isSelfConnection ? 2 : 1,
	};

	return (
		<svg style={svgStyle} xmlns="http://www.w3.org/2000/svg" className="edge-container">
			{/* Invisible hitbox for selection */}
			<path
				d={pathData}
				stroke="transparent"
				strokeWidth={10}
				fill="none"
				style={{ pointerEvents: "stroke", cursor: "pointer" }}
				onClick={handleEdgeClick}
			/>

			 {/* Highlight edge when selected */}
			<path
				d={pathData}
				stroke={isSelected ? "#ff5c5c" : "#b1b1b7"}
				strokeWidth={2}
				fill="none"
				markerEnd="url(#arrowhead-marker)"
				strokeLinecap="round"
				strokeLinejoin="round"
				style={{ cursor: isSelected ? "pointer" : "default" }}
			/>

			{/* Edge Label */}
			{label && (
				<g
					style={{ pointerEvents: "auto" }}
					transform={`translate(${labelX}, ${labelY})`}
					onClick={(e) => {
						handleEdgeClick(e);
						handleLabelClick(e);
					}}
					role="button"
					tabIndex={0}
				>
					<rect
						x={-labelDimensions.width / 2 - LABEL_PADDING}
						y={-labelDimensions.height / 2 - LABEL_PADDING}
						width={labelDimensions.width + LABEL_PADDING * 2}
						height={labelDimensions.height + LABEL_PADDING * 2}
						fill="rgba(255, 255, 255, 0.9)"
						rx="6"
						ry="6"
						stroke={isSelected ? "#ff5c5c" : "#b1b1b7"}
						strokeWidth="1"
					/>
					{!isEditing && (
						<text
							ref={textRef}
							textAnchor="middle"
							alignmentBaseline="middle"
							style={{
								fontSize: "14px",
								fontFamily: "Arial, sans-serif",
								fontWeight: "600",
								fill: "#333",
								cursor: "pointer",
								userSelect: "none",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{label}
						</text>
					)}
					{isEditing && (
						<foreignObject
							x={-labelDimensions.width / 2 - LABEL_PADDING}
							y={-labelDimensions.height / 2 - LABEL_PADDING}
							width={labelDimensions.width + LABEL_PADDING * 2}
							height={labelDimensions.height + LABEL_PADDING * 2}
						>
							<textarea
								ref={textareaRef}
								value={label}
								onChange={handleLabelChange}
								onBlur={handleBlur}
								onKeyDown={handleKeyDown}
								autoFocus
								placeholder="Transition label"
								style={{
									width: "100%",
									height: "100%",
									boxSizing: "border-box",
									fontSize: "14px",
									fontFamily: "Arial, sans-serif",
									fontWeight: "600",
									textAlign: "center",
									border: "none",
									backgroundColor: "transparent",
									resize: "none",
									overflow: "hidden",
									outline: "none",
									padding: "0",
									margin: "0",
									whiteSpace: "pre-wrap",
									wordBreak: "break-all",
								}}
							/>
						</foreignObject>
					)}
				</g>
			)}
		</svg>
	);
};

export default React.memo(CustomEdge);
