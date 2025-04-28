/****************************************************************************************
 * AdvancedRandomizer.node.ts
 * ------------------------------------------------------------------
 * n8n custom node: roteia itens aleatoriamente, por porcentagem ou
 * sequencialmente para até 10 saídas.
 ****************************************************************************************/

import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType, // <- usado para tipar `outputs`
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

		/* ----------------------------------------------------------
		 * Portas
		 * ---------------------------------------------------------- */
		inputs: ['main'],
		// Força o tipo literal `'main'` para satisfazer o compilador
		outputs: Array<NodeConnectionType>(10).fill('main'),
		outputNames: [
			'Output 1', 'Output 2', 'Output 3', 'Output 4', 'Output 5',
			'Output 6', 'Output 7', 'Output 8', 'Output 9', 'Output 10',
		],

		/* ----------------------------------------------------------
		 * Campos visíveis no editor
		 * ---------------------------------------------------------- */
		properties: advancedRandomizerNodeOptions,
	};

	/* ======================================================================
	 * execute()
	 * ====================================================================*/
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		const selectionMethod = this.getNodeParameter<'random' | 'percentage' | 'sequential'>(
			'selectionMethod',
			0,
		);

		const outputsCfg = this.getNodeParameter<
			{ outputName: string; percentage?: number }[]
		>('outputs', 0, []);

		/* ---------- Validação de porcentagem ----------------------- */
		if (selectionMethod === 'percentage') {
			const total = outputsCfg.reduce((sum, o) => sum + (o.percentage ?? 0), 0);
			if (Math.abs(total - 100) > 0.01) {
				throw new Error(`The total percentage must be 100 % (got ${total}).`);
			}
		}

		/* ---------- Prepara as 10 saídas --------------------------- */
		const returnData: INodeExecutionData[][] = Array.from({ length: 10 }, () => []);

		/* ---------- Random ---------------------------------------- */
		if (selectionMethod === 'random') {
			for (const item of items) {
				const idx = Math.floor(Math.random() * outputsCfg.length);
				returnData[idx].push(item);
			}
		}

		/* ---------- Percentage ------------------------------------ */
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

		/* ---------- Sequential ------------------------------------ */
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
