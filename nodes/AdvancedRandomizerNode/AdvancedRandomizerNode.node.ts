import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { advancedRandomizerNodeOptions } from './AdvancedRandomizerNode.node.options';

/**
 * Máximo de saídas físicas que vamos anunciar para o n8n.
 * O usuário pode habilitar entre 2-10 no parâmetro “Outputs”.
 */
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

		/*
		 * 1 entrada física e 10 saídas físicas para satisfazer o compilador.
		 * Durante a execução cortamos para o número que o usuário configurou.
		 */
		inputs: ['main'],
		outputs: Array.from({ length: MAX_OUTPUTS }, () => 'main'),

		properties: advancedRandomizerNodeOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items        = this.getInputData();
		const method       = this.getNodeParameter('selectionMethod', 0) as string;

		const cfgOutputs   = this.getNodeParameter(
			'outputs',
			0,
			[],
		) as { outputName: string; percentage?: number }[];

		if (cfgOutputs.length < 2) {
			throw new Error('Please configure at least two outputs.');
		}

		/* ------- validação de porcentagens -------- */
		if (method === 'percentage') {
			const total = cfgOutputs.reduce((sum, o) => sum + (o.percentage ?? 0), 0);
			if (Math.abs(total - 100) > 0.01) {
				throw new Error(
					`The total percentage across all outputs must equal 100 %. Current total: ${total.toFixed(
						2,
					)} %.`,
				);
			}
		}

		/* ------- inicializa vetor de saídas ------- */
		const buckets: INodeExecutionData[][] = Array.from(
			{ length: MAX_OUTPUTS },
			() => [],
		);

		/* -------------- Random -------------------- */
		if (method === 'random') {
			for (const item of items) {
				const idx = Math.floor(Math.random() * cfgOutputs.length);
				buckets[idx].push(item);
			}
		}

		/* ------------ Percentage ------------------ */
		if (method === 'percentage') {
			// cria ranges cumulativos 0-100
			let acc = 0;
			const ranges = cfgOutputs.map((o, i) => {
				acc += o.percentage ?? 0;
				return { upper: acc, idx: i };
			});

			for (const item of items) {
				const rnd = Math.random() * 100;
				const chosen = ranges.find((r) => rnd <= r.upper)!; // sempre encontra porque soma ==100
				buckets[chosen.idx].push(item);
			}
		}

		/* -------------- Sequential --------------- */
		if (method === 'sequential') {
			const sData = this.getWorkflowStaticData('node');
			let cursor  = (sData.cursor as number | undefined) ?? 0;

			for (const item of items) {
				buckets[cursor].push(item);
				cursor = (cursor + 1) % cfgOutputs.length;
			}
			sData.cursor = cursor;
		}

		/* devolve apenas as saídas que o usuário habilitou */
		return buckets.slice(0, cfgOutputs.length);
	}
}
