/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
'use client';

import { Github, Linkedin, Mail } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
	CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

const Sidebar = ({
	onParseGrammar,
	onInputChange,
	grammar,
	parsingResult,
}: {
	onParseGrammar: () => void;
	onInputChange: (type: string, value: string) => void;
	grammar: string;
	parsingResult: string | null;
}) => {
	const onDragStart = (
		event: React.DragEvent<HTMLButtonElement>,
		nodeType: string
	) => {
		event.dataTransfer.setData('application/fsmflow', nodeType);
		event.dataTransfer.effectAllowed = 'move';
	};

	return (
		<aside
			className="fixed top-0 left-0 w-80 h-full bg-background border-r p-6 shadow-lg z-50 flex flex-col"
			aria-label="Sidebar"
		>
			<div className="flex-1 overflow-y-auto">
				<h1 className="text-2xl font-bold mb-6">FSM Visualizer</h1>

				<Tabs defaultValue="add-state" className="mb-6">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="add-state">Add State</TabsTrigger>
						<TabsTrigger value="parse-grammar">Parse Grammar</TabsTrigger>
					</TabsList>
					<TabsContent value="add-state">
						<Card>
							<CardHeader>
								<CardTitle>Add New State</CardTitle>
								<CardDescription>
									Drag the button below to add a new state to your diagram.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="outline"
												className="w-full cursor-move"
												onDragStart={ (event) => onDragStart(event, 'default') }
												draggable
											>
												Drag to Add State
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Drag this to the canvas to create a new state</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</CardContent>
						</Card>
					</TabsContent>
					<TabsContent value="parse-grammar">
						<Card>
							<CardHeader>
								<CardTitle>Grammar Parser</CardTitle>
								<CardDescription>
									Enter grammar rules to parse and visualize.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Textarea
									placeholder="Enter grammar rules"
									value={ grammar }
									onChange={ (e) => onInputChange('grammar', e.target.value) }
									className="mb-3"
								/>
								<Button onClick={ onParseGrammar } className="w-full">
									Parse Grammar
								</Button>
								{ parsingResult && (
									<div className="mt-4 p-3 bg-muted rounded-md">
										<h3 className="text-sm font-semibold mb-2">Parsing Result</h3>
										<pre className="text-xs whitespace-pre-wrap">
											{ parsingResult }
										</pre>
									</div>
								) }
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>

			<div className="absolute bottom-0 left-0 w-full p-6 bg-background border-t">
				<Card>
					<CardHeader>
						<CardTitle>Contact Me</CardTitle>
						<CardDescription>
							Have questions or feedback? Feel free to reach out!
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex justify-center items-center space-x-6">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<a
											href="https://github.com/alhassanalbadri/fsm-visualizer"
											target="_blank"
											rel="noopener noreferrer"
											className="text-muted-foreground hover:text-primary"
										>
											<Github className="h-6 w-6" />
										</a>
									</TooltipTrigger>
									<TooltipContent>
										<p>View project on GitHub</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<a
											href="https://www.linkedin.com/in/alhassan-albadri/"
											target="_blank"
											rel="noopener noreferrer"
											className="text-muted-foreground hover:text-primary"
										>
											<Linkedin className="h-6 w-6" />
										</a>
									</TooltipTrigger>
									<TooltipContent>
										<p>Connect on LinkedIn</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<a
											href="mailto:alhassanraad15@gmail.com"
											target="_blank"
											rel="noopener noreferrer"
											className="text-muted-foreground hover:text-primary"
										>
											<Mail className="h-6 w-6" />
										</a>
									</TooltipTrigger>
									<TooltipContent>
										<p>Send an email</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					</CardContent>
				</Card>
			</div>
		</aside>
	);
};

export default Sidebar;
