import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { calculatePortPosition } from '../app/utils/calculatePortPosition';

export const useFlowElements = (initialNodes: any[], initialEdges: any[]) => {
	const [nodes, setNodes] = useState<any[]>(initialNodes);
	const [edges, setEdges] = useState<any[]>(initialEdges);

	const addNode = useCallback((position: { x: number; y: number }) => {
		const newNode: any = {
			id: uuidv4(),
			type: 'custom',
			position,
			data: { label: 'New State', isEditing: false },
			width: 150,
			height: 50,
		};
		setNodes(prev => [...prev, newNode]);
	}, []);

	const updateNodePosition = useCallback((id: string, position: { x: number; y: number }) => {
		setNodes(prev => prev.map(node => node.id === id ? { ...node, position } : node));
	}, []);

	const updateNodeDimensions = useCallback((id: string, width: number, height: number) => {
		setNodes(prev => prev.map(node => node.id === id ? { ...node, width, height } : node));
	}, []);

	const updateNodeLabel = useCallback((id: string, label: string) => {
		setNodes(prev => prev.map(node => node.id === id ? { ...node, data: { ...node.data, label } } : node));
	}, []);

	const addEdge = useCallback((source: string, target: string) => {
		const sourceNode = nodes.find(node => node.id === source);
		const targetNode = nodes.find(node => node.id === target);

		if (sourceNode && targetNode) {
			const sourcePort = calculatePortPosition(sourceNode, true);
			const targetPort = calculatePortPosition(targetNode, false);

			const newEdge: any = {
				id: uuidv4(),
				source,
				target,
				sourceX: sourcePort.x,
				sourceY: sourcePort.y,
				targetX: targetPort.x,
				targetY: targetPort.y,
				type: 'custom',
				data: { label: 'New Edge', onLabelChange: () => { } },
			};

			setEdges(prev => [...prev, newEdge]);
		}
	}, [nodes]);

	const updateEdgeLabel = useCallback((id: string, label: string) => {
		setEdges(prev => prev.map(edge => edge.id === id ? { ...edge, data: { ...edge.data, label } } : edge));
	}, []);

	const removeNode = useCallback((id: string) => {
		setNodes(prev => prev.filter(node => node.id !== id));
		setEdges(prev => prev.filter(edge => edge.source !== id && edge.target !== id));
	}, []);

	return {
		nodes,
		edges,
		addNode,
		updateNodePosition,
		updateNodeDimensions,
		updateNodeLabel,
		addEdge,
		updateEdgeLabel,
		removeNode,
	};
};
