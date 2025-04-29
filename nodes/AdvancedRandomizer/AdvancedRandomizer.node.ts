import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class AdvancedRandomizerV1 implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizer',
		icon: 'file:AdvancedRandomizer.svg',
		group: ['transform'],
		version: 1,
		description: 'Route items randomly across multiple outputs',
		defaults: {
			name: 'AdvancedRandomizer',
		},
		inputs: ['main'],
		outputs: ['main'],
		outputNames: [], // preenchido dinamicamente abaixo
		properties: [
			{
				displayName: 'Routes',
				name: 'routes',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						displayName: 'Route',
						name: 'route',
						values: [
							{
								displayName: 'Rename Output',
								name: 'renameOutput',
								type: 'boolean',
								default: false,
							},
							{
								displayName: 'Output Name',
								name: 'outputName',
								type: 'string',
								default: '',
								displayOptions: {
									show: {
										renameOutput: [true],
									},
								},
							},
						],
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const routes = this.getNodeParameter('routes.route', 0, []) as IDataObject[];

		const numRoutes = routes.length;
		if (numRoutes === 0) {
			throw new Error('At least one route must be defined.');
		}

		// Prepara as saídas (uma array para cada rota)
		const returnData: INodeExecutionData[][] = Array.from({ length: numRoutes }, () => []);

		for (let i = 0; i < items.length; i++) {
			const item = items[i];

			// Escolhe aleatoriamente uma rota
			const randomIndex = Math.floor(Math.random() * numRoutes);

			// Envia para a rota escolhida
			returnData[randomIndex].push(item);
		}

		return returnData;
	}
}
