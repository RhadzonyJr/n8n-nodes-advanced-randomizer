/****************************************************************************************
 * File: nodes/AdvancedRandomizer/AdvancedRandomizer.node.ts
 * Description: n8n custom node that routes items randomly, by percentage, or sequentially
 * Author: Rhadzony Jr
 * License: MIT
 ****************************************************************************************/

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { advancedRandomizerNodeOptions } from './AdvancedRandomizer.node.options';

export class AdvancedRandomizer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizer',
		group: ['transform'],
		version: 1,
		description: 'Route executions randomly, by percentage, or sequentially to multiple outputs.',
		defaults: { name: 'Advanced Randomizer' },
		icon: 'fa:random',

		/* n8n exige número fixo de portas; declaramos 10 (máx permitido nas opções).
		   Portas sem uso simplesmente não receberão itens. */
		inputs: ['main'],
		outputs: ['main','main','main','main','main','main','main','main','main','main'],

		/* Rótulos amigáveis que aparecem no editor */
		outputNames: [
			'Output 1','Output 2','Output 3','Output 4','Output 5',
			'Output 6','Output 7','Output 8','Output 9','Output 10',
		],

		properties: advancedRandomizerNodeOptions,
	};

	/******************************************************************
	 * execute()
	 ******************************************************************/
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const selectionMethod = this.getNodeParameter('selectionMethod', 0) as
			| 'random'
			| 'percentage'
			| 'sequential';

		const outputsCfg = this.getNodeParameter('outputs', 0, []) as {
			outputName: string;
			percentage?: number;
		}[];

		/* ---------- Validação de porcentagem ---------- */
		if (selectionMethod === 'percentage') {
			const total = outputsCfg.reduce((sum, o) => sum + (o.percentage ?? 0), 0);
			if (Math.abs(total - 100) > 0.01) {
				throw new Error(
					`The total percentage across all outputs must equal 100 % (got ${total}).`,
				);
			}
		}

		/* ---------- Prepara as saídas ---------- */
		const returnData: INodeExecutionData[][] = Array(10)
			.fill(null)
			.map(() => []);

		/* ---------- Random ---------- */
		if (selectionMethod === 'random') {
			for (const item of items) {
				const idx = Math.floor(Math.random() * outputsCfg.length);
				returnData[idx].push(item);
			}
		}

		/* ---------- Percentage ---------- */
		if (selectionMethod === 'percentage') {
			let acc = 0;
			const ranges = outputsCfg.map((o, i) => {
				acc += o.percentage ?? 0;
				return { upper: acc, i };
			});

			for (const item of items) {
				const r = Math.random() * 100;
				const target = ranges.find((rng) => r <= rng.upper);
				if (target) returnData[target.i].push(item);
			}
		}

		/* ---------- Sequential ---------- */
		if (selectionMethod === 'sequential') {
			const staticData = this.getWorkflowStaticData('node') as { current?: number };
			let current = staticData.current ?? 0;

			for (const item of items) {
				returnData[current].push(item);
				current = (current + 1) % outputsCfg.length;
			}
			staticData.current = current;
		}

		return returnData;
	}
}
