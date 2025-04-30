import type { INodeTypeDescription, IVersionedNodeType } from 'n8n-workflow';
import { VersionedNodeType } from 'n8n-core';

import { AdvancedRandomizerV1 } from './V1/AdvancedRandomizerV1.node';
import { AdvancedRandomizerV2 } from './V2/AdvancedRandomizerV2.node';
import { AdvancedRandomizerV3 } from './V3/AdvancedRandomizerV3.node';

export class AdvancedRandomizer extends VersionedNodeType {
	constructor() {
		const baseDescription: INodeTypeDescription = {
			displayName: 'Advanced Randomizer',
			name: 'advancedRandomizerNode',
			icon: 'file:advancedRandomizerNode.svg',
			group: ['transform'],
			description: 'Route executions randomly with customizable outputs and percentages',
			defaultVersion: 3,
		};

		const nodeVersions: IVersionedNodeType['nodeVersions'] = {
			1: new AdvancedRandomizerV1(baseDescription),
			2: new AdvancedRandomizerV2(baseDescription),
			3: new AdvancedRandomizerV3(baseDescription),
		};

		super(nodeVersions, baseDescription);
	}
}
