import { INodeProperties } from 'n8n-workflow';

/**
 * Parâmetros exibidos no editor do n8n.
 */
export const advancedRandomizerNodeOptions: INodeProperties[] = [
	{
		displayName: 'Selection Method',
		name: 'selectionMethod',
		type: 'options',
		options: [
			{ name: 'Random',     value: 'random'     },
			{ name: 'Percentage', value: 'percentage' },
			{ name: 'Sequential', value: 'sequential' },
		],
		default: 'random',
		description: 'Como a saída será escolhida',          // ← sem ponto final
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
		placeholder: 'Adicionar saída',
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
						placeholder: 'Ex.: Caminho A',
					},
					{
						displayName: 'Percentage',
						name: 'percentage',
						type: 'number',
						typeOptions: { minValue: 0, maxValue: 100 },
						default: 0,
						displayOptions: { show: { '/selectionMethod': ['percentage'] } },
						description:
							'Probabilidade para esta saída (usado apenas em “Percentage”)', // ← sem ponto final
					},
				],
			},
		],
	},
];
