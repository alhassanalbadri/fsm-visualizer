"use client";

import React, { useState, useCallback } from 'react';
import { EdgeProps, EdgeLabelRenderer, getBezierPath } from 'reactflow';

export default function CustomEdge({
	id,
	source,
	target,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	markerEnd,
}: EdgeProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [label, setLabel] = useState('');

	const isSelfLoop = source === target;

	let edgePath, labelX, labelY;
	if (isSelfLoop) {
		const radiusX = 80;
		const radiusY = 50;
		
		edgePath = `M ${sourceX} ${sourceY} A ${radiusX} ${radiusY} 0 1 1 ${targetX} ${targetY}`;
		
		labelX = sourceX - radiusX - 75;
		labelY = sourceY + radiusY - 80;
		
	} else {
		[edgePath, labelX, labelY] = getBezierPath({
			sourceX,
			sourceY,
			sourcePosition,
			targetX,
			targetY,
			targetPosition,
		});
	}

	const handleLabelClick = useCallback((event: React.MouseEvent | React.KeyboardEvent) => {
		event.stopPropagation();
		setIsEditing(true);
	}, []);

	const handleLabelChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setLabel(event.target.value);
	}, []);

	const handleBlur = useCallback(() => {
		setIsEditing(false);
	}, []);

	return (
		<>
			<path
				id={`${id}-invisible`}
				style={style}
				className="react-flow__edge-path invisible-edge"
				d={edgePath}
				markerEnd={markerEnd}
			/>
			<path
				id={id}
				style={{ ...style, strokeWidth: 2 }}
				className="react-flow__edge-path visible-edge"
				d={edgePath}
				markerEnd={markerEnd}
			/>
			<EdgeLabelRenderer>
				<div
					style={{
						position: 'absolute',
						transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
						fontSize: 12,
						pointerEvents: 'all',
					}}
					className="nodrag nopan"
				>
					{isEditing ? (
						<input
							value={label}
							onChange={handleLabelChange}
							onBlur={handleBlur}
							className="px-2 py-1 bg-white border rounded shadow-sm"
							placeholder="Transition label"
							autoFocus
						/>
					) : (
						<div
							className="px-2 py-1 bg-white border rounded shadow-sm cursor-pointer"
							onClick={handleLabelClick}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleLabelClick(e as unknown as React.MouseEvent);
							}}
						>
							{label || 'Add label'}
						</div>
					)}
				</div>
			</EdgeLabelRenderer>
		</>
	);
}
