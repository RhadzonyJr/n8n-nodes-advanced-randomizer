import { INodeProperties } from 'n8n-workflow';

export const advancedRandomizerNodeOptions: INodeProperties[] = [
	{
		displayName: 'Rename Outputs',
		name: 'renameOutputs',
		type: 'boolean',
		default: false,
		description: 'Whether to allow manual naming of each output',
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
		placeholder: 'Add Output',
		default: {
			output: [
				{ outputName: 'Output 1', percentage: 50 },
				{ outputName: 'Output 2', percentage: 50 },
			],
		},
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
						placeholder: 'e.g. Success, Retry...',
						description: 'Only used if Rename Outputs is enabled',
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
						description: 'Probability for this output (must total 100%)',
					},
				],
			},
		],
	},
];
