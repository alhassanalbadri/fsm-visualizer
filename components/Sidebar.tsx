import React from 'react'

const Sidebar = () => {
	const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
		event.dataTransfer.setData('application/reactflow', nodeType)
		event.dataTransfer.effectAllowed = 'move'
	}

	return (
		<aside className="w-64 p-4 bg-gray-100">
			<h2 className="text-lg font-bold mb-4">Add New State</h2>
			<div
				className="bg-white p-2 rounded shadow cursor-move"
				onDragStart={(event) => onDragStart(event, 'default')}
				draggable
			>
				New State
			</div>
		</aside>
	)
}

export default Sidebar
