"use client";

import React, { useState, useCallback, useRef } from 'react'
import ReactFlow, {
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
} from 'reactflow'
import 'reactflow/dist/style.css'
import CustomNode from './CustomNode'
import CustomEdge from './CustomEdge'
import Sidebar from './Sidebar'

const nodeTypes = {
	custom: CustomNode,
}

const edgeTypes = {
	custom: CustomEdge,
}

const initialNodes: Node[] = [
	{ id: '1', type: 'custom', position: { x: 250, y: 5 }, data: { label: 'Start' } },
]

const initialEdges: Edge[] = []

export default function FSMHandler() {
	const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
	const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
	const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
	const reactFlowWrapper = useRef<HTMLDivElement>(null)
	const [connectionParams, setConnectionParams] = useState<OnConnectStartParams | null>(null)

	const onConnect = useCallback(
		(params: Edge | Connection) => {
			setEdges((eds) =>
				addEdge(
					{
						...params,
						type: 'custom',
						markerEnd: { type: MarkerType.ArrowClosed },
					},
					eds
				)
			)
		},
		[setEdges]
	)

	const onConnectStart = useCallback((_: unknown, params: OnConnectStartParams) => {
		setConnectionParams(params)
	}, [])

	const onConnectEnd = useCallback(
		(event: MouseEvent | TouchEvent) => {
			if (!connectionParams) return

			const targetNode = (event.target as Element).closest('.react-flow__node')
			if (targetNode) {
				const targetId = targetNode.getAttribute('data-id')
				if (targetId && targetId !== connectionParams.nodeId) {
					setEdges((eds) =>
						addEdge(
							{
								id: `edge-${eds.length + 1}`,
								source: connectionParams.nodeId!,
								target: targetId,
								type: 'custom',
								markerEnd: { type: MarkerType.ArrowClosed },
							},
							eds
						)
					)
				}
			}
			setConnectionParams(null)
		},
		[connectionParams, setEdges]
	)

	const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault()
		event.dataTransfer.dropEffect = 'move'
	}, [])

	const findMaxId = (arr: Node[]) => {
		return arr.reduce((max, obj) => {
			const id = parseInt(obj.id.split('-')[1]);
			return id > max ? id : max;
		}, 0);
	}

	const onDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault()

			if (reactFlowWrapper.current && reactFlowInstance) {
				const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
				const position = reactFlowInstance.project({
					x: event.clientX - reactFlowBounds.left,
					y: event.clientY - reactFlowBounds.top,
				})
				const maxId = findMaxId(nodes);
				
				const newNode: Node = {
					id: `node-${maxId + 1}`,
					type: 'custom',
					position,
					data: { label: `State ${maxId + 1}` },
				}

				setNodes((nds) => nds.concat(newNode))
			}
		},
		[reactFlowInstance, nodes, setNodes]
	)
	

	return (
		<div className="flex h-screen">
			<Sidebar />
			<div className="flex-grow" ref={reactFlowWrapper}>
				<ReactFlow
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
				>
					<Background />
					<Controls />
				</ReactFlow>
			</div>
		</div>
	)
}
