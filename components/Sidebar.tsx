import React from 'react';

const Sidebar = () => {
	const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
		event.dataTransfer.setData('application/reactflow', nodeType);
		event.dataTransfer.effectAllowed = 'move';
	};

	return (
		<aside className="w-64 p-4 bg-gray-100 flex flex-col justify-between h-full">
			<div>
				<h1 className="text-2xl font-extrabold text-gray-800 mb-6">FSMVisualizer</h1>
				<h2 className="text-lg font-bold mb-4">Add New State</h2>
				<div
					className="bg-white p-2 rounded shadow cursor-move"
					onDragStart={(event) => onDragStart(event, 'default')}
					draggable
				>
					New State
				</div>
			</div>

			<div className="mt-6 border-t pt-4">
				<h2 className="text-lg font-bold mb-2">Contact Me</h2>
				<p className="text-sm text-gray-600 mb-4">
					Have questions or feedback? Feel free to reach out!
				</p>
				<div className="flex items-center gap-4">
					<a
						href="mailto:alhassanraad15@gmail.com"
						className="text-blue-600 hover:underline text-sm"
					>
						alhassanraad15@gmail.com
					</a>

					<a
						href="https://github.com/alhassanalbadri/fsm-visualizer"
						target="_blank"
						rel="noopener noreferrer"
						className="text-gray-800 hover:text-gray-600"
						aria-label="GitHub"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="w-6 h-6"
						>
							<path
								fillRule="evenodd"
								d="M12 2a10 10 0 00-3.16 19.48c.5.09.68-.22.68-.48v-1.7c-2.77.6-3.36-1.33-3.36-1.33-.45-1.13-1.1-1.43-1.1-1.43-.9-.62.07-.6.07-.6 1 .08 1.53 1.03 1.53 1.03.88 1.5 2.32 1.07 2.88.82.09-.64.35-1.07.63-1.31-2.22-.25-4.56-1.11-4.56-4.93 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.47 9.47 0 0112 6.8c.85.004 1.7.114 2.5.336 1.9-1.3 2.74-1.02 2.74-1.02.55 1.37.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.83-2.35 4.68-4.58 4.92.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0012 2z"
								clipRule="evenodd"
							/>
						</svg>
					</a>
				</div>
			</div>
		</aside>
	);
};

export default Sidebar;
