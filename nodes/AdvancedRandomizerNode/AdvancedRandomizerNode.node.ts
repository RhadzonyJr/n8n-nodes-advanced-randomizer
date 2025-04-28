/*
 * Advanced Randomizer Node for n8n
 * Author: Rhadzony Jr – with a hand from ChatGPT 😉
 *
 * Routes incoming items to multiple outputs using one of three strategies:
 *  • Pure Random   – each item goes to a random output with equal probability
 *  • Percentage    – weighted random based on user-defined percentages per output
 *  • Sequential    – round-robin cycling through outputs in a stable order
 */

import {
  IExecuteFunctions,
  IHookFunctions,
  IDataObject,
} from 'n8n-core';
import {
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow';

/**
 * Type helpers
 */
interface OutputPercentage extends IDataObject {
  output: number; // 1-based index
  percentage: number; // 0–100
}

export class AdvancedRandomizerNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Advanced Randomizer',
    name: 'advancedRandomizer',
    group: ['transform'],
    version: 1,
    description: 'Route items randomly, by percentage or sequentially',
    defaults: {
      name: 'Advanced Randomizer',
      color: '#60a5fa',
    },
    inputs: ['main'],
    outputs: ['main'], // Actual number of outputs is dynamic – see maxOutputs below
    maxOutputs: 10,
    icon: 'fa:random',
    credentials: [],
    properties: [
      {
        displayName: 'Routing Strategy',
        name: 'strategy',
        type: 'options',
        options: [
          {
            name: 'Pure Random',
            value: 'pureRandom',
            description: 'Route item to a random output with equal likelihood',
          },
          {
            name: 'Percentage',
            value: 'percentage',
            description: 'Weighted random based on percentages you define',
          },
          {
            name: 'Sequential',
            value: 'sequential',
            description: 'Round-robin through outputs (1-N, repeat)',
          },
        ],
        default: 'pureRandom',
        description: 'How do you want to choose the next output?',
      },
      {
        displayName: 'Number of Outputs',
        name: 'outputCount',
        type: 'number',
        typeOptions: {
          minValue: 2,
          maxValue: 10,
        },
        default: 2,
        description: 'How many outputs should the node expose? (2-10) — remember to add the corresponding connections in the UI',
      },
      // ---------- Percentage strategy sub-collection ----------
      {
        displayName: 'Percentages',
        name: 'percentages',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        placeholder: 'Add Percentage',
        default: [],
        options: [
          {
            name: 'percentage',
            displayName: 'Percentage',
            values: [
              {
                displayName: 'Output',
                name: 'output',
                type: 'number',
                default: 1,
                typeOptions: {
                  minValue: 1,
                  maxValue: 10,
                },
                description: '1-based index of the output',
              },
              {
                displayName: 'Percentage',
                name: 'percentage',
                type: 'number',
                default: 50,
                typeOptions: {
                  minValue: 0,
                  maxValue: 100,
                  step: 1,
                },
                description: 'Weight (0-100). All entries must sum to 100%',
              },
            ],
          },
        ],
        displayOptions: {
          show: {
            strategy: ['percentage'],
          },
        },
      },
    ],
  };

  /**
   * Main executor — runs once per input item.
   */
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Determine the number of configured outputs
    const outputCount = this.getNodeParameter('outputCount', 0) as number;
    if (outputCount < 2 || outputCount > 10) {
      throw new NodeOperationError(this.getNode(), 'Output count must be between 2 and 10');
    }

    // Prepare empty arrays for each output
    const returnData: INodeExecutionData[][] = Array.from({ length: outputCount }, () => []);

    const strategy = this.getNodeParameter('strategy', 0) as string;

    // For sequential strategy we keep state in workflow static data
    const staticData = this.getWorkflowStaticData('node');
    if (staticData.nextIndex === undefined) {
      staticData.nextIndex = 0;
    }

    // Pre-calculate cumulative percentage ranges if needed
    let ranges: { end: number; index: number }[] = [];
    if (strategy === 'percentage') {
      const percentageEntries = (this.getNodeParameter('percentages', 0, []) as IDataObject[]) as OutputPercentage[];
      if (!percentageEntries.length) {
        throw new NodeOperationError(this.getNode(), 'Please define at least one percentage entry');
      }

      let sum = 0;
      ranges = percentageEntries.map((entry) => {
        sum += entry.percentage;
        return { end: sum, index: (entry.output ?? 1) - 1 };
      });

      if (Math.round(sum) !== 100) {
        throw new NodeOperationError(this.getNode(), 'Percentages must total 100%');
      }
    }

    // Iterate through incoming items
    const items = this.getInputData();
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const item = items[itemIndex];
      let targetIndex = 0; // zero-based index of output

      switch (strategy) {
        case 'pureRandom':
          targetIndex = Math.floor(Math.random() * outputCount);
          break;
        case 'percentage': {
          const r = Math.random() * 100;
          // Find the first range where r < end
          targetIndex = ranges.find((range) => r < range.end)?.index ?? 0;
          // Validate targetIndex within bounds
          if (targetIndex >= outputCount) targetIndex = outputCount - 1;
          break;
        }
        case 'sequential':
          targetIndex = staticData.nextIndex % outputCount;
          staticData.nextIndex = (staticData.nextIndex + 1) % outputCount;
          break;
        default:
          throw new NodeOperationError(this.getNode(), `Unknown strategy: ${strategy}`);
      }

      // Push the item to the selected output
      returnData[targetIndex].push(item);
    }

    return returnData;
  }
}
