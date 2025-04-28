import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { advancedRandomizerNodeOptions } from './AdvancedRandomizerNode.node.options';

export class AdvancedRandomizerNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizerNode',
		icon: 'file:AdvancedRandomizerNode.svg',
		group: ['transform'],
		version: 1,
		description:
			'Divide a execução em múltiplas saídas com lógica Random / Percentage / Sequential',
		defaults: {
			name: 'Advanced Randomizer',
		},
		inputs: ['main'],
		// 25 é um limite seguro. Apenas as primeiras N (N = nº de rotas) serão usadas.
		outputs: ['main', 'main', 'main', 'main', 'main', 'main', 'main', 'main', 'main', 'main',
			'main', 'main', 'main', 'main', 'main', 'main', 'main', 'main', 'main', 'main',
			'main', 'main', 'main', 'main', 'main'],
		properties: advancedRandomizerNodeOptions,
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const method = this.getNodeParameter<'random' | 'percentage' | 'sequential'>(
			'method',
			0,
		);

		// `routingRules` vem como objeto { rule: [...] }
		const rules = (this.getNodeParameter('routingRules', 0, []) as IDataObject)
			.rule as IDataObject[];

		const outputCount = rules.length;
		if (outputCount === 0) {
			throw new Error('Pelo menos uma Routing Rule deve ser adicionada.');
		}

		// -------------------- Método Random ------------------------------------------------------------
		const pickRandom = (): number => Math.floor(Math.random() * outputCount);

		// -------------------- Método Sequential --------------------------------------------------------
		const data = this.getWorkflowStaticData('node') as { index?: number };
		const pickSequential = (): number => {
			const current = data.index ?? 0;
			data.index = (current + 1) % outputCount;
			return current;
		};

		// -------------------- Método Percentage --------------------------------------------------------
		let cumulative: number[] = [];
		if (method === 'percentage') {
			const percentages = rules.map((r) =>
				Number((r.percentage ?? 0) as unknown as number),
			);
			const sum = percentages.reduce((a, b) => a + b, 0);
			if (sum !== 100) {
				throw new Error(
					`A soma das porcentagens deve ser 100 (atualmente ${sum}).`,
				);
			}
			let acc = 0;
			cumulative = percentages.map((p) => (acc += p));
		}
		const pickPercentage = (): number => {
			const rnd = Math.random() * 100;
			return cumulative.findIndex((c) => rnd < c);
		};

		// -------------------- Roteamento dos itens ----------------------------------------------------
		const outputs: INodeExecutionData[][] = Array.from(
			{ length: this.description.outputs!.length },
			() => [],
		);

		for (const item of items) {
			let index = 0;
			switch (method) {
				case 'random':
					index = pickRandom();
					break;
				case 'sequential':
					index = pickSequential();
					break;
				case 'percentage':
					index = pickPercentage();
					break;
			}
			// Clone o item antes de empurrar
			const newItem: INodeExecutionData = { json: { ...item.json } };
			outputs[index].push(newItem);
		}

		return outputs;
	}
}
