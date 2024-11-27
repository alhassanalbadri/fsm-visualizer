import './globals.css'
import { ReactNode } from 'react';
import { Toaster } from "@/components/ui/toaster"

export const metadata = {
	title: 'FSM Handler',
	description: 'A lightweight, intuitive web-based tool for creating and managing finite state machines (FSMs)',
}


export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<head />
			<body>
				<main>{children}</main>
				<Toaster />
			</body>
		</html>
	)
}