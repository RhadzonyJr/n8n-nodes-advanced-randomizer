import type { INodeParameters } from 'n8n-workflow';

export const configuredOutputs = (parameters: INodeParameters) => {
	const raw = (parameters.outputs as { output?: any })?.output;
	const rename = parameters.renameOutputs ?? false;

	const outputs = Array.isArray(raw)
		? raw
		: typeof raw === 'object' && raw !== null
		? [raw]
		: [];

	return outputs.map((output: any, index: number) => ({
		type: 'main',
		displayName: rename ? output?.outputName || `Output ${index}` : `${index}`,
	}));
};
