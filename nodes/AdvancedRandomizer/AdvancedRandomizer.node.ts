import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeBaseDescription,
	INodeTypeDescription,
} from 'n8n-workflow';

import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';

/**
 *  AdvancedRandomizer – distribui itens aleatoriamente
 *  entre N rotas configuradas pelo usuário.
 */
export class AdvancedRandomizer implements INodeType {
	description: INodeTypeDescription;

	constructor(baseDescription: INodeTypeBaseDescription) {
		this.description = {
			...baseDescription,
			version: [1],
			defaults: {
				name: 'AdvancedRandomizer',
				color: '#506000',
			},
			inputs: [NodeConnectionTypes.Main],
			// declaramos o “máximo” de saídas que o node pode ter
			outputs: Array.from({ length: 10 }, () => NodeConnectionTypes.Main),
			outputNames: Array.from({ length: 10 }, (_, i) => i.toString()),
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
							name: 'route',
							displayName: 'Route',
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
					description:
						'Add as many routes as you need; each one becomes a new output',
				},
			],
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		// rota = routes.route[]  (array de objetos)
		const routes = this.getNodeParameter(
			'routes.route',
			0,
			[],
		) as IDataObject[];

		if (routes.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'You must define at least one route',
			);
		}
		if (routes.length > 10) {
			throw new NodeOperationError(
				this.getNode(),
				'Maximum number of routes is 10',
			);
		}

		// cria N saídas
		const outputs: INodeExecutionData[][] = Array.from(
			{ length: routes.length },
			() => [],
		);

		for (const item of items) {
			const idx = Math.floor(Math.random() * routes.length); // índice aleatório
			outputs[idx].push(item);
		}

		return outputs;
	}
}
