import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

interface IRoute {
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
		description: 'Route items randomly, by percentage or sequentially',
		defaults: { name: 'Advanced Randomizer' },

		/** ← aqui é string simples, SEM colchetes no texto */
		inputs:  ['main'],
		outputs: ['main'],

		properties: [
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				options: [
					{ name: 'Random',     value: 'random' },
					{ name: 'Percentage', value: 'percentage' },
					{ name: 'Sequential', value: 'sequential' },
				],
				default: 'random',
				description: 'How to choose the route for each item',
			},
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
							},
							{
								displayName: 'Percentage',
								name: 'percentage',
								type: 'number',
								typeOptions: { minValue: 0, maxValue: 100 },
								displayOptions: { show: { '../../mode': ['percentage'] } },
								default: 0,
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items  = this.getInputData();
		const mode   = this.getNodeParameter<string>('mode', 0);
		const routes = this.getNodeParameter<IRoute[]>('routes', 0, []);

		if (routes.length === 0)
			throw new Error('Configure at least one route.');

		if (mode === 'percentage') {
			const total = routes.reduce((s, r) => s + (Number(r.percentage) || 0), 0);
			if (total !== 100)
				throw new Error(`Percentage mode: total must be 100 (got ${total}).`);
		}

		const outputs: INodeExecutionData[][] = routes.map(() => []);
		const perc = routes.map(r => Number(r.percentage) || 0);

		let seq = 0;
		for (const item of items) {
			let target = 0;

			switch (mode) {
				case 'random':
					target = Math.floor(Math.random() * routes.length);
					break;
				case 'sequential':
					target = seq;
					seq = (seq + 1) % routes.length;
					break;
				case 'percentage': {
					const r = Math.random() * 100;
					let acc = 0;
					for (let i = 0; i < perc.length; i++) {
						acc += perc[i];
						if (r < acc) { target = i; break; }
					}
					break;
				}
			}

			outputs[target].push(item);
		}

		return outputs;
	}
}
