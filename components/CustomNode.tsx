"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Handle, Position, NodeProps } from "reactflow";

export default function CustomNode({ data, isConnectable, selected }: NodeProps) {
	const [label, setLabel] = useState(data.label || "New State");
	const [isEditing, setIsEditing] = useState(false);
	const [dimensions, setDimensions] = useState({ width: 150, height: 40 });

	const textAreaRef = useRef<HTMLTextAreaElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const hiddenTextRef = useRef<HTMLDivElement>(null);

	const MIN_WIDTH = 150;
	const MAX_WIDTH = 500;
	const MAX_HEIGHT = 300;
	const LINE_HEIGHT = 24;
	const PADDING_X = 32;
	const PADDING_Y = 16;
	const BORDER_X = 4;
	const BORDER_Y = 4;
	const MAX_ROWS = 10;
	const MAX_CONTENT_HEIGHT = LINE_HEIGHT * MAX_ROWS;

	const calculateContentHeight = useCallback((element: HTMLElement) => {
		const lineCount = Math.ceil(element.scrollHeight / LINE_HEIGHT);
		return Math.min(lineCount * LINE_HEIGHT, MAX_CONTENT_HEIGHT);
	}, [MAX_CONTENT_HEIGHT]);

	const handleDoubleClick = useCallback((event: React.MouseEvent) => {
		event.stopPropagation();
		setIsEditing(true);
	}, []);

	const updateDimensions = useCallback(() => {
		if (containerRef.current && hiddenTextRef.current) {
			const content = isEditing ? textAreaRef.current : containerRef.current.querySelector('.content');
			if (content) {
				const contentHeight = calculateContentHeight(content as HTMLElement);
				const newHeight = contentHeight + PADDING_Y + BORDER_Y;

				hiddenTextRef.current.textContent = (content as HTMLTextAreaElement).value || content.textContent;
				const contentWidth = hiddenTextRef.current.offsetWidth;
				const newWidth = Math.min(Math.max(contentWidth + PADDING_X + BORDER_X, MIN_WIDTH), MAX_WIDTH);

				setDimensions({ width: newWidth, height: newHeight });
			}
		}
	}, [calculateContentHeight, isEditing]);

	useEffect(() => {
		updateDimensions();
		window.addEventListener('resize', updateDimensions);
		return () => window.removeEventListener('resize', updateDimensions);
	}, [label, isEditing, updateDimensions]);

	useEffect(() => {
		if (isEditing && textAreaRef.current) {
			textAreaRef.current.focus();
			textAreaRef.current.setSelectionRange(textAreaRef.current.value.length, textAreaRef.current.value.length);
		}
	}, [isEditing]);

	return (
		<>
			<div
				ref={containerRef}
				className={`px-4 py-2 rounded-md bg-white relative flex flex-col justify-center items-center ${selected ? 'border-2 border-blue-500 animate-borderPulse' : 'border-2 border-stone-400'} shadow-md transition-all duration-700 ease-in-out`}
				style={{
					width: dimensions.width,
					height: dimensions.height,
					maxHeight: `${MAX_HEIGHT}px`,
				}}
				onDoubleClick={handleDoubleClick}
				tabIndex={0}
				onKeyDown={(event) => {
					if (!isEditing && (event.key === "Enter" || event.key === " ")) {
						event.preventDefault();
						setIsEditing(true);
					}
				}}
				role="button"
				aria-label={`Node: ${label}`}
			>
				<Handle
					type="target"
					position={Position.Top}
					isConnectable={isConnectable}
					className="!w-4 !h-4 !bg-blue-500 !border-2 !border-white"
					style={{ top: '-10px', pointerEvents: "auto" }}
				/>

				{isEditing ? (
					<textarea
						ref={textAreaRef}
						value={label}
						onChange={(event) => setLabel(event.target.value)}
						onBlur={() => {
							setIsEditing(false);
							data.label = label.trim();
						}}
						className="w-full resize-none outline-none text-lg font-bold text-center"
						style={{
							overflow: 'hidden',
							height: `${MAX_CONTENT_HEIGHT}px`,
							lineHeight: `${LINE_HEIGHT}px`,
						}}
						rows={MAX_ROWS}
					/>
				) : (
					<div
						className="content w-full overflow-auto text-lg font-bold text-center whitespace-pre-wrap break-words cursor-pointer"
						style={{
							maxHeight: `${MAX_CONTENT_HEIGHT}px`,
							lineHeight: `${LINE_HEIGHT}px`,
						}}
					>
						{label}
					</div>
				)}

				<Handle
					type="source"
					position={Position.Bottom}
					isConnectable={isConnectable}
					className="!w-4 !h-4 !bg-blue-500 !border-2 !border-white"
					style={{ bottom: '-10px', pointerEvents: "auto" }}
				/>
			</div>
			<div
				ref={hiddenTextRef}
				className="absolute left-0 top-0 invisible whitespace-pre-wrap break-words text-lg font-bold"
				style={{
					padding: `${PADDING_Y / 2}px ${PADDING_X / 2}px`,
					maxWidth: `${MAX_WIDTH - PADDING_X - BORDER_X}px`,
					pointerEvents: "none",
				}}
			/>
		</>
	);
}
