/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
'use client';

import { toPng, toSvg } from 'html-to-image';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useToast } from '@/hooks/use-toast';

import { calculatePortPosition } from '../app/utils/calculatePortPosition';

import CustomEdge from './CustomEdge';
import CustomNode from './CustomNode';
import FlowControl from './FlowControl';
import { Grammar } from './parser';
import Sidebar from './Sidebar';

interface Node {
	id: string;
	type: string;
	position: { x: number; y: number };
	data: { isEditing: boolean, label: string; conflictType?: string; conflictToken?: string };
	width: number;
	height: number;
}

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
		// eslint-disable-next-line no-unused-vars
		onLabelChange: (id: string, newLabel: string) => void;
	};
}

// Fixed Canvas Dimensions
const CANVAS_WIDTH = 10000;
const CANVAS_HEIGHT = 10000;
// Node Dimensions (Default Width and Height)
const NODE_WIDTH = 150;
const NODE_HEIGHT = 50;


const initialNodes: Node[] = [
	{
		id: '1',
		type: 'custom',
		position: { x: (CANVAS_WIDTH / 2) - (NODE_WIDTH / 2), y: (CANVAS_HEIGHT / 2) - (NODE_HEIGHT / 2) },
		data: {
			label: 'Start',
			isEditing: false,
		},
		width: 150,
		height: 50,
	},
];

const initialEdges: Edge[] = [];

const FlowEditor = () => {
	const [nodes, setNodes] = useState<Node[]>(initialNodes);
	const [edges, setEdges] = useState<Edge[]>(initialEdges);
	const [selectedNode, setSelectedNode] = useState<string | null>(null);
	const [connectionStart, setConnectionStart] = useState<{
		nodeId: string;
		portType: 'input' | 'output';
		x: number;
		y: number;
	} | null>(null);
	const [draggedEdge, setDraggedEdge] = useState<{
		sourceX: number;
		sourceY: number;
		targetX: number;
		targetY: number;
	} | null>(null);
	const [dragOffset, setDragOffset] = useState<{ offsetX: number; offsetY: number } | null>(null);

	const [grammar, setGrammar] = useState<string>('');
	const [parsingResult, setParsingResult] = useState<string>('');

	const exportRef = useRef<HTMLDivElement>(null);
	const { toast } = useToast();

	const selectedNodeRef = useRef<string | null>(selectedNode);
	const dragOffsetRef = useRef<{ offsetX: number; offsetY: number } | null>(dragOffset);

	const isDraggingRef = useRef<boolean>(false);
	const dragRAFRef = useRef<number | null>(null);

	// TODO: Maybe use this as an indicator somewhere in the UI, not just in the beforeunload event.
	const [isSaved, setIsSaved] = useState<boolean>(true);
	const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

	// Update refs when state changes
	useEffect(() => {
		selectedNodeRef.current = selectedNode;
	}, [selectedNode]);

	useEffect(() => {
		dragOffsetRef.current = dragOffset;
	}, [dragOffset]);

	// STATE VARIABLES FOR PANNING
	const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [isPanning, setIsPanning] = useState<boolean>(false);
	const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

	const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
		if (e.button === 0 && !isDraggingRef.current) {
			setIsPanning(true);
			setPanStart({ x: e.clientX, y: e.clientY });
		}
	};

	const handleCanvasMouseUp = () => {
		setIsPanning(false);
		setPanStart(null);
	};

	useEffect(() => {
		const handleMouseUp = () => {
			handleCanvasMouseUp();
		};
		document.addEventListener('mouseup', handleMouseUp);
		return () => document.removeEventListener('mouseup', handleMouseUp);
	}, []);

	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (isPanning && panStart && !isDraggingRef.current) {
				const dx = e.clientX - panStart.x;
				const dy = e.clientY - panStart.y;
				setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
				setPanStart({ x: e.clientX, y: e.clientY });
			}
		};
		document.addEventListener('mousemove', handleMouseMove);
		return () => document.removeEventListener('mousemove', handleMouseMove);
	}, [isPanning, panStart]);

	useEffect(() => {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;

		const centerX = (viewportWidth / 2) - (CANVAS_WIDTH / 2);
		const centerY = (viewportHeight / 2) - (CANVAS_HEIGHT / 2);

		setPanOffset({ x: centerX, y: centerY });
	}, []);

	// Handler for node dragging
	const handleNodeDrag = useCallback(
		(event: MouseEvent) => {
			if (!isDraggingRef.current) { return; }

			const nodeId = selectedNodeRef.current;
			const offset = dragOffsetRef.current;
			if (!nodeId || !offset) { return; }

			let newX = event.clientX - offset.offsetX;
			let newY = event.clientY - offset.offsetY;

			// Ensure the node stays within the canvas boundaries
			newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - NODE_WIDTH)); // NODE_WIDTH is the width of the node
			newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - NODE_HEIGHT)); // NODE_HEIGHT is the height of the node

			setNodes((prevNodes) =>
				prevNodes.map((node) =>
					node.id === nodeId ? { ...node, position: { x: newX, y: newY } } : node
				)
			);
		},
		[]
	);

	// Stable handler for ending node drag
	const handleNodeDragEnd = useCallback(() => {
		if (isDraggingRef.current) {
			isDraggingRef.current = false;
			setSelectedNode(null);
			setDragOffset(null);
			selectedNodeRef.current = null;
			dragOffsetRef.current = null;

			if (dragRAFRef.current) {
				cancelAnimationFrame(dragRAFRef.current);
				dragRAFRef.current = null;
			}

			window.removeEventListener('mousemove', handleNodeDrag);
			window.removeEventListener('mouseup', handleNodeDragEnd);
		}
	}, [handleNodeDrag]);

	// Handle node drag start
	const handleNodeDragStart = useCallback(
		(event: React.MouseEvent, nodeId: string) => {
			event.preventDefault();
			event.stopPropagation();

			const node = nodes.find((n) => n.id === nodeId);
			if (node) {
				const offsetX = event.clientX - node.position.x;
				const offsetY = event.clientY - node.position.y;

				setSelectedNode(nodeId);
				setDragOffset({ offsetX, offsetY });
				setIsSaved(false); // Mark as unsaved

				// Update refs
				selectedNodeRef.current = nodeId;
				dragOffsetRef.current = { offsetX, offsetY };
				isDraggingRef.current = true;

				// Add global event listeners for smoother dragging
				window.addEventListener('mousemove', handleNodeDrag);
				window.addEventListener('mouseup', handleNodeDragEnd);
			}
		},
		[nodes, handleNodeDrag, handleNodeDragEnd]
	);

	// Handle canvas drag and drop
	const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const dt = event.dataTransfer;
		dt.dropEffect = 'move';
	};

	const onDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();

			const reactFlowBounds = exportRef.current?.getBoundingClientRect();
			const type = event.dataTransfer.getData('application/fsmflow');

			if (typeof type === 'string' && type && reactFlowBounds) {
				const position = {
					x: event.clientX - reactFlowBounds.left,
					y: event.clientY - reactFlowBounds.top,
				};

				// Ensure the new node is created within the canvas boundaries
				position.x = Math.max(0, Math.min(position.x, CANVAS_WIDTH - NODE_WIDTH));
				position.y = Math.max(0, Math.min(position.y, CANVAS_HEIGHT - NODE_HEIGHT));

				const newNode: Node = {
					id: uuidv4(),
					type: 'custom',
					position,
					data: {
						label: 'New State',
						isEditing: false,
					},
					width: 150,
					height: 50,
				};

				setNodes((nds) => nds.concat(newNode));
				setIsSaved(false);
			}
		},
		[]
	);


	// Start a connection from a source node (Output Port - Bottom-Center)
	const handleConnectionStart = useCallback(
		(
			nodeId: string,
			portType: 'input' | 'output',
			portClientX: number,
			portClientY: number,
			clientX: number,
			clientY: number
		) => {
			if (portType !== 'output') { return; }

			const canvasRect = exportRef.current?.getBoundingClientRect();
			if (!canvasRect) { return; }

			const sourceX = portClientX - canvasRect.left;
			const sourceY = portClientY - canvasRect.top;

			const cursorX = clientX - canvasRect.left;
			const cursorY = clientY - canvasRect.top;

			setConnectionStart({ nodeId, portType, x: sourceX, y: sourceY });
			setDraggedEdge({ sourceX, sourceY, targetX: cursorX, targetY: cursorY });
		},
		[]
	);

	const handleCanvasMouseMove = useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			if (connectionStart && draggedEdge) {
				const canvasRect = exportRef.current?.getBoundingClientRect();
				if (canvasRect) {
					const targetX = event.clientX - canvasRect.left;
					const targetY = event.clientY - canvasRect.top;

					setDraggedEdge({
						...draggedEdge,
						targetX: isNaN(targetX) ? draggedEdge.targetX : targetX,
						targetY: isNaN(targetY) ? draggedEdge.targetY : targetY,
					});
				}
			}
		},
		[connectionStart, draggedEdge]
	);

	const onEdgeLabelChange = useCallback((id: string, newLabel: string) => {
		setEdges((prevEdges) =>
			prevEdges.map((edge) =>
				edge.id === id
					? { ...edge, data: { ...edge.data, label: newLabel.length === 0 ? 'Add Label' : newLabel } }
					: edge
			)
		);
		setIsSaved(false);
	}, []);

	// Complete a connection to a target node (Input Port - Top-Center)
	const handleConnectionEnd = useCallback(
		(targetNodeId: string) => {
			if (!connectionStart) { return; }

			const targetNode = nodes.find((node) => node.id === targetNodeId);
			const sourceNode = nodes.find((node) => node.id === connectionStart.nodeId);

			if (sourceNode && targetNode) {
				if (edges.find((edge) => edge.source === sourceNode.id && edge.target === targetNode.id)) {
					toast({
						title: 'Invalid Connection',
						description: 'Cannot create this connection.',
						variant: 'destructive',
					});
					setConnectionStart(null);
					setDraggedEdge(null);
					return;
				}

				const sourcePort = calculatePortPosition(
					{ x: sourceNode.position.x, y: sourceNode.position.y, width: sourceNode.width, height: sourceNode.height },
					true
				);
				const targetPort = calculatePortPosition(
					{ x: targetNode.position.x, y: targetNode.position.y, width: targetNode.width, height: targetNode.height },
					false
				);

				const newEdge: Edge = {
					id: uuidv4(),
					source: connectionStart.nodeId,
					target: targetNodeId,
					sourceX: sourcePort.x,
					sourceY: sourcePort.y,
					targetX: targetPort.x,
					targetY: targetPort.y,
					type: 'custom',
					data: { label: 'New Edge', onLabelChange: onEdgeLabelChange },
				};

				setEdges((eds) => [...eds, newEdge]);
				setIsSaved(false);
			}

			setConnectionStart(null);
			setDraggedEdge(null);
		},
		[connectionStart, nodes, edges, onEdgeLabelChange, toast]
	);

	// Cancel connection on canvas click and deselect node
	const handleCanvasClick = useCallback(() => {
		if (connectionStart) {
			setConnectionStart(null);
			setDraggedEdge(null);
		}
		setSelectedNode(null);
	}, [connectionStart]);

	const saveFlow = useCallback(() => {
		const flowData = { nodes, edges };
		const blob = new Blob([JSON.stringify(flowData, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'flow.json';
		link.click();
		toast({ title: 'Flow Saved', description: 'Your flow has been saved.' });
		setIsSaved(true);
	}, [nodes, edges, toast]);

	const onRestore = useCallback(
		(flow: { nodes: Node[]; edges: Edge[] }) => {
			setNodes(flow.nodes);
			setEdges(flow.edges);
			toast({ title: 'Flow Restored', description: 'Your flow has been restored.' });
			setIsSaved(true);
		},
		[toast]
	);

	// Clear all nodes and edges
	const clearCanvas = useCallback(() => {
		if (window.confirm('Are you sure you want to clear the canvas?')) {
			setNodes([]);
			setEdges([]);
			toast({ title: 'Canvas Cleared', description: 'All nodes and edges have been removed.' });
			setIsSaved(false);
		}
	}, [toast]);

	// Export canvas as an image
	const exportAsImage = useCallback(
		async (type: 'png' | 'svg') => {
			if (!exportRef.current) { return; }

			try {
				const allElements = Array.from(
					exportRef.current.querySelectorAll<HTMLElement>('.node-container, .edge-container')
				);

				if (allElements.length === 0) {
					console.warn('No elements found to export. Ensure nodes and edges have proper classes.');
					toast({ title: 'Error', description: 'No elements to export.', variant: 'destructive' });
					return;
				}

				let minX = Infinity,
					minY = Infinity,
					maxX = -Infinity,
					maxY = -Infinity;

				allElements.forEach((element) => {
					const rect = element.getBoundingClientRect();
					const containerRect = exportRef.current!.getBoundingClientRect();

					const left = rect.left - containerRect.left + panOffset.x;
					const top = rect.top - containerRect.top + panOffset.y;
					const right = rect.right - containerRect.left + panOffset.x;
					const bottom = rect.bottom - containerRect.top + panOffset.y;

					minX = Math.min(minX, left);
					minY = Math.min(minY, top);
					maxX = Math.max(maxX, right);
					maxY = Math.max(maxY, bottom);
				});

				const padding = 20;
				minX -= padding;
				minY -= padding;
				maxX += padding;
				maxY += padding;

				const width = maxX - minX;
				const height = maxY - minY;

				const clone = exportRef.current.cloneNode(true) as HTMLElement;

				clone.style.position = 'absolute';
				clone.style.top = `${-minY}px`;
				clone.style.left = `${-minX}px`;

				const tempDiv = document.createElement('div');
				tempDiv.style.position = 'absolute';
				tempDiv.style.top = '0';
				tempDiv.style.left = '0';
				tempDiv.style.width = `${width}px`;
				tempDiv.style.height = `${height}px`;
				tempDiv.style.overflow = 'hidden';
				tempDiv.style.background = 'white';
				tempDiv.appendChild(clone);

				document.body.appendChild(tempDiv);

				await new Promise((resolve) => requestAnimationFrame(resolve));

				const dataUrl = type === 'png' ? await toPng(tempDiv) : await toSvg(tempDiv);

				const link = document.createElement('a');
				link.download = `flow-diagram.${type}`;
				link.href = dataUrl;
				link.click();

				document.body.removeChild(tempDiv);
			} catch (error) {
				console.error('Export Error:', error);
				toast({ title: 'Error', description: `Failed to export as ${type}.`, variant: 'destructive' });
			}
		},
		[toast, panOffset]
	);


	// Handle node dimension updates from CustomNode
	const handleNodeResize = useCallback(
		(id: string, width: number, height: number) => {
			setNodes((prevNodes) => {
				const updatedNodes = prevNodes.map((node) => (node.id === id ? { ...node, width, height } : node));

				if (connectionStart && connectionStart.nodeId === id && draggedEdge) {
					const node = updatedNodes.find((n) => n.id === id);
					if (node) {
						const sourcePort = calculatePortPosition(
							{ x: node.position.x, y: node.position.y, width: node.width, height: node.height },
							true
						);

						setDraggedEdge((prevDraggedEdge) => {
							if (!prevDraggedEdge) { return null; }
							if (
								prevDraggedEdge.sourceX === sourcePort.x &&
								prevDraggedEdge.sourceY === sourcePort.y
							) {
								return prevDraggedEdge;
							}

							return {
								...prevDraggedEdge,
								sourceX: sourcePort.x,
								sourceY: sourcePort.y,
								targetX: prevDraggedEdge.targetX,
								targetY: prevDraggedEdge.targetY,
							};
						});
					}
				}

				return updatedNodes;
			});
			setIsSaved(false);
		},
		[connectionStart, draggedEdge]
	);

	const handleNodeLabelChange = useCallback((id: string, newLabel: string) => {
		setNodes((prevNodes) =>
			prevNodes.map((node) =>
				node.id === id ? { ...node, data: { ...node.data, label: newLabel } } : node
			)
		);
		setIsSaved(false);
	}, []);

	const handleInputChange = useCallback((type: string, value: string) => {
		setGrammar(value);
		setIsSaved(false);
	}, []);

	const handleParseGrammar = useCallback(() => {
		try {
			setNodes([]);
			setEdges([]);

			if (grammar.trim().length === 0) {
				setParsingResult('No grammar provided');
				return;
			}

			setTimeout(() => {
				let grammarRules = grammar
					.split('\n')
					.map((line) => line.trim())
					.filter((line) => line.length > 0);

				grammarRules = [`$accept -> ${grammarRules[0].split(' ')[0]} $`, ...grammarRules];

				const grammarObj = new Grammar(grammarRules);
				grammarObj.buildAutomaton();

				const { nodes: parserNodes, edges: parserEdges } = grammarObj.getAutomatonData();
				const conflicts = grammarObj.detectConflicts();

				setNodes(
					parserNodes.map((node) => {
						const conflict = conflicts.find(
							(c) => c.state === parseInt(node.id.split('state-')[1])
						);
						return {
							...node,
							width: 150,
							height: 50,
							data: {
								...node.data,
								isEditing: false,
								conflictType: conflict?.type,
								conflictToken: conflict?.symbol,
							},
						};
					})
				);

				setEdges(
					parserEdges
						.map((edge) => {
							const sourceNode = parserNodes.find((n) => n.id === edge.source);
							const targetNode = parserNodes.find((n) => n.id === edge.target);

							if (!sourceNode || !targetNode) { return null; }

							const sourcePort = calculatePortPosition(
								{ x: sourceNode.position.x, y: sourceNode.position.y, width: sourceNode.width!, height: sourceNode.height! },
								true
							);
							const targetPort = calculatePortPosition(
								{ x: targetNode.position.x, y: targetNode.position.y, width: targetNode.width!, height: targetNode.height! },
								false
							);

							return {
								...edge,
								sourceX: sourcePort.x,
								sourceY: sourcePort.y,
								targetX: targetPort.x,
								targetY: targetPort.y,
								data: {
									label: edge.data?.label || 'Edge Label',
									onLabelChange: onEdgeLabelChange,
								},
							};
						})
						.filter((edge): edge is Edge => edge !== null)
				);

				setParsingResult(conflicts.length === 0 ? 'Parsing Successful!' : 'Conflict(s) Detected');
				setIsSaved(false);
			}, 0);
		} catch (error) {
			console.error('Error parsing grammar:', error);
			toast({
				title: 'Error',
				description: `Failed to parse grammar: ${(error as Error).message}`,
				variant: 'destructive',
			});
			setParsingResult(`Parsing Failed: ${(error as Error).message}`);
		}
	}, [grammar, onEdgeLabelChange, toast]);

	const onDeleteEdge = useCallback((id: string) => {
		setEdges((prevEdges) => prevEdges.filter((edge) => edge.id !== id));
		setIsSaved(false);
	}, []);

	// Recompute all edges whenever nodes change (positions or dimensions)
	useEffect(() => {
		const updatedEdges = edges.map((edge) => {
			const sourceNode = nodes.find((n) => n.id === edge.source);
			const targetNode = nodes.find((n) => n.id === edge.target);

			if (!sourceNode || !targetNode) { return edge; }

			const sourcePort = calculatePortPosition(
				{ x: sourceNode.position.x, y: sourceNode.position.y, width: sourceNode.width, height: sourceNode.height },
				true
			);
			const targetPort = calculatePortPosition(
				{ x: targetNode.position.x, y: targetNode.position.y, width: targetNode.width, height: targetNode.height },
				false
			);

			if (
				edge.sourceX === sourcePort.x &&
				edge.sourceY === sourcePort.y &&
				edge.targetX === targetPort.x &&
				edge.targetY === targetPort.y
			) {
				return edge;
			}

			return {
				...edge,
				sourceX: sourcePort.x,
				sourceY: sourcePort.y,
				targetX: targetPort.x,
				targetY: targetPort.y,
			};
		});

		const edgesChanged = updatedEdges.some((edge, index) => {
			const originalEdge = edges[index];
			return (
				edge.sourceX !== originalEdge.sourceX ||
				edge.sourceY !== originalEdge.sourceY ||
				edge.targetX !== originalEdge.targetX ||
				edge.targetY !== originalEdge.targetY
			);
		});

		if (edgesChanged) {
			setEdges(updatedEdges);
			setIsSaved(false);
		}
	}, [nodes, edges]);

	const handleSelectNode = useCallback((id: string) => {
		setSelectedNode((prevSelectedNode) => (prevSelectedNode === id ? null : id));
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Delete' || event.key === 'Backspace') {
				const findNode = nodes.find((node) => node.id === selectedNode);
				if (selectedNode && !findNode?.data.isEditing) {
					event.preventDefault();

					setNodes((prevNodes) => prevNodes.filter((node) => node.id !== selectedNode));

					setEdges((prevEdges) =>
						prevEdges.filter((edge) => edge.source !== selectedNode && edge.target !== selectedNode)
					);

					setSelectedNode(null);
					setIsSaved(false);

					toast({
						title: 'Node Deleted',
						description: `Node ${selectedNode} has been deleted.`,
						variant: 'default',
					});
				}
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [nodes, selectedNode, toast]);

	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (!isSaved && (nodes.length > 0 || edges.length > 0)) {
				e.preventDefault();
				return 'You have unsaved changes. Are you sure you want to leave?';
			}
			return undefined;
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, [isSaved, nodes, edges]);

	return (
		<div className="flex h-screen">
			<Sidebar
				onInputChange={ handleInputChange }
				onParseGrammar={ handleParseGrammar }
				grammar={ grammar }
				parsingResult={ parsingResult }
			/>
			<div
				className={ `flex-grow relative bg-gray-100 overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-default'
				}` }
				onClick={ handleCanvasClick }
				onMouseMove={ handleCanvasMouseMove }
				onDragOver={ onDragOver }
				onDrop={ onDrop }
				onMouseDown={ handleCanvasMouseDown }
			>
				{ /* Inner Container for Panning with exportRef */ }
				<div
					ref={ exportRef }
					className="absolute top-0 left-0 canvas-background"
					style={ {
						transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
						width: `${CANVAS_WIDTH}px`,
						height: `${CANVAS_HEIGHT}px`,
						position: 'relative',
					} }
				>
					{ /* SVG Container for Edges */ }
					<svg
						style={ {
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: '100%',
							pointerEvents: 'none',
							zIndex: 1,
						} }
						xmlns="http://www.w3.org/2000/svg"
					>
						<defs>
							<marker
								id="arrowhead"
								markerWidth="6"
								markerHeight="4.2"
								refX="6"
								refY="2.1"
								orient="auto"
							>
								<polygon points="0 0, 6 2.1, 0 4.2" fill="#b1b1b7" />
							</marker>
						</defs>

						{ /* Render Existing Edges */ }
						{ edges.map((edge) => (
							<CustomEdge key={ edge.id } edge={ edge } nodes={ nodes } selectedEdgeId={ selectedEdgeId } setSelectedEdgeId={ setSelectedEdgeId } onDeleteEdge={ onDeleteEdge } />
						)) }

						{ /* Render Dragged Edge */ }
						{ draggedEdge && <CustomEdge path={ draggedEdge } selectedEdgeId={ selectedEdgeId } setSelectedEdgeId={ setSelectedEdgeId } onDeleteEdge={ onDeleteEdge } /> }
					</svg>

					{ /* Render Nodes */ }
					{ nodes.map((node) => (
						<button
							key={ node.id }
							style={ {
								position: 'absolute',
								left: node.position.x,
								top: node.position.y,
								width: node.width,
								height: node.height,
								cursor: 'move',
								zIndex: 2,
								border: 'none',
								background: 'transparent',
								padding: 0,
							} }
							onMouseDown={ (event) => handleNodeDragStart(event, node.id) }
							onKeyDown={ (event) => {
								if (event.key === 'Enter' || event.key === ' ') {
									event.preventDefault();
									handleNodeDragStart(event as unknown as React.MouseEvent, node.id);
								}
							} }
							aria-label={ `Draggable node: ${node.data.label}` }
						>
							<CustomNode
								id={ node.id }
								data={ node.data }
								isConnectable
								selected={ selectedNode === node.id }
								onSelect={ handleSelectNode }
								onConnectStart={ handleConnectionStart }
								onConnectEnd={ handleConnectionEnd }
								isCreatingConnection={ !!connectionStart }
								isConnectionSource={ connectionStart?.nodeId === node.id }
								onResize={ handleNodeResize }
								onLabelChange={ handleNodeLabelChange }
							/>
						</button>
					)) }
				</div>

				{ /* Controls */ }
				<FlowControl
					saveFlow={ saveFlow }
					clearCanvas={ clearCanvas }
					exportAsImage={ exportAsImage }
					onRestore={ onRestore }
				/>
			</div>
		</div>
	);
};

export default FlowEditor;
