export const truncationOptions = [
	{
		short: 'Short',
		full: 'Truncate weapon descriptions',
		val: true
	},
	{
		short: 'Full',
		full: 'Show full descriptions',
		val: false
	},
];

export const listSortingOptions = [
	{
		short: 'Disabled',
		full: 'Disabled',
		val: 0
	},
	{
		short: 'Factor \u{03a3}',
		full: 'Auto sort by factor',
		val: 1
	},
	{
		short: 'Rating #',
		full: 'Auto sort by rating',
		val: 2
	},
	{
		short: 'Size',
		full: 'Auto sort by size',
		val: 3
	},
	{
		short: 'Original',
		full: 'Original order',
		val: 4
	},
];

export const sortingDirectionOptions = [
	{
		short: '\u{2191}',
		full: 'Descending',
		val: -1
	},
	{
		short: '\u{2193}',
		full: 'Ascending',
		val: 1
	},
];

export const listGroupingOptions = [
	{
		short: 'Disabled',
		full: 'Disabled',
		val: 0
	},
	{
		short: 'Size',
		full: 'Group by size',
		val: 1
	},
	{
		short: 'Chassis',
		full: 'Group by chassis',
		val: 2
	},
];

export const mathVisualStyles = [
	{
		short: 'A',
		full: 'Style A',
		val: 'visStyleA'
	},
	{
		short: 'B',
		full: 'Style B',
		val: 'visStyleB'
	},
	{
		short: 'C',
		full: 'Style C',
		val: 'visStyleC'
	},
]

export const infoTableVisibilityOptions = [
	{
		short: '<svg class="bi" width="1em" height="1em" fill="currentColor"><use xlink:href="/icons/icons.svg#info-square-fill"/></svg>',
		full: 'Display effectiveness summary table',
		val: true
	},
	{
		short: '<svg class="bi" width="1em" height="1em" fill="currentColor"><use xlink:href="/icons/icons.svg#info-square-fill"/></svg>',
		full: 'Hide effectiveness summary table',
		val: false
	},
];

export const pagerVisibilityOptions = [
	{
		short: '<svg class="bi" width="1.1em" height="1.1em" fill="currentColor"><use xlink:href="/icons/icons.svg#eye"/></svg>',
		full: 'Display mech lists',
		val: true
	},
	{
		short: '<svg class="bi" width="1.1em" height="1.1em" fill="currentColor"><use xlink:href="/icons/icons.svg#eye-slash"/></svg>',
		full: 'Hide mech lists',
		val: false
	},
];