import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

interface IRoute {
	outputName?: string;
	percentage?: number;
}

export class AdvancedRandomizerNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizer',
		group: ['transform'],
		version: 1,
		icon: 'file:advancedRandomizerNode.svg',

		description: 'Route items randomly, by percentage or sequentially',

		defaults: { name: 'Advanced Randomizer' },

		/** ←  CORREÇÃO  — apenas “main”, nada de colchetes  */
		inputs:  ['main'],
		outputs: ['main'],

		properties: [
			/* ------------------- Modo ------------------- */
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				options: [
					{ name: 'Random',     value: 'random'      },
					{ name: 'Percentage', value: 'percentage'  },
					{ name: 'Sequential', value: 'sequential'  },
				],
				default: 'random',
				description:
					'How to decide which route will receive each item',
			},

			/* ------------------- Rotas ------------------ */
			{
				displayName: 'Routes',
				name: 'routes',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, sortable: true },
				placeholder: 'Add Route',
				default: [],
				options: [
					{
						displayName: 'Route',
						name: 'route',
						values: [
							{
								displayName: 'Output Name',
								name: 'outputName',
								type: 'string',
								default: '',
								description: 'Optional label for this output',
							},
							{
								displayName: 'Percentage',
								name: 'percentage',
								type: 'number',
								typeOptions: { minValue: 0, maxValue: 100 },
								displayOptions: {
									show: { '../../mode': ['percentage'] },
								},
								default: 0,
								description:
									'Chance of this route being chosen (sum of all routes must be 100 %)',
							},
						],
					},
				],
			},
		],
	};

	/* -------------------- execute ------------------- */

	async execute(
		this: IExecuteFunctions,
	): Promise<INodeExecutionData[][]> {
		const items   = this.getInputData();
		const mode    = this.getNodeParameter<string>('mode', 0);
		const routes  = this.getNodeParameter<IRoute[]>('routes', 0, []);

		if (routes.length === 0) {
			throw new Error('Configure at least one route.');
		}

		/* --- validação de porcentagem --- */
		if (mode === 'percentage') {
			const total = routes.reduce<number>(
				(sum, r) => sum + (Number(r.percentage) || 0),
				0,
			);
			if (total !== 100) {
				throw new Error(
					`Percentage mode: the sum of all percentages must be 100 (current ${total}).`,
				);
			}
		}

		/* --- prepara saídas --- */
		const outputs: INodeExecutionData[][] = routes.map(
			(): INodeExecutionData[] => [],
		);

		let seq = 0;
		const perc = routes.map((r) => Number(r.percentage) || 0);

		for (const item of items) {
			let target = 0;

			if (mode === 'random') {
				target = Math.floor(Math.random() * routes.length);
			} else if (mode === 'sequential') {
				target = seq;
				seq = (seq + 1) % routes.length;
			} else {
				const r = Math.random() * 100;
				let sum = 0;
				for (let i = 0; i < perc.length; i++) {
					sum += perc[i];
					if (r < sum) {
						target = i;
						break;
					}
				}
			}

			outputs[target].push(item);
		}

		return outputs;
	}
}
