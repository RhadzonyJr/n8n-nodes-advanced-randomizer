import {
	IExecuteFunctions,
	INodeType,
	INodeExecutionData,
	IDataObject,
	NodeOperationError,
} from 'n8n-workflow';

export class AdvancedRandomizer implements INodeType {
	description = {} as any;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const routes = this.getNodeParameter('routes.route', 0, []) as IDataObject[];

		if (!Array.isArray(routes) || routes.length === 0) {
			throw new NodeOperationError(this.getNode(), 'You must define at least one route');
		}

		const numRoutes = routes.length;
		const returnData: INodeExecutionData[][] = Array.from({ length: numRoutes }, () => []);

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const randomIndex = Math.floor(Math.random() * numRoutes);
			returnData[randomIndex].push(item);
		}

		return returnData;
	}
}
