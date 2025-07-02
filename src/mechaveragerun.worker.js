import { global, setGlobal } from '../evolve/src/vars.js';
import { genSpireFloor, mechRating } from '../evolve/src/portal.js';

import { getMedianFromArray, Datum, Floorum, sortNumbers } from './data.js'
import { doTheWeaponFactorThing, doTheTerrainFactorThing } from './mechfactors.js'

onmessage = (e) => {
	switch(e.data['a']){
		case 'start':
			startWork(e.data);
			break;
		case 'stop':
			stopWork();
			break;
		default:
			const workerResult = `>working hard>${e.data[0]} ${global.seed}`;
			postMessage(workerResult);
			break;
	}
};

var wId = 0;
var runTimer;
var isRunning = false;

const CHUNK_SIZE = 75;
var STOP_NOW = false;
var MAX_RUNS = 200;
var FLOOR_LENGTH = 50;
var progressFreq = 1;

var spareGlobal;
var mechBay = [];
var edenTax = 0;
var edenMechs = 0;
var startFloor = 1;
var runs = 0;
var TOTAL_CALCS = 0;
var precise = false;

function startWork(data){
	clearTimeout(runTimer);
	STOP_NOW = false;
	isRunning = true;
	
	if(data['mechs'] && data['mechs'].length > 0 && data['global']){
		wId = data.wId;
		
		spareGlobal = data['global'];
		setGlobal(spareGlobal);
		global.portal.mechbay = { count: 0, on: 0, bay: 0, max: 0, active: 0, scouts: 0, mechs: [] };
		global.portal.mechbay.mechs = data.mechs;
		
		edenTax = (data.edenTax > 0);
		edenMechs = data.edenTax || 0;
		let combatMechs = 0;
		let taxed = 0;
		for(let mech of global.portal.mechbay.mechs){
			if(mech.size == 'collector')
				continue;
			if(mech.size == 'small' || mech.size == 'minion'){
				global.portal.mechbay.scouts++;
				if(mech.equip.includes('scouter')) global.portal.mechbay.scouts++;
			}
			if(taxed < edenMechs)
				taxed++;
			else
				combatMechs++;
		}
		
		if(combatMechs == 0){
			if(edenMechs > 0)
				postMessage({'a': 'error', 'error': 'mechs_busy'});
			else
				postMessage({'a': 'error', 'error': 'no_mechs'});
			return;
		}
		
		precise = (data['precise'] == true);
		startFloor = data['global'].portal.spire.count || 1;
		startFloor = data['start'];
		global.portal.spire.count = startFloor;
		FLOOR_LENGTH = data['length'];
		MAX_RUNS = data['repeats'];
		TOTAL_CALCS = MAX_RUNS * FLOOR_LENGTH;
		
		progressFreq = Math.min(Math.max(Math.round(MAX_RUNS / 100), 1), 15);
		runs = 0;
		runTimer = setTimeout(runSomething, 200 + data.wId * 3);
		//postMessage(`>> W${wId}: Starting run with ${global.portal.mechbay.mechs.length} mechs${(combatMechs != global.portal.mechbay.mechs.length)? ` [${combatMechs} combat ready]` : ``}${(taxed > 0)? ` [${taxed} stuck in Eden]` : ``}. ${data['start']}->${(parseInt(data['start']) + parseInt(data['length']))} x ${data['repeats']} // ${progressFreq}`);
	}
	else {
		postMessage({'a': 'error', 'error': 'no_mechs'});
	}
}

function stopWork(){
	STOP_NOW = true;
	clearTimeout(runTimer);
	if(isRunning)
		postMessage({'a':'done', 'w': wId});
	
	isRunning = false;
}

function runSomething(){
	
	global['seed'] = Math.rand(0,10000);
	global['warseed'] = Math.rand(0,10000);
	
	let defaultTimeout = true;
	let effiResults = [];
	let timeResults = [];
	let effiData = new Datum();
	let timeData = new Datum();
	let slowestFloor = { 'e': new Floorum(0, 0, 0, {}), 't': new Floorum(0, 0, 0, {}) };
	//runs = 0;
	
	// Calculate point to resume from, after Yield in previous cycle (if applicable)
	let iterationChunk = Math.floor(runs / CHUNK_SIZE);
	
	// Do the floor calcs repeatedly
	for(var i = 0; (iterationChunk * CHUNK_SIZE + i) < MAX_RUNS; i++){
		global.portal.spire.status = {}
		genSpireFloor();
		let mavg = 0;
		let combatMechs = 0;
		let rating = 0;
		let taxed = 0;
		for(var j = 0; j < global.portal.mechbay.mechs.length; j++){
			if(global.portal.mechbay.mechs[j].size == 'collector') continue;
			if(taxed < edenMechs){
				taxed++;
				continue;
			}
			rating += mechRating(global.portal.mechbay.mechs[j], false);
			mavg = (doTheWeaponFactorThing(global.portal.mechbay.mechs[j]) * doTheTerrainFactorThing(global.portal.mechbay.mechs[j]) + combatMechs * mavg) / (combatMechs +1);
			combatMechs++;
		}
		if(mavg > effiData.max) effiData.max = mavg;
		if(mavg < effiData.min) {
			effiData.min = mavg;
			slowestFloor.e = new Floorum(global.portal.spire.count, global.portal.spire.boss, global.portal.spire.type, global.portal.spire.status);
		}
		effiData.avg = (mavg + effiData.avg * i) / (i +1);
		
		effiResults.push(mavg);
		
		let thisTime = (rating > 0)? 100 / rating : 0;
		if(thisTime == 0) {
			timeData.max = -1;
			slowestFloor.t = new Floorum(global.portal.spire.count, global.portal.spire.boss, global.portal.spire.type, global.portal.spire.status);
		}
		if(timeData.max !== -1 && thisTime > timeData.max) {
			timeData.max = thisTime;
			slowestFloor.t = new Floorum(global.portal.spire.count, global.portal.spire.boss, global.portal.spire.type, global.portal.spire.status);
		}
		if(thisTime > 0 && thisTime < timeData.min) timeData.min = thisTime;
		timeData.avg = (((thisTime > 0)? thisTime : timeData.avg) + timeData.avg * i) / (i +1);
		
		timeResults.push(thisTime);
		
		runs++;
		
		// Yield
		if(runs % CHUNK_SIZE == 0)
			break;
			
	}
	
	// Listen for forced stop signal
	if(STOP_NOW){
		// Cleanup
		effiResults.length = 0;
		timeData.length = 0;
		
		STOP_NOW = false;
		postMessage({'a':'done', 'w': wId});
		return;
	}
	
	if(runs % CHUNK_SIZE != 0)
		defaultTimeout = false;
	
	// Handle medians
	effiResults.sort(sortNumbers);
	timeResults.sort(sortNumbers);
	
	if(effiResults.length > 4 && !precise){
		effiData.med = [
			effiResults[0], 
			getMedianFromArray(effiResults.slice(0, Math.ceil(effiResults.length / 2))), 
			getMedianFromArray(effiResults), 
			getMedianFromArray(effiResults.slice(Math.floor(effiResults.length / 2))), 
			effiResults[effiResults.length - 1]
		];
		timeData.med = [
			timeResults[0], 
			getMedianFromArray(timeResults.slice(0, Math.ceil(timeResults.length / 2))), 
			getMedianFromArray(timeResults),
			getMedianFromArray(timeResults.slice(0, Math.floor(timeResults.length / 2))), 
			timeResults[timeResults.length - 1]
		];
	}
	if(effiResults.length > 2 && !precise){
		effiData.med = [effiResults[0], getMedianFromArray(effiResults), effiResults[effiResults.length - 1]];
		timeData.med = [timeResults[0], getMedianFromArray(timeResults), timeResults[timeResults.length - 1]];
	}
	else{
		effiData.med = getMedianFromArray(effiResults);
		timeData.med = getMedianFromArray(timeResults);
	}
	
	// Post results
	postMessage({'a':'result', 'f': global.portal.spire.count, 'e': effiData, 't': timeData, 'raw': ( precise ? {'e': effiResults, 't': timeResults} : null ), 'slow': slowestFloor});
	
	// Progress report
	if((global.portal.spire.count + (global.portal.spire.count - startFloor) * runs) % progressFreq == 0)
		postMessage({'a':'progress', 'w': wId, 'progress': ((global.portal.spire.count - startFloor) * MAX_RUNS + runs / MAX_RUNS) / TOTAL_CALCS});
	
	// Start next floor
	if(runs >= MAX_RUNS){
		global.portal.spire.count++;
		runs = 0;
	}
	
	if((global.portal.spire.count - startFloor) >= FLOOR_LENGTH) {
		// Done!
		postMessage({'a':'progress', 'w': wId, 'progress': 1});
		postMessage({'a':'done', 'w': wId});
		isRunning = false;
		
		// Cleanup
		effiResults.length = 0;
		timeData.length = 0;
		return;
	}
	else {
		// Go to next cycle
		runTimer = setTimeout(runSomething, (defaultTimeout)? 5 : 0);
	}
}
