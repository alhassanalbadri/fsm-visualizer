type Token = string;
type Production = Token[];
type Rule = {
	lhs: Token;
	rhs: Production;
};

type Conflict = {
	state: number;
	type: 'shift/reduce' | 'reduce/reduce';
	symbol: Token;
	rules: number[]; // Indices of conflicting rules
	intersection: Token[]; // Tokens in intersection of lookaheads
};
class Item {
	rule: Rule;
	dot: number;
	isClosure: boolean; // Flag to indicate if the item is a closure item

	constructor(rule: Rule, dot: number = 0, isClosure: boolean = false) {
		this.rule = rule;
		this.dot = dot;
		this.isClosure = isClosure;
	}

	toString(): string {
		const rhsWithDot = [...this.rule.rhs];
		rhsWithDot.splice(this.dot, 0, '↑');
		return `${this.rule.lhs} → ${rhsWithDot.join(' ')}`;
	}

	equals(other: Item): boolean {
		return (
			this.rule.lhs === other.rule.lhs &&
			this.rule.rhs.length === other.rule.rhs.length &&
			this.dot === other.dot &&
			this.rule.rhs.every((sym, idx) => sym === other.rule.rhs[idx]) &&
			this.isClosure === other.isClosure
		);
	}
}

/**
 * Represents a state in the LR(0) automaton.
 */
class State {
	items: Set<Item>;

	constructor(items?: Iterable<Item>) {
		this.items = new Set<Item>(items);
	}

	equals(other: State): boolean {
		if (this.items.size !== other.items.size) {return false;}
		for (const item of this.items) {
			let found = false;
			for (const otherItem of other.items) {
				if (item.equals(otherItem)) {
					found = true;
					break;
				}
			}
			if (!found) {return false;}
		}
		return true;
	}

	display(): void {
		for (const item of this.items) {
			const rhsWithDot = [...item.rule.rhs];
			rhsWithDot.splice(item.dot, 0, '↑');
		}
	}
}

/**
 * Represents the grammar and constructs the LR(0) automaton with conflict detection.
 */
class Grammar {
	rules: Rule[];
	startSymbol: Token;
	nonTerminals: Set<Token>;
	terminals: Set<Token>;
	states: State[];
	transitions: { from: number; to: number; symbol: Token; action: string }[];
	acceptState: number | null;

	firstSets: Map<Token, Set<Token>> = new Map();
	followSets: Map<Token, Set<Token>> = new Map();

	constructor(rules: string[]) {
		if (rules.length === 0) {
			throw new Error('At least one rule must be provided.');
		}

		this.rules = this.parseRules(rules);
		this.startSymbol = this.rules[0].lhs;
		this.nonTerminals = this.extractNonTerminals();
		this.terminals = this.extractTerminals();
		this.states = [];
		this.transitions = [];
		this.acceptState = null;

		// Compute First and Follow sets
		this.computeFirstSets();
		this.computeFollowSets();
	}

	private parseRules(rules: string[]): Rule[] {
		return rules.map(ruleStr => {
			const [lhs, rhs] = ruleStr.split('->').map(part => part.trim());
			if (!lhs || !rhs) {
				throw new Error(`Invalid rule format: "${ruleStr}". Expected format "A → B C".`);
			}
			const rhsSymbols = rhs.split(/\s+/);
			return { lhs, rhs: rhsSymbols };
		});
	}

	private extractNonTerminals(): Set<Token> {
		const nonTerminals = new Set<Token>();
		for (const rule of this.rules) {
			nonTerminals.add(rule.lhs);
		}
		return nonTerminals;
	}

	private extractTerminals(): Set<Token> {
		const terminals = new Set<Token>();
		for (const rule of this.rules) {
			for (const symbol of rule.rhs) {
				if (!this.nonTerminals.has(symbol)) {
					terminals.add(symbol);
				}
			}
		}
		return terminals;
	}

	/**
	 * Computes the First sets for all symbols.
	 */
	private computeFirstSets(): void {
		// Initialize First sets
		for (const symbol of this.nonTerminals) {
			this.firstSets.set(symbol, new Set<Token>());
		}
		for (const terminal of this.terminals) {
			this.firstSets.set(terminal, new Set<Token>([terminal]));
		}

		let changed = true;
		while (changed) {
			changed = false;
			for (const rule of this.rules) {
				const lhs = rule.lhs;
				const rhs = rule.rhs;

				const firstSet = this.firstSets.get(lhs)!;

				let i = 0;
				let nullable = true;
				while (i < rhs.length && nullable) {
					const sym = rhs[i];
					const symFirst = this.firstSets.get(sym);
					if (!symFirst) {break;} // Should not happen

					const beforeSize = firstSet.size;
					for (const token of symFirst) {
						if (token !== 'ε') {
							firstSet.add(token);
						}
					}
					const afterSize = firstSet.size;
					if (afterSize > beforeSize) {
						changed = true;
					}

					if (!symFirst.has('ε')) {
						nullable = false;
					}
					i++;
				}
				if (nullable) {
					const beforeSize = firstSet.size;
					firstSet.add('ε');
					const afterSize = firstSet.size;
					if (afterSize > beforeSize) {
						changed = true;
					}
				}
			}
		}
	}

	/**
	 * Computes the Follow sets for all non-terminals.
	 */
	private computeFollowSets(): void {
		// Initialize Follow sets
		for (const symbol of this.nonTerminals) {
			this.followSets.set(symbol, new Set<Token>());
		}
		// Add $end to Follow(start symbol)
		this.followSets.get(this.startSymbol)!.add('$end');

		let changed = true;
		while (changed) {
			changed = false;
			for (const rule of this.rules) {
				const lhs = rule.lhs;
				const rhs = rule.rhs;

				for (let i = 0; i < rhs.length; i++) {
					const B = rhs[i];
					if (!this.nonTerminals.has(B)) {continue;}

					const followB = this.followSets.get(B)!;

					// Look at the symbols after B in rhs
					let j = i + 1;
					let nullable = true;
					while (j < rhs.length && nullable) {
						const C = rhs[j];
						const firstC = this.firstSets.get(C);
						if (!firstC) {break;}

						const beforeSize = followB.size;
						for (const token of firstC) {
							if (token !== 'ε') {
								followB.add(token);
							}
						}
						const afterSize = followB.size;
						if (afterSize > beforeSize) {
							changed = true;
						}

						if (!firstC.has('ε')) {
							nullable = false;
						}
						j++;
					}

					if (nullable || j === rhs.length) {
						// Add Follow(lhs) to Follow(B)
						const followLHS = this.followSets.get(lhs)!;
						const beforeSize = followB.size;
						for (const token of followLHS) {
							followB.add(token);
						}
						const afterSize = followB.size;
						if (afterSize > beforeSize) {
							changed = true;
						}
					}
				}
			}
		}
	}

	/**
	 * Computes the closure of a set of items.
	 */
	private closure(items: Set<Item>): Set<Item> {
		const closureSet = new Set<Item>(items);
		let added = true;

		while (added) {
			added = false;
			for (const item of Array.from(closureSet)) {
				const nextSymbol = item.rule.rhs[item.dot];
				if (nextSymbol && this.nonTerminals.has(nextSymbol)) {
					for (const rule of this.rules.filter(r => r.lhs === nextSymbol)) {
						const newItem = new Item(rule, 0, true); // Mark as closure item
						if (!this.containsItem(closureSet, newItem)) {
							closureSet.add(newItem);
							added = true;
						}
					}
				}
			}
		}

		return closureSet;
	}

	/**
	 * Checks if a set of items contains a specific item.
	 */
	private containsItem(items: Set<Item>, item: Item): boolean {
		for (const existingItem of items) {
			if (existingItem.equals(item)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Computes the GOTO function for a given state and symbol.
	 */
	private goto(state: State, symbol: Token): State {
		const movedItems = new Set<Item>();
		for (const item of state.items) {
			const nextSymbol = item.rule.rhs[item.dot];
			if (nextSymbol === symbol) {
				const movedItem = new Item(item.rule, item.dot + 1, false); // Main item
				movedItems.add(movedItem);
			}
		}
		const closureSet = this.closure(movedItems);
		return new State(closureSet);
	}

	/**
	 * Builds the LR(0) automaton by constructing all states and transitions.
	 */
	buildAutomaton(): void {
		const initialItem = new Item(this.rules[0], 0, false); // Start with the first rule as main item
		const initialState = new State(new Set<Item>([initialItem]));
		const closureInitial = this.closure(initialState.items);
		initialState.items = closureInitial;

		this.states.push(initialState);
		const stateQueue: State[] = [initialState];

		while (stateQueue.length > 0) {
			const currentState = stateQueue.shift()!;
			const currentIndex = this.states.indexOf(currentState);

			// Collect all symbols that appear immediately after a dot
			const symbols: Set<Token> = new Set<Token>();
			for (const item of currentState.items) {
				const nextSymbol = item.rule.rhs[item.dot];
				if (nextSymbol) {
					symbols.add(nextSymbol);
				}
			}

			for (const symbol of symbols) {
				const nextState = this.goto(currentState, symbol);

				// Check if the state already exists
				let existingStateIndex = this.states.findIndex(state => state.equals(nextState));

				if (existingStateIndex === -1) {
					// New state found
					this.states.push(nextState);
					stateQueue.push(nextState);
					existingStateIndex = this.states.length - 1;
				}

				// Determine action type
				const actionType = this.terminals.has(symbol) ? 'shift' : 'goto';

				// Record the transition
				this.transitions.push({
					from: currentIndex,
					to: existingStateIndex,
					symbol: symbol,
					action: actionType,
				});
			}
		}

		// Identify the accept state
		for (let i = 0; i < this.states.length; i++) {
			for (const item of this.states[i].items) {
				if (
					item.rule.lhs === '$accept' &&
					item.dot === item.rule.rhs.length
				) {
					this.acceptState = i;
					break;
				}
			}
			if (this.acceptState !== null) {break;}
		}
	}

	/**
	 * Computes the intersection of multiple sets.
	 */
	private setIntersection(sets: Set<Token>[]): Set<Token> {
		if (sets.length === 0) {return new Set();}
		let intersection = new Set(sets[0]);
		for (const s of sets.slice(1)) {
			intersection = new Set([...intersection].filter(x => s.has(x)));
		}
		return intersection;
	}

	/**
	 * Detects conflicts in the LR(0) automaton.
	 * Returns an array of conflicts with details.
	 */
	detectConflicts(): Conflict[] {
		const conflicts: Conflict[] = [];

		for (let i = 0; i < this.states.length; i++) {
			const state = this.states[i];
			const stateIndex = i;

			// Collect all shift actions and reduce actions
			const shiftActions: Map<Token, number> = new Map(); // symbol → state to shift
			const reduceActions: Map<Token, number[]> = new Map(); // symbol → [rule indices]

			for (const item of state.items) {
				if (item.dot === item.rule.rhs.length) { // Completed item
					const ruleIndex = this.rules.findIndex(rule =>
						rule.lhs === item.rule.lhs &&
						rule.rhs.length === item.rule.rhs.length &&
						rule.rhs.every((sym, idx) => sym === item.rule.rhs[idx])
					);

					if (item.rule.lhs === '$accept') {
						// Accept action
						// For simplicity, not handling accept action as a conflict
						continue;
					}

					// Get the Follow set of the rule's LHS
					const followSet = this.followSets.get(item.rule.lhs)!;

					// For each terminal in the Follow set, add a reduce action
					for (const terminal of followSet) {
						if (!reduceActions.has(terminal)) {
							reduceActions.set(terminal, []);
						}
						reduceActions.get(terminal)!.push(ruleIndex);
					}
				} else { // Active item
					const nextSymbol = item.rule.rhs[item.dot];
					if (this.terminals.has(nextSymbol)) {
						// Shift action
						const transition = this.transitions.find(t => t.from === i && t.symbol === nextSymbol && t.action === 'shift');
						if (transition) {
							shiftActions.set(nextSymbol, transition.to);
						}
					}
				}
			}

			// Now check for shift/reduce
			for (const [symbol] of shiftActions.entries()) {
				if (reduceActions.has(symbol)) {
					// Shift/Reduce conflict on 'symbol'
					const reducingRuleIndices = reduceActions.get(symbol)!;

					// For each reduce rule, check if 'symbol' is in its Follow set
					const intersectingRules = reducingRuleIndices.filter(ruleIndex => {
						const rule = this.rules[ruleIndex];
						return this.followSets.get(rule.lhs)!.has(symbol);
					});

					if (intersectingRules.length > 0) {
						conflicts.push({
							state: stateIndex,
							type: 'shift/reduce',
							symbol: symbol,
							rules: [...intersectingRules],
							intersection: [symbol],
						});
					}
				}
			}

			// Check for reduce/reduce conflicts
			for (const [symbol, reducingRuleIndices] of reduceActions.entries()) {
				if (reducingRuleIndices.length > 1) {
					// Reduce/Reduce conflict on 'symbol'
					// Find intersection of Follow sets of all involved rules
					const followSetsList = reducingRuleIndices.map(ruleIndex => {
						const rule = this.rules[ruleIndex];
						return this.followSets.get(rule.lhs)!;
					});
					const intersectionSet = this.setIntersection(followSetsList);

					if (intersectionSet.size > 0) {
						conflicts.push({
							state: stateIndex,
							type: 'reduce/reduce',
							symbol: symbol,
							rules: [...reducingRuleIndices],
							intersection: Array.from(intersectionSet),
						});
					}
				}
			}
		}

		return conflicts;
	}

	getAutomatonData() {
		const NODE_SPACING_X = 400; // Base horizontal spacing
		const NODE_SPACING_Y = 400; // Vertical spacing between layers
		const CANVAS_WIDTH = 10000;
		const CANVAS_HEIGHT = 10000;
		const CANVAS_CENTER_X = CANVAS_WIDTH / 2;
		const CANVAS_CENTER_Y = CANVAS_HEIGHT / 2;

		const layers: number[][] = [];
		const visited = new Set<number>();
		const queue: { id: number; layer: number }[] = [{ id: 0, layer: 0 }];

		while (queue.length > 0) {
			const { id, layer } = queue.shift()!;

			if (visited.has(id)) {continue;}
			visited.add(id);

			if (!layers[layer]) {layers[layer] = [];}
			layers[layer].push(id);

			this.transitions
				.filter((transition) => transition.from === id)
				.forEach((transition) => {
					if (!visited.has(transition.to)) {
						queue.push({ id: transition.to, layer: layer + 1 });
					}
				});
		}

		interface FlowNode {
			id: string;
			type: string;
			position: { x: number; y: number };
			data: { label: string };
			height?: number;
			width?: number;
		}



		const nodes: FlowNode[] = [];
		const totalLayers = layers.length;
		const totalHeight = (totalLayers - 1) * NODE_SPACING_Y;
		const initialYOffset = CANVAS_CENTER_Y - totalHeight / 2;

		layers.forEach((layer, layerIndex) => {
			const numberOfNodes = layer.length;
			const totalLayerWidth = (numberOfNodes - 1) * NODE_SPACING_X;
			const startX = CANVAS_CENTER_X - totalLayerWidth / 2;

			layer.forEach((stateIndex, nodeIndex) => {
				const label = Array.from(this.states[stateIndex].items)
					.map((item) => item.toString())
					.join('\n');

				nodes.push({
					id: `state-${stateIndex}`,
					type: 'custom',
					position: {
						x: startX + nodeIndex * NODE_SPACING_X,
						y: initialYOffset + layerIndex * NODE_SPACING_Y,
					},
					data: {
						label: label || 'New State', // Provide a default label if empty
					},
				});
			});
		});


		const edges = this.transitions.map((transition, index) => ({
			id: `edge-${index}`,
			source: `state-${transition.from}`,
			target: `state-${transition.to}`,
			data: { label: transition.symbol },
			type: 'custom',
		}));

		return { nodes, edges };
	}


}

export { Grammar };
