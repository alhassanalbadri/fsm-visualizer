// calculatePortPosition.ts
interface NodePosition {
	x: number;
	y: number;
	width: number;
	height: number;
  }
  
  export const calculatePortPosition = (node: NodePosition, isSource: boolean) => {
	if (isSource) {
	  // Output port at bottom-center
	  return {
		x: node.x + node.width / 2,
		y: node.y + node.height,
	  };
	} else {
	  // Input port at top-center
	  return {
		x: node.x + node.width / 2,
		y: node.y,
	  };
	}
  };
  