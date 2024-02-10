import React from 'react';
import ReactDOM from 'react-dom';

const DataDictionary = () => {
	return (
		<div>
			<h1>Data Dictioxnary</h1>
		</div>
	);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
	<React.StrictMode>
		<div>
			<DataDictionary />
		</div>
	</React.StrictMode>,
);
