import type { INodeProperties } from 'n8n-workflow';

/**
 * ---------------------------------------------------------------------------------------------------------------------
 *  Advanced Randomizer – UI schema
 *  --------------------------------------------------------------------------------------------------------------------
 *  1. A single **Method** select at the top (Random | Percentage | Sequential)
 *  2. One *Fixed-collection* called **routingRules** (multi-value) – each entry becomes an output.
 *     ├─ Rename Output  (Boolean) → when `true` show **outputName** (string)
 *     └─ Percentage     (Number)  → visible **only** when Method === 'percentage'
 *
 *  NB: n8n uses the *displayOptions.* section on every field to decide when it is shown.
 */

export const advancedRandomizerNodeOptions: INodeProperties[] = [
	/* -------------------------------------------------------------------------------------------------------------- */
	{
		displayName: 'Method',
		name: 'method',
		type: 'options',
		default: 'random',
		options: [
			{
				name: 'Random',
				value: 'random',
				description: 'Escolhe aleatoriamente uma das rotas',
			},
			{
				name: 'Percentage',
				value: 'percentage',
				description: 'Escolhe de acordo com a porcentagem definida em cada rota',
			},
			{
				name: 'Sequential',
				value: 'sequential',
				description: 'Envia em ordem sequencial, reiniciando no fim',
			},
		],
	},
	/* -------------------------------------------------------------------------------------------------------------- */
	{
		displayName: 'Routing Rules',
		name: 'routingRules',
		type: 'fixedCollection',
		placeholder: 'Add Routing Rule',
		typeOptions: {
			multipleValues: true,
		},
		default: {},
		options: [
			{
				displayName: 'Rule',
				name: 'rule',
				values: [
					/* ------------------------------ Rename Output switch ------------------------------------ */
					{
						displayName: 'Rename Output',
						name: 'renameOutput',
						type: 'boolean',
						default: false,
						description:
							'Se ativado, define um nome customizado visível no canvas para esta saída',
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

					/* ------------------------------ Percentage (only if method == percentage) --------------- */
					{
						displayName: 'Percentage',
						name: 'percentage',
						type: 'number',
						default: 0,
						typeOptions: {
							minValue: 0,
							maxValue: 100,
						},
						displayOptions: {
							show: {
								'/method': ['percentage'],
							},
						},
						description:
							'Chance (0-100) desta rota ser escolhida. A soma de todas as rotas deve ser 100%',
					},
				],
			},
		],
	},
];
