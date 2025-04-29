import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export class AdvancedRandomizer implements INodeType {
	/**
	 * Toda a informação de interface do node fica aqui.
	 * Isso dispensa a necessidade de description em .json.
	 */
	description: INodeTypeDescription = {
		displayName: 'Advanced Randomizer',
		name: 'advancedRandomizer',
		icon: 'file:AdvancedRandomizer.svg',
		group: ['transform'],
		version: 1,
		description: 'Distributes incoming items across any number of routes at random',
		defaults: {
			name: 'AdvancedRandomizer',
		},
		inputs: ['main'] as ['main'],
		outputs: ['main'] as ['main'],
		
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

	/**
	 * Execução: distribui os itens aleatoriamente entre
	 * as rotas definidas pelo usuário.
	 */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const routes = this.getNodeParameter('routes.route', 0, []) as IDataObject[];

		if (routes.length === 0) {
			throw new NodeOperationError(this.getNode(), 'You must define at least one route');
		}

		const outputs: INodeExecutionData[][] = Array.from({ length: routes.length }, () => []);

		for (const item of items) {
			const randomIndex = Math.floor(Math.random() * routes.length);
			outputs[randomIndex].push(item);
		}

		return outputs;
	}
}
