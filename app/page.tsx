import FSMHandler from '@/components/FSMHandler'

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col">
			<header className="bg-gray-800 text-white p-4">
				<h1 className="text-2xl font-bold">FSM Handler</h1>
			</header>
			<div className="flex-grow">
				<FSMHandler />
			</div>
		</main>
	)
}
