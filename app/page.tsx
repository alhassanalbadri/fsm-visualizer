import FSMHandler from '@/components/FSMHandler'

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col">
			<div className="flex-grow">
				<FSMHandler />
			</div>
		</main>
	)
}
