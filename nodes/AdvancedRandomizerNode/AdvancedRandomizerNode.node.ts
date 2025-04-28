import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

interface Route {
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
		description: 'Redireciona os itens usando lógica Random / Percentage / Sequential',
		defaults: {
			name: 'Advanced Randomizer',
		},
		// ――― o compilador só aceita exatamente estas strings:
		inputs: ['main'],
		outputs: ['main'],
		properties: <INodeProperties[]>[
			/* ─────────── Método ─────────── */
			{
				displayName: 'Method',
				name: 'method',
				type: 'options',
				default: 'random',
				options: [
					{ name: 'Random', value: 'random' },
					{ name: 'Percentage', value: 'percentage' },
					{ name: 'Sequential', value: 'sequential' },
				],
				description: 'Lógica usada para escolher a rota de saída',
			},

			/* ─────────── Rotas ─────────── */
			{
				displayName: 'Routes',
				name: 'routes',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				placeholder: 'Add Route',
				default: [],
				description:
					'Uma entrada por rota desejada. O node cria a mesma quantidade de saídas.',
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
									show: { rename: [true] },
								},
							},
							{
								displayName: 'Percentage',
								name: 'percentage',
								type: 'number',
								typeOptions: { minValue: 0, maxValue: 100 },
								default: 0,
								displayOptions: {
									show: { '/method': ['percentage'] },
								},
							},
						],
					},
				],
			},
		],
	};

	/* ═══════════════════════════════════════════════ */

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const inputItems = this.getInputData();

		// tipagem explícita evita TS2344
		const method = this.getNodeParameter('method', 0) as
			| 'random'
			| 'percentage'
			| 'sequential';

		const routes = (this.getNodeParameter('routes', 0, []) as Route[]) ?? [];
		const outTotal = Math.max(routes.length, 1); // pelo menos 1 saída

		// prepara estrutura de saída
		const outputs: INodeExecutionData[][] = Array.from({ length: outTotal }, () => []);

		/* ─────────── STATE para SEQUENTIAL ─────────── */
		let seqIndex = this.getWorkflowStaticData('node').seqIndex as number | undefined;
		if (seqIndex === undefined) seqIndex = 0;

		/* ─────────── LOOP de itens ─────────── */
		for (const item of inputItems) {
			let target = 0;

			if (method === 'random') {
				target = Math.floor(Math.random() * outTotal);
			} else if (method === 'percentage') {
				const totalPct = routes.reduce((t, r) => t + (r.percentage ?? 0), 0);
				if (totalPct !== 100)
					throw new Error('A soma de “Percentage” deve ser exatamente 100 %.');

				const pick = Math.random() * 100;
				let acc = 0;
				for (let i = 0; i < routes.length; i++) {
					acc += routes[i].percentage ?? 0;
					if (pick <= acc) {
						target = i;
						break;
					}
				}
			} else if (method === 'sequential') {
				target = seqIndex;
				seqIndex = (seqIndex + 1) % outTotal;
			}

			outputs[target].push(item);
		}

		// salva posição atual para o próximo execute
		this.getWorkflowStaticData('node').seqIndex = seqIndex;

		return outputs;
	}
}
