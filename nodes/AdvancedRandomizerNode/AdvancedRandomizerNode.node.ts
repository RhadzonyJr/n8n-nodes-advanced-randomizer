import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

/**
 * AdvancedRandomizer
 *
 * – Random: escolhe uma rota aleatória
 * – Percentage: distribui conforme porcentagens definidas (a soma deve ser 100)
 * – Sequential: round‑robin entre as rotas
 */
export class AdvancedRandomizerNode implements INodeType {
	/**
	 * Descrição (exibida no Editor UI)
	 */
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizer',
		icon: 'file:advancedRandomizerNode.svg',
		group: ['transform'],
		version: 1,
		description: 'Routes items randomly, sequentially or by percentage',
		defaults: {
			name: 'Advanced Randomizer',
		},
		// No momento o n8n precisa que o número de saídas seja fixo na descrição.
		// Definimos uma saída "main" por padrão. O editor cria saídas adicionais
		// automaticamente de acordo com as rotas que o usuário adicionar.
		inputs: ['main'],
		outputs: ['main'],

		properties: [
			/* -------------------------------------------------------------------------- */
			/*                                 General                                    */
			/* -------------------------------------------------------------------------- */
			{
				displayName: 'Method',
				name: 'method',
				type: 'options',
				options: [
					{ name: 'Random', value: 'random' },
					{ name: 'Percentage', value: 'percentage' },
					{ name: 'Sequential', value: 'sequential' },
				],
				default: 'random',
				description: 'How items should be routed',
			},

			/* -------------------------------------------------------------------------- */
			/*                                  Routes                                    */
			/* -------------------------------------------------------------------------- */
			{
				displayName: 'Routing Rules',
				name: 'routes',
				type: 'fixedCollection',
				placeholder: 'Add Route',
				typeOptions: {
					multipleValueButtonText: 'Add Route',
					multipleValues: true,
				},
				default: [],
				options: [
					{
						name: 'route',
						displayName: 'Route',
						values: [
							{
								displayName: 'Rename Output',
								name: 'rename',
								type: 'boolean',
								default: false,
							},
							{
								displayName: 'Output Name',
								name: 'outputName',
								type: 'string',
								displayOptions: {
									show: {
										rename: [true],
									},
								},
								default: '',
								description: 'Name used for the corresponding output',
							},
							{
								displayName: 'Percentage',
								name: 'percentage',
								type: 'number',
								typeOptions: {
									minValue: 0,
									maxValue: 100,
								},
								displayOptions: {
									show: {
										'/method': ['percentage'],
									},
								},
								default: 0,
								description: 'Chance (in %) that this route will be chosen',
							},
						],
					},
				],
			},
		],
	};

	/**
	 * Lógica de execução
	 */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const method = this.getNodeParameter('method', 0) as 'random' | 'percentage' | 'sequential';
		const routes = (this.getNodeParameter('routes.route', 0, []) as Array<{
			rename: boolean;
			outputName?: string;
			percentage?: number;
		}>);

		const numberOfRoutes = routes.length || 1;
		const outputData: INodeExecutionData[][] = Array.from({ length: numberOfRoutes }, () => []);

		let seqIndex = (this.getWorkflowStaticData('node') as { idx?: number }).idx ?? 0;

		for (const item of items) {
			let target = 0;

			switch (method) {
				case 'random':
					target = Math.floor(Math.random() * numberOfRoutes);
					break;

				case 'percentage': {
					const total = routes.reduce((sum, r) => sum + (r.percentage ?? 0), 0);
					if (total !== 100) {
						throw new Error('Sum of route percentages must equal 100');
					}
					const pick = Math.random() * 100;
					let acc = 0;
					for (let i = 0; i < numberOfRoutes; i++) {
						acc += routes[i].percentage ?? 0;
						if (pick <= acc) {
							target = i;
							break;
						}
					}
					break;
				}

				case 'sequential':
					target = seqIndex % numberOfRoutes;
					seqIndex++;
					break;
			}

			outputData[target].push(item);
		}

		if (method === 'sequential') {
			(this.getWorkflowStaticData('node') as { idx?: number }).idx = seqIndex;
		}

		return outputData;
	}
}

export default AdvancedRandomizerNode;
