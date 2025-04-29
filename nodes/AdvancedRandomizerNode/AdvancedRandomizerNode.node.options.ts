import { INodeProperties } from 'n8n-workflow';

/**
 * Parâmetros exibidos no editor do n8n.
 */
export const advancedRandomizerNodeOptions: INodeProperties[] = [
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
		default: [
			{ outputName: 'Output 1', percentage: 50 },
			{ outputName: 'Output 2', percentage: 50 },
		],
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
						description: 'Probabilidade para esta saída (a soma deve ser 100%)',
					},
				],
			},
		],
	},
];
