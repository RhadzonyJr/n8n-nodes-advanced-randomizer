import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { advancedRandomizerNodeOptions } from './AdvancedRandomizerNode.node.options';

/**
 * Função que gera dinamicamente as saídas com base nas configurações do usuário
 */
const configuredOutputs = (parameters: any) => {
	const raw = parameters.outputs?.output;
	if (!raw) return [];

	const outputs = Array.isArray(raw)
		? raw
		: typeof raw === 'object'
		? [raw]
		: [];

	return outputs.map((output: any, index: number) => ({
		type: 'main',
		displayName: output?.outputName || `Output ${index + 1}`,
	}));
};


export class AdvancedRandomizerNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizerNode',
		icon: 'file:advancedRandomizerNode.svg', // <- agora usando seu SVG
		group: ['transform'],
		version: 1,
		description: 'Route executions randomly with customizable outputs and percentages',
		defaults: {
			name: 'Advanced Randomizer',
		},
		inputs: '={{["main"]}}',
		outputs: `={{(${configuredOutputs})($parameter)}}`,
		properties: advancedRandomizerNodeOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const cfgOutputs = this.getNodeParameter(
			'outputs',
			0,
			[],
		) as { outputName: string; percentage: number }[];

		if (cfgOutputs.length < 2) {
			throw new NodeOperationError(this.getNode(), 'Configure at least two outputs.');
		}

		const total = cfgOutputs.reduce((sum, o) => sum + (o.percentage ?? 0), 0);
		if (Math.abs(total - 100) > 0.01) {
			throw new NodeOperationError(
				this.getNode(),
				`The sum of all percentages must be 100%. Current total: ${total}%`,
			);
		}

		const buckets: INodeExecutionData[][] = Array.from({ length: cfgOutputs.length }, () => []);

		// cria ranges com base nas porcentagens acumuladas
		let acc = 0;
		const ranges = cfgOutputs.map((o, i) => {
			acc += o.percentage;
			return { upper: acc, idx: i };
		});

		// distribui os itens com base nas faixas
		for (const item of items) {
			const rnd = Math.random() * 100;
			const bucket = ranges.find((r) => rnd <= r.upper)!;
			buckets[bucket.idx].push(item);
		}

		return buckets;
	}
}
