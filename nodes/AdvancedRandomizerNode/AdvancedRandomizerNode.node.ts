import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

interface RouteCfg {
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
		description: 'Desvia itens por Random, Percentage ou Sequential',
		defaults: { name: 'Advanced Randomizer' },

		/*  <<< AQUI está a causa do seu erro: só use 'main', SEM colchetes >>> */
		inputs: ['main'],
		/*  Coloquei 5 saídas “main”.  Ajuste a quantidade caso deseje outro limite. */
		outputs: ['main', 'main', 'main', 'main', 'main'],

		properties: <INodeProperties[]>[
			/* ────── Método ────── */
			{
				displayName: 'Method',
				name: 'method',
				type: 'options',
				default: 'random',
				description: 'Lógica usada para escolher a rota',
				options: [
					{ name: 'Random', value: 'random' },
					{ name: 'Percentage', value: 'percentage' },
					{ name: 'Sequential', value: 'sequential' },
				],
			},

			/* ────── Rotas ────── */
			{
				displayName: 'Routes',
				name: 'routes',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				placeholder: 'Add Route',
				default: [],
				description:
					'Adicione uma entrada por rota; o node criará o mesmo # de saídas (até 5).',
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
								displayOptions: { show: { rename: [true] } },
							},
							{
								displayName: 'Percentage',
								name: 'percentage',
								type: 'number',
								typeOptions: { minValue: 0, maxValue: 100 },
								default: 0,
								displayOptions: { show: { '/method': ['percentage'] } },
							},
						],
					},
				],
			},
		],
	};

	/* ═════════════ EXECUTE ═════════════ */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const method = this.getNodeParameter('method', 0) as
			| 'random'
			| 'percentage'
			| 'sequential';
		const routes = (this.getNodeParameter('routes', 0, []) as RouteCfg[]) ?? [];

		/* máximo 5 saídas: usa quantas rotas o usuário criou ou 1 por default */
		const maxOut = Math.min(Math.max(routes.length, 1), 5);
		const outputs: INodeExecutionData[][] = Array.from({ length: maxOut }, () => []);

		/* estado para sequencial */
		const staticData = this.getWorkflowStaticData('node');
		let seqIdx = (staticData.seqIdx as number | undefined) ?? 0;

		/* pré-checa percentual */
		if (method === 'percentage') {
			const sum = routes.reduce((t, r) => t + (r.percentage ?? 0), 0);
			if (sum !== 100) throw new Error('A soma de Percentage deve ser 100 %.');
		}

		for (const item of items) {
			let target = 0;

			switch (method) {
				case 'random':
					target = Math.floor(Math.random() * maxOut);
					break;
				case 'percentage': {
					const pick = Math.random() * 100;
					let acc = 0;
					for (let i = 0; i < maxOut; i++) {
						acc += routes[i]?.percentage ?? 0;
						if (pick <= acc) {
							target = i;
							break;
						}
					}
					break;
				}
				case 'sequential':
					target = seqIdx;
					seqIdx = (seqIdx + 1) % maxOut;
					break;
			}

			outputs[target].push(item);
		}

		staticData.seqIdx = seqIdx; // salva posição p/ próxima execução
		return outputs;
	}
}
