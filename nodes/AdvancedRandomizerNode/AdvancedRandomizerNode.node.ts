import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import { advancedRandomizerNodeOptions } from './AdvancedRandomizerNode.node.options';

const MAX_OUTPUTS = 10;

export class AdvancedRandomizerNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizerNode',
		icon: 'fa:random',
		group: ['transform'],
		version: 1,
		description:
			'Route executions randomly, by percentage, or sequentially to multiple outputs.',
		defaults: { name: 'Advanced Randomizer' },

		// 👉 1 entrada + 10 saídas “físicas” (tipadas como NodeConnectionType[])
		inputs: ['main'] as NodeConnectionType[],
		outputs: Array.from({ length: MAX_OUTPUTS }, () => 'main' as NodeConnectionType) as NodeConnectionType[],

		properties: advancedRandomizerNodeOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items      = this.getInputData();
		const method     = this.getNodeParameter('selectionMethod', 0) as string;
		const cfgOutputs = this.getNodeParameter(
			'outputs',
			0,
			[],
		) as { outputName: string; percentage?: number }[];

		if (cfgOutputs.length < 2) {
			throw new Error('Configure ao menos duas saídas em “Outputs”.');
		}

		/* ------------ valida porcentagens --------- */
		if (method === 'percentage') {
			const total = cfgOutputs.reduce((sum, o) => sum + (o.percentage ?? 0), 0);
			if (Math.abs(total - 100) > 0.01) {
				throw new Error(`A soma das porcentagens deve ser 100 %. Valor atual: ${total} %.`);
			}
		}

		/* ------------- buckets de saída ------------ */
		const buckets: INodeExecutionData[][] = Array.from({ length: MAX_OUTPUTS }, () => []);

		/* -------------- Random --------------------- */
		if (method === 'random') {
			for (const item of items) {
				const idx = Math.floor(Math.random() * cfgOutputs.length);
				buckets[idx].push(item);
			}
		}

		/* ----------- Percentage -------------------- */
		if (method === 'percentage') {
			let acc = 0;
			const ranges = cfgOutputs.map((o, i) => {
				acc += o.percentage ?? 0;
				return { upper: acc, idx: i };
			});

			for (const item of items) {
				const rnd = Math.random() * 100;
				const bucket = ranges.find((r) => rnd <= r.upper)!;
				buckets[bucket.idx].push(item);
			}
		}

		/* ------------- Sequential ------------------ */
		if (method === 'sequential') {
			const sData  = this.getWorkflowStaticData('node');
			let cursor   = (sData.cursor as number | undefined) ?? 0;

			for (const item of items) {
				buckets[cursor].push(item);
				cursor = (cursor + 1) % cfgOutputs.length;
			}
			sData.cursor = cursor;
		}

		/* -------- devolve apenas saídas ativas ----- */
		return buckets.slice(0, cfgOutputs.length);
	}
}
