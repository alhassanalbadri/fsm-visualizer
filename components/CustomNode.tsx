"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export default function CustomNode({ data, isConnectable, selected }: NodeProps) {
	const [label, setLabel] = useState<string>(typeof data.label === 'string' ? data.label : "New State");
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
				className={`px-4 py-2 rounded-lg bg-white relative flex flex-col justify-center items-center 
					${selected 
						? 'border-2 border-blue-500 animate-borderPulse shadow-lg ring-4 ring-blue-100' 
						: 'border-2 border-gray-200 hover:border-gray-300'} 
					shadow-md hover:shadow-lg duration-700 ease-in-out`}
				style={{
					width: dimensions.width,
					height: dimensions.height,
					maxHeight: `${MAX_HEIGHT}px`,
					backgroundColor: '#FFFFFF',
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
					className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white hover:!scale-110"
					style={{ top: '-5px', pointerEvents: "auto" }}
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
						className="w-full resize-none outline-none text-lg font-semibold text-center focus:ring-2 focus:ring-blue-200 rounded"
						style={{
							overflow: 'hidden',
							height: `${MAX_CONTENT_HEIGHT}px`,
							lineHeight: `${LINE_HEIGHT}px`,
						}}
						rows={MAX_ROWS}
					/>
				) : (
					<div
						className="content w-full overflow-auto text-lg font-semibold text-center whitespace-pre-wrap break-words cursor-pointer text-gray-700"
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
					className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white hover:!scale-110m"
					style={{ bottom: '-5px', pointerEvents: "auto" }}
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
