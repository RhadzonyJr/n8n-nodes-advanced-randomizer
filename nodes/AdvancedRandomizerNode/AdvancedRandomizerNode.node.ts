import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

interface IRoute {
	rename: boolean;
	outputName?: string;
	percentage?: number;
}

export class AdvancedRandomizerNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizer',
		icon: 'file:advancedRandomizerNode.svg',
		group: ['transform'],
		version: 1,
		description: 'Redireciona itens de forma Random, Percentage ou Sequential',
		defaults: {
			name: 'Advanced Randomizer',
		},
		// ❱❱❱  Estes valores precisam ser *string[]* contendo apenas o nome das conexões
		inputs: ['main'],
		outputs: ['main'],
		properties: <INodeProperties[]>[
			/* ---------- Método ---------- */
			{
				displayName: 'Method',
				name: 'method',
				type: 'options',
				default: 'random',
				options: [
					{
						name: 'Random',
						value: 'random',
					},
					{
						name: 'Percentage',
						value: 'percentage',
					},
					{
						name: 'Sequential',
						value: 'sequential',
					},
				],
				description: 'Lógica usada para escolher a rota de saída',
			},

			/* ---------- Rotas ---------- */
			{
				displayName: 'Routes',
				name: 'routes',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				placeholder: 'Add Route',
				default: [],
				options: [
					{
						name: 'route',
						displayName: 'Route',
						values: [
							{
								displayName: 'Rename Output',
								name: 'rename',
								type: 'boolean',
								default: false,
							},
							{
								displayName: 'Output Name',
								name: 'outputName',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										rename: [true],
									},
								},
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
								displayOptions: {
									show: {
										'/method': ['percentage'],
									},
								},
							},
						],
					},
				],
				description:
					'Uma entrada por rota desejada. A quantidade de saídas do node acompanha o número de rotas.',
			},
		],
	};

	/* ====================================================================== */

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const method = this.getNodeParameter<'random' | 'percentage' | 'sequential'>(
			'method',
			0,
		);
		const routes = (this.getNodeParameter('routes', 0, []) as IRoute[]) ?? [];

		const outputCount = Math.max(1, routes.length || 1);
		const outputData: INodeExecutionData[][] = Array.from({ length: outputCount }).map(
			() => [],
		);

		/* ---------- SEQUENTIAL ---------- */
		const seqKey = 'seqIndex';
		const staticData = this.getWorkflowStaticData('node') as { [k: string]: number };
		let seqIndex = staticData[seqKey] ?? 0;

		for (const item of items) {
			let target = 0;

			if (method === 'random') {
				target = Math.floor(Math.random() * outputCount);
			}

			if (method === 'percentage') {
				const total = routes.reduce((t, r) => t + (r.percentage ?? 0), 0);
				if (total !== 100) {
					throw new Error('A soma dos campos Percentage deve resultar em 100 %.');
				}

				const rand = Math.random() * 100;
				let acc = 0;
				for (let i = 0; i < routes.length; i++) {
					acc += routes[i].percentage ?? 0;
					if (rand <= acc) {
						target = i;
						break;
					}
				}
			}

			if (method === 'sequential') {
				target = seqIndex;
				seqIndex = (seqIndex + 1) % outputCount;
			}

			outputData[target].push(item);
		}

		// Salva estado para o modo sequencial
		staticData[seqKey] = seqIndex;

		return outputData;
	}
}
