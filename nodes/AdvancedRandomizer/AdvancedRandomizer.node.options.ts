import { INodeProperties } from 'n8n-workflow';

export const advancedRandomizerNodeOptions: INodeProperties[] = [
	{
		displayName: 'Selection Method',
		name: 'selectionMethod',
		type: 'options',
		options: [
			{
				name: 'Random',
				value: 'random',
				description: 'Select an output randomly.',
			},
			{
				name: 'Percentage',
				value: 'percentage',
				description: 'Select an output based on defined percentages.',
			},
			{
				name: 'Sequential',
				value: 'sequential',
				description: 'Select outputs sequentially one after another.',
			},
		],
		default: 'random',
		required: true,
		description: 'How the output path will be selected.',
	},
	{
		displayName: 'Outputs',
		name: 'outputs',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
			minValues: 2,
			maxValues: 10,
		},
		placeholder: 'Add output',
		default: [],
		options: [
			{
				name: 'output',
				displayName: 'Output',
				values: [
					{
						displayName: 'Output Name',
						name: 'outputName',
						type: 'string',
						default: '',
						placeholder: 'e.g., Path A, Path B',
						description: 'Name of the output path.',
					},
					{
						displayName: 'Percentage',
						name: 'percentage',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 100,
						},
						default: 0,
						description: 'Chance (%) for this output (only used with "Percentage" method).',
						displayOptions: {
							show: {
								'/selectionMethod': [
									'percentage',
								],
							},
						},
					},
				],
			},
		],
	},
];
