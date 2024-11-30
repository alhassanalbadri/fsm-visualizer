import React, { useState, useCallback, useRef, useEffect } from "react";

interface CustomNodeProps {
	id: string;
	data: {
		isEditing: boolean; label?: string; conflictType?: string; conflictToken?: string 
};
	isConnectable: boolean;
	selected: boolean;
	onSelect?: (id: string) => void;
	onConnectStart?: (
		nodeId: string,
		portType: "input" | "output",
		portX: number,
		portY: number,
		clientX: number,
		clientY: number
	) => void;
	onConnectEnd?: (targetNodeId: string) => void;
	isCreatingConnection: boolean;
	isConnectionSource: boolean;
	onResize?: (id: string, width: number, height: number) => void;
	onLabelChange?: (id: string, newLabel: string) => void;
}

const CustomNode: React.FC<CustomNodeProps> = React.memo(
	({
		id,
		data,
		isConnectable,
		selected,
		onSelect,
		onConnectStart,
		onConnectEnd,
		isCreatingConnection,
		isConnectionSource,
		onResize,
		onLabelChange,
	}) => {
		const [label, setLabel] = useState<string>(
			typeof data.label === "string" ? data.label : "New State"
		);
		const [isEditing, setIsEditing] = useState(false);
		const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
			width: 150,
			height: 50,
		});

		const textAreaRef = useRef<HTMLTextAreaElement>(null);
		const containerRef = useRef<HTMLDivElement>(null);
		const hiddenTextRef = useRef<HTMLDivElement>(null);
		const inputHandleRef = useRef<HTMLDivElement>(null);
		const outputHandleRef = useRef<HTMLDivElement>(null);

		// Configuration constants
		const MIN_WIDTH = 300;
		const MAX_WIDTH = 600;
		const LINE_HEIGHT = 24;
		const PADDING_X = 32;
		const PADDING_Y = 16;
		const BORDER_X = 4;
		const MAX_ROWS = 10;
		const MAX_CONTENT_HEIGHT = LINE_HEIGHT * MAX_ROWS;

		const updateDimensions = useCallback(() => {
			if (!hiddenTextRef.current || !containerRef.current) {
				console.warn("Hidden text or container reference is missing");
				return;
			}

			hiddenTextRef.current.textContent = isEditing
				? textAreaRef.current?.value ?? ""
				: label;

			const contentWidth = hiddenTextRef.current.offsetWidth;
			const contentHeight = hiddenTextRef.current.offsetHeight;

			const conflictHeight = (data.conflictType || data.conflictToken) ? 60 : 0;

			const newWidth = Math.min(
				Math.max(contentWidth + PADDING_X * 2, MIN_WIDTH),
				MAX_WIDTH
			);

			const newHeight = Math.min(
				Math.max(contentHeight + PADDING_Y * 2 + conflictHeight, 50),
				MAX_CONTENT_HEIGHT + conflictHeight
			);

			setDimensions({
				width: newWidth,
				height: newHeight,
			});

			onResize?.(id, newWidth, newHeight);
		}, [isEditing, label, onResize, id, data.conflictType, data.conflictToken]);


		useEffect(() => {
			setLabel(typeof data.label === "string" ? data.label : "New State");
			updateDimensions();
		}, [data.label]);

		useEffect(() => {
			if (hiddenTextRef.current) {
				hiddenTextRef.current.textContent = label;
				updateDimensions();
			}
		}, [label]);

		useEffect(() => {
			data.isEditing = isEditing;
			if (isEditing && textAreaRef.current) {
				textAreaRef.current.focus();
				textAreaRef.current.setSelectionRange(
					textAreaRef.current.value.length,
					textAreaRef.current.value.length
				);
			}
		}, [isEditing]);

		const handleClick = useCallback(
			(event: React.MouseEvent) => {
				event.stopPropagation();
				onSelect?.(id);
			},
			[onSelect, id]
		);

		const handleDoubleClick = useCallback(
			(event: React.MouseEvent) => {
				event.stopPropagation();
				setIsEditing(true);
			},
			[]
		);

		// Handle Input Port Click (Top-Center)
		const handleInputPortClick = useCallback(() => {
			if (
				isCreatingConnection &&
				onConnectEnd &&
				inputHandleRef.current &&
				containerRef.current
			) {
				onConnectEnd?.(id);
			}
		}, [id, isCreatingConnection, onConnectEnd]);

		// Handle Output Port Click (Bottom-Center)
		const handleOutputPortClick = useCallback(
			(event: React.MouseEvent) => {
				event.preventDefault();
				event.stopPropagation();

				if (
					onConnectStart &&
					outputHandleRef.current &&
					containerRef.current
				) {
					// Get port's absolute position
					const rect = outputHandleRef.current.getBoundingClientRect();
					const portX = rect.left + rect.width / 2;
					const portY = rect.top + rect.height / 2;

					// Get cursor's absolute position
					const clientX = event.clientX;
					const clientY = event.clientY;

					// Call the onConnectStart callback with port and cursor positions
					onConnectStart?.(id, "output", portX, portY, clientX, clientY);
				}
			},
			[id, onConnectStart]
		);

		const handleKeyDown = useCallback(
			(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
				if (event.key === "Escape") {
					setIsEditing(false);
				} else if (event.key === "Enter" && !event.shiftKey) {
					event.preventDefault();
					setIsEditing(false);
					onLabelChange?.(id, label.trim());
				}
			},
			[id, label, onLabelChange]
		);
		

		return (
			<div
				ref={containerRef}
				className={`node-container px-4 py-2 rounded-lg relative flex flex-col justify-center items-center ${isEditing
					? "border-2 border-green-500 shadow-lg"
					: selected
						? "border-2 border-blue-500 shadow-lg animate-borderPulse"
						: "border-2 border-gray-300"
					} bg-white shadow-md transition-all duration-700 ease-in-out hover:shadow-xl cursor-pointer`}
				style={{
					width: dimensions.width,
					height: dimensions.height,
				}}
				onClick={handleClick}
				onDoubleClick={handleDoubleClick}
				tabIndex={0}
				role="button"
				aria-label={`Node: ${label}`}
				title="Double-click to edit"
			>
				{/* Editing Indicator Icon */}
				{isEditing && (
					<div className="absolute top-1 right-1">
						{/* Pencil Icon */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							className="h-4 w-4 text-green-500"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
							/>
						</svg>
					</div>
				)}

				{/* Input Handle - Top-Center */}
				{isConnectable && (
					<div
						ref={inputHandleRef}
						className={`handle handle-target absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 border-2 border-white rounded-full cursor-pointer ${isCreatingConnection && !isConnectionSource
							? "bg-green-500 animate-pulse"
							: "bg-blue-500"
							}`}
						onClick={(e) => {
							e.stopPropagation();
							handleInputPortClick();
						}}
					/>
				)}

				{/* Label Editing or Display */}
				{isEditing ? (
					<textarea
						ref={textAreaRef}
						value={label}
						onChange={(event) => setLabel(event.target.value)}
						onBlur={() => {
							setIsEditing(false);
							onLabelChange?.(id, label.trim());
						}}
						className="w-full resize-none outline-none text-lg font-semibold text-center rounded"
						style={{
							overflow: "auto",
							maxHeight: `${MAX_CONTENT_HEIGHT}px`,
							lineHeight: `${LINE_HEIGHT}px`,
						}}
						rows={MAX_ROWS}
						onKeyDown={handleKeyDown}
					/>
				) : (
					<div
						className="content w-full overflow-hidden text-lg font-semibold text-center whitespace-pre-wrap break-words cursor-pointer"
						style={{
							maxHeight: `${MAX_CONTENT_HEIGHT}px`,
							lineHeight: `${LINE_HEIGHT}px`,
						}}
						onClick={(e) => {
							e.stopPropagation();
							if (selected) {
								setIsEditing(true);
							} else {
								onSelect?.(id);
							}
						}}
					>
						{label}
						{(data.conflictType || data.conflictToken) && (
							<div className="mt-2 p-2 w-full bg-red-100 rounded-lg border border-red-300">
								{data.conflictType && (
									<div className="text-sm text-red-800 font-medium">
										<strong>Conflict Type:</strong> {data.conflictType}
									</div>
								)}
								{data.conflictToken && (
									<div className="text-sm text-red-800 font-medium">
										<strong>Conflict Token:</strong> {data.conflictToken}
									</div>
								)}
							</div>
						)}
					</div>
				)}

				{/* Output Handle - Bottom-Center */}
				{isConnectable && (
					<div
						ref={outputHandleRef}
						className={`handle handle-source absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-3 h-3 border-2 border-white rounded-full cursor-pointer ${isConnectionSource ? "bg-red-500" : "bg-blue-500"
							}`}
						onClick={(e) => {
							e.stopPropagation();
							handleOutputPortClick(e);
						}}
					/>
				)}

				{/* Hidden Element for Calculating Width */}
				<div
					ref={hiddenTextRef}
					className="absolute left-0 top-0 invisible whitespace-pre-wrap break-words text-lg font-bold"
					style={{
						padding: `${PADDING_Y / 2}px ${PADDING_X / 2}px`,
						maxWidth: `${MAX_WIDTH - PADDING_X - BORDER_X}px`,
					}}
				/>
			</div>
		);
	}
);

CustomNode.displayName = "CustomNode";

export default CustomNode;
