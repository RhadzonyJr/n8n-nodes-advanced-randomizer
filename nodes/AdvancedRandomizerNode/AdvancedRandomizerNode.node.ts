import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
	NodeOperationError,
} from 'n8n-workflow';

import { advancedRandomizerNodeOptions } from './AdvancedRandomizerNode.node.options';

export class AdvancedRandomizerNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizerNode',
		icon: 'fa:random',
		group: ['transform'],
		version: 1,
		description: 'Route executions based on defined output percentages',
		defaults: {
			name: 'Advanced Randomizer',
		},
		inputs: ['main'] as NodeConnectionType[],
		outputs: Array.from({ length: 10 }, () => 'main' as NodeConnectionType), // máximo visível
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
			throw new NodeOperationError(this.getNode(), 'Configure ao menos duas saídas');
		}

		const total = cfgOutputs.reduce((sum, o) => sum + (o.percentage ?? 0), 0);
		if (Math.abs(total - 100) > 0.01) {
			throw new NodeOperationError(
				this.getNode(),
				`A soma das porcentagens deve ser 100%. Valor atual: ${total}%`,
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
