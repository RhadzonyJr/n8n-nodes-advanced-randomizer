/****************************************************************************************
 * AdvancedRandomizerNode.node.ts
 * ------------------------------------------------------------------
 * Roteia itens para até 10 saídas usando três estratégias:
 *   1. Random    – escolhe uma saída aleatória
 *   2. Percentage – distribui conforme percentuais definidos
 *   3. Sequential – cicla sequencialmente pelas saídas
 ****************************************************************************************/

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

export class AdvancedRandomizerNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizerNode',
		icon: 'file:advancedRandomizerNode.svg',
		group: ['transform'],
		version: 1,
		description:
			'Route items randomly, by percentage, or sequentially to multiple outputs.',
		defaults: { name: 'Advanced Randomizer' },

		/* ───────────────────────── Portas ─────────────────────── */
		inputs: ['main'],
		// 10 portas fixas (máx permitido); as não utilizadas permanecem vazias
		outputs: [
			'main','main','main','main','main',
			'main','main','main','main','main',
		] as NodeConnectionType[],
		outputNames: [
			'Output 1','Output 2','Output 3','Output 4','Output 5',
			'Output 6','Output 7','Output 8','Output 9','Output 10',
		],

		/* ─────────────────── Propriedades (UI) ─────────────────── */
		properties: [
			/* Método de seleção */
			{
				displayName: 'Selection Method',
				name: 'selectionMethod',
				type: 'options',
				options: [
					{ name: 'Random',     value: 'random' },
					{ name: 'Percentage', value: 'percentage' },
					{ name: 'Sequential', value: 'sequential' },
				],
				default: 'random',
				description: 'How the output will be selected for each item.',
			},

			/* Configuração das saídas */
			{
				displayName: 'Outputs',
				name: 'outputs',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, minValues: 2, maxValues: 10 },
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
								placeholder: 'e.g. Path A',
							},
							{
								displayName: 'Percentage',
								name: 'percentage',
								type: 'number',
								typeOptions: { minValue: 0, maxValue: 100 },
								default: 0,
								displayOptions: {
									show: { '/selectionMethod': ['percentage'] },
								},
								description:
									'Chance (%) for this output (Percentage method only).',
							},
						],
					},
				],
			},
		],
	};

	/* ───────────────────────── execute() ─────────────────────── */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		type Method = 'random' | 'percentage' | 'sequential';
		const method = this.getNodeParameter<Method>('selectionMethod', 0);

		const cfg = this.getNodeParameter<
			{ outputName: string; percentage?: number }[]
		>('outputs', 0);

		/* ---------- Validação de porcentagem ---------- */
		if (method === 'percentage') {
			const total = cfg.reduce((sum, o) => sum + (o.percentage ?? 0), 0);
			if (Math.abs(total - 100) > 0.01) {
				throw new Error(
					`Sum of percentages must be 100 % (currently ${total}).`,
				);
			}
		}

		/* ---------- Prepara 10 arrays de saída ---------- */
		const out: INodeExecutionData[][] = Array.from({ length: 10 }, () => []);

		/* ---------- Random ----------------------------- */
		if (method === 'random') {
			for (const item of items) {
				const idx = Math.floor(Math.random() * cfg.length);
				out[idx].push(item);
			}
		}

		/* ---------- Percentage ------------------------- */
		if (method === 'percentage') {
			let acc = 0;
			const ranges = cfg.map((o, i) => {
				acc += o.percentage ?? 0;
				return { upper: acc, i };
			});

			for (const item of items) {
				const r = Math.random() * 100;
				const tgt = ranges.find((rng) => r <= rng.upper)!;
				out[tgt.i].push(item);
			}
		}

		/* ---------- Sequential ------------------------- */
		if (method === 'sequential') {
			const data = this.getWorkflowStaticData('node') as { idx?: number };
			let idx = data.idx ?? 0;

			for (const item of items) {
				out[idx].push(item);
				idx = (idx + 1) % cfg.length;
			}
			data.idx = idx;
		}

		return out;
	}
}
