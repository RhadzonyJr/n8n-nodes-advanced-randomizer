import {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
  IExecuteFunctions,
  NodeApiError,
	NodeConnectionType,
} from 'n8n-workflow';

const MAX_OUTPUTS = 10;

export class AdvancedRandomizer implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Advanced Randomizer',
    name: 'advancedRandomizer',
    group: ['transform'],
    version: 1,
    description: 'Routes executions randomly or by defined percentages',
    defaults: {
      name: 'Advanced Randomizer'
    },
    subtitle: '={{"Mode: " + $parameter[\'mode\']}}',
		inputs: ['main'] as NodeConnectionType[],
		outputs: Array.from({ length: MAX_OUTPUTS }, () => 'main' as NodeConnectionType) as NodeConnectionType[],
    properties: [
      {
        displayName: 'Mode',
        name: 'mode',
        type: 'options',
        options: [
          { name: 'Random', value: 'random' },
          { name: 'Random %', value: 'randomPercentage' },
        ],
        default: 'random',
        description: 'Choose the randomization mode',
      },
      {
        displayName: 'Number of Outputs',
        name: 'numberOfOutputs',
        type: 'number',
        typeOptions: {
          minValue: 2,
          maxValue: 50,
        },
        default: 2,
        description: 'How many outputs to generate',
      },
      {
				displayName: 'Output Percentages',
				name: 'outputPercentages',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						mode: ['randomPercentage'],
					},
				},
				placeholder: 'Add Output Percentage',
				options: [
					{
						name: 'percentage',
						displayName: 'Percentage',
						values: [
							{
								displayName: 'Output Index',
								name: 'outputIndex',
								type: 'number',
								typeOptions: {
									minValue: 0,
								},
								default: 0,
							},
							{
								displayName: 'Percentage',
								name: 'percentage',
								type: 'number',
								typeOptions: {
									minValue: 0,
									maxValue: 100,
								},
								default: 0,
							},
						],
					},
				],
				default: {},
				description: 'Define the percentage for each output (must sum to 100%)',
			},
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const mode = this.getNodeParameter('mode', 0) as 'random' | 'randomPercentage';
    const numberOfOutputs = this.getNodeParameter('numberOfOutputs', 0) as number;

    const items = this.getInputData();
    const returnData: INodeExecutionData[][] = Array.from({ length: numberOfOutputs }, () => []);

    for (let i = 0; i < items.length; i++) {
      let outputIndex = 0;

      if (mode === 'random') {
        outputIndex = Math.floor(Math.random() * numberOfOutputs);
      } else if (mode === 'randomPercentage') {
        const percentagesCollection = this.getNodeParameter(
          'outputPercentages.percentages',
          0
        ) as Array<{ index: number; percentage: number }>;
        const totalPercentage = percentagesCollection.reduce((sum, p) => sum + p.percentage, 0);

        if (totalPercentage !== 100) {
          throw new NodeApiError(this.getNode(), {
            message: 'Total percentage must equal 100%'
          });
        }

        const random = Math.random() * 100;
        let cumulative = 0;
        for (const p of percentagesCollection) {
          cumulative += p.percentage;
          if (random <= cumulative) {
            outputIndex = p.index;
            break;
          }
        }
      }

      returnData[outputIndex].push(items[i]);
    }

    return returnData;
  }
}
