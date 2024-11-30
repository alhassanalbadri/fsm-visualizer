import React, { useState } from 'react';

interface GrammarInputProps {
	// eslint-disable-next-line no-unused-vars
	onParse: (grammarRules: string[]) => void;
}

const GrammarInput: React.FC<GrammarInputProps> = ({ onParse }) => {
	const [grammarText, setGrammarText] = useState('');

	const handleParse = () => {
		const lines = grammarText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
		onParse(lines);
	};

	return (
		<div className="p-4 bg-gray-100">
			<h2 className="text-lg font-bold mb-2">Enter Grammar</h2>
			<textarea
				value={ grammarText }
				onChange={ (e) => setGrammarText(e.target.value) }
				rows={ 10 }
				className="w-full p-2 border border-gray-300 rounded mb-2"
			/>
			<button onClick={ handleParse } className="px-4 py-2 bg-blue-500 text-white rounded">
				Parse Grammar
			</button>
		</div>
	);
};

export default GrammarInput;
