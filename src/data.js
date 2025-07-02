export function Datum() {
	this.min = Number.MAX_VALUE;
	this.max = Number.MIN_VALUE;
	this.med = 0;
	this.avg = 0;
}

export function Floorum(floor, boss, terrain, hazards) {
	this.count = floor;
	this.boss = boss;
	this.type = terrain;
	this.status = structuredClone(hazards);
}
Floorum.areEqual = function(one, another) {
	if(!one || !another) return false;
	if(one.count != another.count) return false;
	if(one.boss != another.boss) return false;
	if(one.type != another.type) return false;
	let keysA = Object.keys(one.status);
	let keysB = Object.keys(another.status);
	if(keysA.length != keysB.length) return false;
	for(let s of keysA){
		if(!keysB.includes(s)) return false;
	}
	
	return true;
}

export function getMedianFromArray(data){
	if(data.length == 0) return 0;
	return (data.length % 2 == 0)? (data[data.length/2 - 1] + data[data.length/2])/2 : data[(data.length + 1)/2 - 1];
}

export function lerp(a, b, t) {
	return a + t * (b - a);
}
export function invlerp(a, b, c) {
	if(b == a)
		return 0;
	return (c - a) / (b - a);
}

export function sortNumbers(a, b){
	return a - b;
}

export function shrinkArray(v, i, arr){
	let factor = (this && Number.isInteger(this))? this - 1 : 199;
	if(arr.length <= factor)
		return true;
	if(i % Math.floor(arr.length / factor) == 0 || (i + 1) == arr.length)
		return true;
	return false;
};

export function shrinkMedianArray(v, i, arr){
	let factor = (this && Number.isInteger(this))? this - 1 : 199;
	if(arr.length <= factor)
		return true;
	
	// shift 0 if array length is Odd
	let eventodd = ( arr.length + 1 ) % 2;
	let middleRight = (arr.length - eventodd + 1)/2 + eventodd - 1;
	// shift 0 if ( i - middle ) >= 0 , -1 if ( i - middle ) < 0
	let shift = (i - middleRight) >> 31;
	return (( ( i - middleRight - shift * eventodd) % Math.floor( arr.length / factor ) ) == 0 || ( i % ( arr.length - 1 ) ) == 0);
};

export const evolve = {
	spire: {
		terrain: ['sand','swamp','forest','jungle','rocky','gravel','muddy','grass','brush','concrete'],
		hazards: ['freeze','hot','corrosive','humid','windy','hilly','mountain','radioactive','quake','dust','river','tar','steam','flooded','fog','rain','hail','chasm','dark','gravity'],
	},
	mech: {
		size: {
			standard:	['small','medium','large','titan','collector'],
			warlord:	['minion','fiend','cyberdemon','archfiend'],
		},
		type: {
			standard:		['wheel','tread','biped','quad','spider','hover'],
			'minion':		['imp','flying_imp','hound','harpy','barghest'],
			'fiend':		['cambion','minotaur','nightmare','rakshasa','golem'],
			'cyberdemon':	['wheel','tread','biped','quad','spider','hover'],
			'archfiend':	['dragon','snake','gorgon','hydra'],
		},
		equip: {
			standard:		['special','shields','sonar','grapple','infrared','flare','radiator','coolant','ablative','stabilizer','seals'],
			warlord:		['scavenger','scouter','darkvision','echo','thermal','manashield','cold','heat','athletic','lucky','stoneskin'],
		},
	},
};
