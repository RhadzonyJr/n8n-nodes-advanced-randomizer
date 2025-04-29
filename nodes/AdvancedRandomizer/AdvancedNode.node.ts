import {
	INodeType,
	INodeTypeDescription,
	INodeExecutionData,
	INodeParameters,
	IExecuteFunctions,
} from 'n8n-workflow';

export class AdvancedNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Node',
		name: 'advancedNode',
		icon: 'file:AdvancedNode.svg',
		group: ['transform'],
		version: 1,
		description: 'Node with configurable number of outputs',
		defaults: {
			name: 'AdvancedNode',
		},
		inputs: ['main'],
		outputs: Array.from({ length: 10 }, (_, i) => (i + 1).toString()), // [ '1'...'10' ]
		outputNames: Array.from({ length: 10 }, (_, i) => `Output ${i + 1}`),
		properties: [
			{
				displayName: 'Output Number',
				name: 'outputNumber',
				type: 'options',
				options: [
					{ name: '2', value: 2 },
					{ name: '4', value: 4 },
					{ name: '5', value: 5 },
					{ name: '6', value: 6 },
					{ name: '7', value: 7 },
					{ name: '8', value: 8 },
					{ name: '9', value: 9 },
					{ name: '10', value: 10 },
				],
				default: 2,
				required: true,
				description: 'Select how many outputs this node should have.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const outputNumber = this.getNodeParameter('outputNumber', 0) as number;

		const returnData: INodeExecutionData[][] = Array.from({ length: outputNumber }, () => []);

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			// Por padrão, envia para a primeira saída
			returnData[0].push(item);
		}

		return returnData;
	}
}
