import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeParameterValue,
} from 'n8n-workflow';

import { advancedRandomizerNodeOptions } from './AdvancedRandomizerNode.node.options';

export class AdvancedRandomizerNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizerNode',
		icon: 'file:randomizerNode.svg',
		group: ['transform'],
		version: 1,
		description:
			'Route executions randomly, by percentage, or sequentially to multiple outputs.',
		defaults: {
			name: 'Advanced Randomizer',
		},
		/**
		 * ► ⚠️ API ≥ 1.30 — `inputs` / `outputs` agora são objetos `{ resource: "main" }`
		 */
		inputs: [{ resource: 'main' }],
		outputs: [{ resource: 'main' }],
		properties: advancedRandomizerNodeOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const selectionMethod = this.getNodeParameter('selectionMethod', 0) as NodeParameterValue;
		const configuredOutputs = this.getNodeParameter('outputs', 0, []) as {
			outputName: string;
			percentage?: number;
		}[];

		/* ---------- validação (Percentage) ---------- */
		if (selectionMethod === 'percentage') {
			const total = configuredOutputs.reduce(
				(sum, o) => sum + (o.percentage ?? 0),
				0,
			);
			if (Math.abs(total - 100) > 0.001) {
				throw new Error(
					`The total percentage across all outputs must equal 100 %. Current total: ${total.toFixed(
						2,
					)} %.`,
				);
			}
		}

		/* ---------- prepara buffer de saída ---------- */
		const returnData: INodeExecutionData[][] = Array.from(
			{ length: configuredOutputs.length },
			() => [],
		);

		/* ---------- Random ---------- */
		if (selectionMethod === 'random') {
			for (const item of items) {
				const idx = Math.floor(Math.random() * configuredOutputs.length);
				returnData[idx].push(item);
			}
		}

		/* ---------- Percentage ---------- */
		if (selectionMethod === 'percentage') {
			const ranges: { upper: number; idx: number }[] = [];
			let acc = 0;
			configuredOutputs.forEach((o, i) => {
				acc += o.percentage ?? 0;
				ranges.push({ upper: acc, idx: i });
			});

			for (const item of items) {
				const r = Math.random() * 100;
				const { idx } = ranges.find((range) => r <= range.upper)!;
				returnData[idx].push(item);
			}
		}

		/* ---------- Sequential ---------- */
		if (selectionMethod === 'sequential') {
			const staticData = this.getWorkflowStaticData('node');
			let current = (staticData.currentIndex as number | undefined) ?? 0;

			for (const item of items) {
				returnData[current].push(item);
				current = (current + 1) % configuredOutputs.length;
			}

			staticData.currentIndex = current;
		}

		return returnData;
	}
}
