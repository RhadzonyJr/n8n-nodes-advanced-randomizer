import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
	NodeConnectionType,
} from 'n8n-workflow';

import { advancedRandomizerNodeOptions } from './AdvancedRandomizerNode.node.options';
import { configuredOutputs } from './configuredOutputs';

export class AdvancedRandomizerNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizerNode',
		icon: 'file:advancedRandomizerNode.svg',
		group: ['transform'],
		version: 3,
		description: 'Route executions randomly with customizable outputs and percentages',
		defaults: {
			name: 'Advanced Randomizer',
		},
		inputs: [NodeConnectionType.Main],
		outputs: `={{(${configuredOutputs.toString()})($parameter)}}`,
		properties: advancedRandomizerNodeOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const raw = this.getNodeParameter('outputs', 0) as { output: any };
		const cfgOutputs = Array.isArray(raw.output) ? raw.output : [raw.output];

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

		let acc = 0;
		const ranges = cfgOutputs.map((o, i) => {
			acc += o.percentage;
			return { upper: acc, idx: i };
		});

		for (const item of items) {
			const rnd = Math.random() * 100;
			const bucket = ranges.find((r) => rnd <= r.upper)!;
			buckets[bucket.idx].push(item);
		}

		return buckets;
	}
}
