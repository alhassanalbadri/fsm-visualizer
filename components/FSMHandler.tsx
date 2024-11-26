"use client";

import React, { useState, useCallback, useRef } from 'react';
import {
	ReactFlow,
	Node,
	Edge,
	Connection,
	addEdge,
	Background,
	Controls,
	useNodesState,
	useEdgesState,
	ReactFlowInstance,
	MarkerType,
	OnConnectStartParams,
	Panel,
	OnConnectEnd,
	useReactFlow,
	ReactFlowProvider,
	getNodesBounds,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import CustomEdge from './CustomEdge';
import Sidebar from './Sidebar';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Download, Upload, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toPng, toSvg } from 'html-to-image';

const nodeTypes = {
	custom: CustomNode,
};

const edgeTypes = {
	custom: CustomEdge,
};

const initialNodes: Node[] = [
	{
		id: '1',
		type: 'custom',
		position: { x: 250, y: 5 },
		data: { label: 'Start' },
	},
];

const initialEdges: Edge[] = [];

const FSMHandler = () => {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
	const [reactFlowInstance, setReactFlowInstance] =
		useState<ReactFlowInstance | null>(null);
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const reactFlowRef = useRef<HTMLDivElement>(null);
	const [connectionParams, setConnectionParams] =
		useState<OnConnectStartParams | null>(null);
	const { toast } = useToast();

	const { getNodes, screenToFlowPosition } = useReactFlow();

	const onConnect = useCallback(
		(params: Edge | Connection) => {
			setEdges((eds) =>
				addEdge(
					{
						...params,
						id: uuidv4(),
						type: 'custom',
						markerEnd: { type: MarkerType.ArrowClosed },
						data: { label: 'New Transition' },
					},
					eds
				)
			);
		},
		[setEdges]
	);

	const onConnectStart = useCallback(
		(_: unknown, params: OnConnectStartParams) => {
			setConnectionParams(params);
		},
		[]
	);

	const onConnectEnd: OnConnectEnd = useCallback(
		(event) => {
			if (!connectionParams) return;

			const targetNode = (event.target as Element).closest('.react-flow__node');
			if (targetNode) {
				const targetId = targetNode.getAttribute('data-id');
				if (targetId && targetId !== connectionParams.nodeId) {
					setEdges((eds) =>
						addEdge(
							{
								id: uuidv4(),
								source: connectionParams.nodeId!,
								target: targetId,
								type: 'custom',
								markerEnd: { type: MarkerType.ArrowClosed },
								data: { label: 'New Transition' },
							},
							eds
						)
					);
				}
			}
			setConnectionParams(null);
		},
		[connectionParams, setEdges]
	);

	const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = 'move';
	}, []);

	const onDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();

			const position = screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			const newNode: Node = {
				id: uuidv4(),
				type: 'custom',
				position,
				data: { label: `New State` },
			};

			setNodes((nds) => nds.concat(newNode));
		},
		[screenToFlowPosition, setNodes]
	);

	const onSave = useCallback(() => {
		if (reactFlowInstance) {
			const flow = reactFlowInstance.toObject();
			const json = JSON.stringify(flow);
			const blob = new Blob([json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = 'fsm-flow.json';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			toast({
				title: 'FSM Saved',
				description: 'Your FSM has been saved successfully.',
			});
		}
	}, [reactFlowInstance, toast]);

	const onRestore = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (e) => {
					try {
						const flow = JSON.parse(e.target?.result as string);
						if (flow) {
							setNodes(flow.nodes || []);
							setEdges(flow.edges || []);
							toast({
								title: 'FSM Restored',
								description: 'Your FSM has been restored successfully.',
							});
						}
					} catch (error) {
						console.error('Error parsing JSON:', error);
						toast({
							title: 'Error',
							description: 'Failed to restore FSM. Invalid file format.',
							variant: 'destructive',
						});
					}
				};
				reader.readAsText(file);
			}
		},
		[setNodes, setEdges, toast]
	);

	const onClear = useCallback(() => {
		const confirmed = window.confirm(
			'Are you sure you want to clear the canvas?'
		);
		if (confirmed) {
			setNodes([]);
			setEdges([]);
			toast({
				title: 'Canvas Cleared',
				description: 'All nodes and edges have been removed.',
			});
		}
	}, [setNodes, setEdges, toast]);


	const exportImage = useCallback(
		async (type: 'png' | 'svg') => {
			if (!reactFlowInstance) return;

			const nodesBounds = getNodesBounds(getNodes());
			const imageWidth = 1920;
			const imageHeight = 1080;

			const reactFlowElement = reactFlowRef.current?.querySelector(
				'.react-flow__viewport'
			);

			if (!reactFlowElement) {
				toast({
					title: 'Error',
					description: 'Failed to locate the diagram for export.',
					variant: 'destructive',
				});
				return;
			}

			// Calculate scale to fit content with padding
			const padding = 100;
			const xScale = (imageWidth - padding * 2) / nodesBounds.width;
			const yScale = (imageHeight - padding * 2) / nodesBounds.height;
			const scale = Math.min(xScale, yScale, 1.5);

			const centerX = (imageWidth - nodesBounds.width * scale) / 2 - nodesBounds.x * scale;
			const centerY = (imageHeight - nodesBounds.height * scale) / 2 - nodesBounds.y * scale;


			const exportOptions = {
				backgroundColor: '#ffffff',
				width: imageWidth,
				height: imageHeight,
				style: {
					width: `${imageWidth}px`,
					height: `${imageHeight}px`,
					transform: `translate(${centerX}px, ${centerY}px) scale(${scale})`,
				},
			};

			try {
				const dataUrl =
					type === 'png'
						? await toPng(reactFlowElement as HTMLElement, exportOptions)
						: await toSvg(reactFlowElement as HTMLElement, exportOptions);

				const link = document.createElement('a');
				link.download = `fsm-diagram.${type}`;
				link.href = dataUrl;
				link.click();
			} catch (error) {
				console.error(`Error exporting to ${type.toUpperCase()}:`, error);
				toast({
					title: 'Error',
					description: `Failed to export as ${type.toUpperCase()}.`,
					variant: 'destructive',
				});
				}
			},
			[getNodes, reactFlowInstance, toast]
		);

	const exportToPNG = useCallback(() => exportImage('png'), [exportImage]);
	const exportToSVG = useCallback(() => exportImage('svg'), [exportImage]);

	return (
		<div className="flex h-screen">
			<Sidebar />
			<div className="flex-grow relative" ref={reactFlowWrapper}>
				<ReactFlow
					ref={reactFlowRef}
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onConnectStart={onConnectStart}
					onConnectEnd={onConnectEnd}
					onInit={setReactFlowInstance}
					onDrop={onDrop}
					onDragOver={onDragOver}
					nodeTypes={nodeTypes}
					edgeTypes={edgeTypes}
					fitView
					attributionPosition="top-right"
				>
					<Background color="#aaa" gap={16} />
					<Controls />
					<Panel position="top-right" className="flex gap-2">
						<Button onClick={onSave} className="flex items-center gap-2">
							<Download size={16} />
							Save
						</Button>
						<Button onClick={exportToPNG} className="flex items-center gap-2">
							Export as PNG
						</Button>
						<Button onClick={exportToSVG} className="flex items-center gap-2">
							Export as SVG
						</Button>
						<label htmlFor="restore" className="cursor-pointer">
							<Button asChild className="flex items-center gap-2">
								<span>
									<Upload size={16} />
									Restore
								</span>
							</Button>
						</label>
						<input
							id="restore"
							type="file"
							onChange={onRestore}
							className="hidden"
							accept=".json"
						/>
						<Button
							onClick={onClear}
							variant="destructive"
							className="flex items-center gap-2"
						>
							<Trash2 size={16} />
							Clear
						</Button>
					</Panel>
				</ReactFlow>
			</div>
		</div>
	);
};

function FlowWithProvider() {
	return (
		<ReactFlowProvider>
			<FSMHandler />
		</ReactFlowProvider>
	);
}

export default FlowWithProvider;
