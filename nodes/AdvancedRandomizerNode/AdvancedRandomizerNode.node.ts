/* -------------------------------------------------------------------------- */
/*  AdvancedRandomizerNode                                                    */
/* -------------------------------------------------------------------------- */

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeParameterValue,
} from 'n8n-workflow';

type OutputCfg = {
	outputName: string;
	percentage?: number;
};

export class AdvancedRandomizerNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizerNode',
		group: ['transform'],
		version: 1,
		icon: 'file:randomizerNode.svg',
		description:
			'Route executions randomly, by percentage, or sequentially to multiple outputs',
		defaults: {
			name: 'Advanced Randomizer',
		},

		/* ───────────────────────────────────────────────────────────── inputs/out */
		inputs: ['main'], // apenas 1 entrada; o n8n aceitará quantos itens vierem
		outputs: ['main'], // quantidade real é dinâmica (baseada em “Outputs”)

		/* ──────────────────────────────────────────────────────────── propriedades */
		properties: [
			{
				displayName: 'Selection Method',
				name: 'selectionMethod',
				type: 'options',
				options: [
					{ name: 'Random', value: 'random' },
					{ name: 'Percentage', value: 'percentage' },
					{ name: 'Sequential', value: 'sequential' },
				],
				default: 'random',
				description: 'How the output path will be selected',
			},
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
								description: 'Only used when “Percentage” is selected',
								displayOptions: {
									show: { '/selectionMethod': ['percentage'] },
								},
							},
						],
					},
				],
			},
		],
	};

	/* ------------------------------------------------------------------------ */
	/*  execute                                                                 */
	/* ------------------------------------------------------------------------ */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const selectionMethod = this.getNodeParameter<'random' | 'percentage' | 'sequential'>(
			'selectionMethod',
			0,
		);

		/* ------------------------------------------------------------------ */
		/*  Obter configuração dos outputs                                    */
		/*  fixedCollection (multipleValues) → [{ output: { … } }, …]         */
		/* ------------------------------------------------------------------ */
		const rawCfg = this.getNodeParameter<NodeParameterValue>('outputs', 0) as Array<{
			output: OutputCfg;
		}>;

		const outputsCfg: OutputCfg[] = rawCfg.map((o) => o.output);

		if (selectionMethod === 'percentage') {
			const total = outputsCfg.reduce((s, o) => s + (o.percentage ?? 0), 0);
			if (Math.abs(total - 100) > 0.001) {
				throw new Error(
					`The total percentage across all outputs must equal 100 %. Current total: ${total}.`,
				);
			}
		}

		/* ------------------------------------------------------------------ */
		/*  Inicializar array de saídas dinâmico                              */
		/* ------------------------------------------------------------------ */
		const returnData: INodeExecutionData[][] = Array.from(
			{ length: outputsCfg.length },
			() => [],
		);

		/* ────────────────────────────── Random ───────────────────────────── */
		if (selectionMethod === 'random') {
			for (const item of items) {
				const idx = Math.floor(Math.random() * outputsCfg.length);
				returnData[idx].push(item);
			}
			return returnData;
		}

		/* ──────────────────────────── Percentage ─────────────────────────── */
		if (selectionMethod === 'percentage') {
			// Criar ranges cumulativos
			const ranges: { upper: number; index: number }[] = [];
			let acc = 0;
			outputsCfg.forEach((o, i) => {
				acc += o.percentage ?? 0;
				ranges.push({ upper: acc, index: i });
			});

			for (const item of items) {
				const rnd = Math.random() * 100;
				const target = ranges.find((r) => rnd <= r.upper)!;
				returnData[target.index].push(item);
			}
			return returnData;
		}

		/* ───────────────────────────── Sequential ────────────────────────── */
		const staticData = this.getWorkflowStaticData('node');
		let cursor = (staticData.cursor as number | undefined) ?? 0;

		for (const item of items) {
			returnData[cursor].push(item);
			cursor = (cursor + 1) % outputsCfg.length;
		}
		staticData.cursor = cursor;

		return returnData;
	}
}
