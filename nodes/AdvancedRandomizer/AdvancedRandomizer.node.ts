import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
} from 'n8n-workflow';

import { advancedRandomizerNodeOptions } from './AdvancedRandomizer.node.options';

export class AdvancedRandomizer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizer',
		group: ['transform'],
		version: 1,
		description: 'Route executions randomly, by percentage, or sequentially to multiple outputs.',
		defaults: {
			name: 'Advanced Randomizer',
		},
		inputs: ['main'],
		outputs: ['main'], // Será ajustado dinamicamente conforme os outputs configurados
		properties: advancedRandomizerNodeOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const selectionMethod = this.getNodeParameter('selectionMethod', 0) as string;
		const outputs = this.getNodeParameter('outputs', 0, []) as {
			outputName: string;
			percentage?: number;
		}[];

		// 📌 Validação: Soma de porcentagens se selectionMethod = percentage
		if (selectionMethod === 'percentage') {
			const totalPercentage = outputs.reduce((acc, output) => {
				return acc + (output.percentage ?? 0);
			}, 0);

			if (Math.abs(totalPercentage - 100) > 0.01) {
				throw new Error(`The total percentage across all outputs must equal 100%. Current total: ${totalPercentage.toFixed(2)}%.`);
			}
		}

		// 📦 Inicializa as saídas
		const returnData: INodeExecutionData[][] = [];
		for (let i = 0; i < outputs.length; i++) {
			returnData.push([]);
		}

		// 🎲 Método Random
		if (selectionMethod === 'random') {
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				const randomIndex = Math.floor(Math.random() * outputs.length);
				returnData[randomIndex].push(items[itemIndex]);
			}
		}

		// 🎯 Método Percentage
		if (selectionMethod === 'percentage') {
			const ranges: { upperBound: number; index: number }[] = [];
			let accumulated = 0;

			for (let i = 0; i < outputs.length; i++) {
				accumulated += outputs[i].percentage ?? 0;
				ranges.push({
					upperBound: accumulated,
					index: i,
				});
			}

			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				const randomNumber = Math.random() * 100;
				for (const range of ranges) {
					if (randomNumber <= range.upperBound) {
						returnData[range.index].push(items[itemIndex]);
						break;
					}
				}
			}
		}

		// 🔁 Método Sequential
		if (selectionMethod === 'sequential') {
			const staticData = this.getWorkflowStaticData('node');
			let currentIndex = staticData.currentIndex as number | undefined;
			if (currentIndex === undefined) {
				currentIndex = 0;
			}

			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				returnData[currentIndex].push(items[itemIndex]);
				currentIndex++;
				if (currentIndex >= outputs.length) {
					currentIndex = 0;
				}
			}

			staticData.currentIndex = currentIndex;
		}

		return returnData;
	}
}
