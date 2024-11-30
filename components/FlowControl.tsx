import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Save, RotateCcw, Trash2, Download, MoreHorizontal } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface StyledFlowControlsProps {
	saveFlow: () => void;
	onRestore: (flow: { nodes: any[], edges: any[] }) => void;
	clearCanvas: () => void;
	exportAsImage: (type: "png" | "svg") => void;
}

export default function StyledFlowControls({ saveFlow, onRestore, clearCanvas, exportAsImage }: StyledFlowControlsProps) {
	const { toast } = useToast();
	const [isOpen, setIsOpen] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleRestoreClick = () => {
		fileInputRef.current?.click()
	}

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (!file) return

		const reader = new FileReader()
		reader.onload = (e) => {
			try {
				const flow = JSON.parse(e.target?.result as string)
				onRestore(flow)
			} catch (error) {
				console.error("Error parsing file:", error)
				toast({
					title: "Error",
					description: "The file you uploaded is not a valid flow file.",
					variant: "destructive"
				})
			}
		}
		reader.readAsText(file)
	}

	return (
		<TooltipProvider>
			<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-primary text-primary-foreground rounded-full shadow-lg p-1">
				<Tooltip>
					<TooltipTrigger asChild>
						<Button size="icon" variant="ghost" className="rounded-full hover:bg-primary-foreground hover:text-primary" onClick={saveFlow}>
							<Save className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Save Flow</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button size="icon" variant="ghost" className="rounded-full hover:bg-primary-foreground hover:text-primary" onClick={handleRestoreClick}>
							<RotateCcw className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Restore Flow</TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button size="icon" variant="ghost" className="rounded-full hover:bg-primary-foreground hover:text-primary" onClick={clearCanvas}>
							<Trash2 className="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Clear Canvas</TooltipContent>
				</Tooltip>

				<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
					<Tooltip>
						<TooltipTrigger asChild>
							<DropdownMenuTrigger asChild>
								<Button size="icon" variant="ghost" className="rounded-full hover:bg-primary-foreground hover:text-primary">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
						</TooltipTrigger>
						<TooltipContent>Export Options</TooltipContent>
					</Tooltip>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => exportAsImage("png")}>
							Export as PNG
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => exportAsImage("svg")}>
							Export as SVG
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<input
				type="file"
				ref={fileInputRef}
				className="hidden"
				accept="application/json"
				onChange={handleFileChange}
			/>
		</TooltipProvider>
	)
}
