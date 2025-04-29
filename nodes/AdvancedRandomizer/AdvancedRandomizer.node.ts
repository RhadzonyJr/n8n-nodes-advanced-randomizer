import { INodeType,
	INodeTypeDescription,
	INodeExecutionData,
	IExecuteFunctions
} from 'n8n-workflow';

export class AdvancedRandomizer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizer',
		group: ['transform'],
		version: 1,
		description: 'Routes executions randomly or by defined percentages.',
		defaults: {
			name: 'Advanced Randomizer',
			color: '#FFAA00',
			icon: 'file:advancedRandomizerNode.svg',
		},
		subtitle: '={{"Mode: " + $parameter[\'mode\']}}',
		inputs: ['main'],
		outputs: ['main'], // Dinamicamente ajustado no execute
		properties: [
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				options: [
					{ name: 'Random', value: 'random' },
					{ name: 'Random %', value: 'randomPercentage' },
				],
				default: 'random',
				description: 'Choose the randomization mode.',
			},
			{
				displayName: 'Number of Outputs',
				name: 'numberOfOutputs',
				type: 'number',
				typeOptions: {
					minValue: 2,
					maxValue: 50,
				},
				default: 2,
				description: 'How many outputs to generate.',
			},
			{
				displayName: 'Output Percentages',
				name: 'outputPercentages',
				description: 'Define the percentage for each output (must sum to 100%)',
				type: 'fixedCollection',
				placeholder: 'Add Percentage',
				options: [
					{
						name: 'percentages',
						displayName: 'Percentages',
						values: [
							{
								displayName: 'Output Index',
								name: 'index',
								type: 'number',
								typeOptions: {
									minValue: 0,
								},
								default: 0,
							},
							{
								displayName: 'Percentage',
								name: 'percentage',
								type: 'number',
								typeOptions: {
									minValue: 0,
									maxValue: 100,
								},
								default: 50,
							},
						],
					},
				],
				displayOptions: {
					show: {
						mode: ['randomPercentage'],
					},
				},
				required: false,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const mode = this.getNodeParameter('mode', 0) as 'random' | 'randomPercentage';
		const numberOfOutputs = this.getNodeParameter('numberOfOutputs', 0) as number;

		const items = this.getInputData();
		const returnData: INodeExecutionData[][] = Array.from({ length: numberOfOutputs }, () => []);

		for (let i = 0; i < items.length; i++) {
			let outputIndex: number;

			if (mode === 'random') {
				outputIndex = Math.floor(Math.random() * numberOfOutputs);
			} else if (mode === 'randomPercentage') {
				const percentagesCollection = this.getNodeParameter('outputPercentages.percentages', 0) as Array<{ index: number; percentage: number }>;
				const totalPercentage = percentagesCollection.reduce((sum, p) => sum + p.percentage, 0);

				if (totalPercentage !== 100) {
					throw new Error('Total percentage must equal 100%.');
				}

				const random = Math.random() * 100;
				let cumulative = 0;
				outputIndex = 0;
				for (const p of percentagesCollection) {
					cumulative += p.percentage;
					if (random <= cumulative) {
						outputIndex = p.index;
						break;
					}
				}
			}

			returnData[outputIndex].push(items[i]);
		}

		return returnData;
	}
}
