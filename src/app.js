import { global, setGlobal } from '../evolve/src/vars.js';

import { listSortingOptions, sortingDirectionOptions } from './settings.js';
import { sampleMechBay, oopsAllCollectors, rainbowMechBay } from './samplemechs.js';

export const numFormat = new Intl.NumberFormat(undefined);

export const app = {
	version: '1.0.0',
	LS_SString: 'storedSaveString',
	LS_Config: 'storedConfig',
	LS_MechList: 'favMechs',
	LS_MechBucket: 'mechBucket_',
	LS_PageLabels: 'storedLabels',
	LS_Heap: 'storedRandomStuff',
	info: ['Mech Cheat Sheet', 'by Akudeu Kie', 'http://', 'for %0 v%1 %2', 'https://pmotschmann.github.io/Evolve/', 'Evolve Incremental', '1.4.8', 'by Demagorddon'],
	maxMechBuckets: 4,
	maxStatus: 4,
	maxMechPages: 15,
	localStorage: false,
	config: {
		warlord: false,
		prepared: 0,
		wrath: 0,
		gladiator: 0,
		scouts: 0,
		resets: 0,
		showInfoTable: true,
		defaultMSize: 'medium',
		defaultMType: 'tread',
		truncateWeapons: true,
		sortingType: listSortingOptions[0].val,
		sortingDirection: sortingDirectionOptions[0].val,
		groupingType: 0,
		mathVisStyle: 0,
		calculatorVisibility: false,
		avgStart: 1,
		avgLength: 20,
		avgRepeats: 10,
		avgThreads: 4,
		preciseMedians: false,
		avgEdenTax: true,
		pagerVisibility: 0,
		defaultPage: 0,
		locale: 'en-US'
	},
	labels: {},
	heap: {},
	
    events: {},
	EV_CONSTRUCTOR: 'eon_constructor',
	EV_CLOSE_DROPDOWNS: 'eon_closedropdowns',

    on: function(event, callback) {
        let handlers = app.events[event] || [];
        handlers.push(callback);
        app.events[event] = handlers;
    },
	
    off: function(event, callback) {
        let handlers = app.events[event] || [];
		if(callback){
			let cix = handlers.indexOf(callback);
			if(cix != -1){
				handlers.splice(cix, 1);
			}
			app.events[event] = handlers;
		}
		else{
			app.events[event] = [];
		}
    },

    dispatchEvent: function(event, data) {
        let handlers = app.events[event];

        if (!handlers || handlers.length < 1)
            return;

        handlers.forEach(function(handler){
            handler(data);
        });
    }
};

export function initData(){
	global.portal.mechbay = { count: 0, on: 0, bay: 0, max: 0, active: 0, scouts: 0, mechs: [] };
	global.portal.spire = { count: 1, progress: 0, boss: '', type: '', status: {} };
	global.stats.achieve.gladiator = { l: 0 };
	global.blood.prepared = 0;
	global.blood.wrath = 0;
	global.stats.reset = 0;
	
}

function initConfig(){
	if(!app.localStorage) return;
	
	let config = localStorage.getItem(app.LS_Config);
	config = config? JSON.parse(LZString.decompressFromBase64(config)) : null;
	if(config){
		Object.keys(app.config).forEach(function(key){
			config[key] ??= app.config[key];
		});
		app.config = config;
		global.stats.achieve.gladiator.l = app.config.gladiator || 0;
		global.race['warlord'] = app.config.warlord || false;
		global.blood['wrath'] = app.config.wrath || 0;
		global.blood['prepared'] = app.config.prepared || 0;
		global.portal.mechbay.scouts = app.config.scouts || 0;
		global.stats.reset = app.config.resets || 0;
	}
	else{
		
	}
	
	let labels = localStorage.getItem(app.LS_PageLabels);
	labels = labels? JSON.parse(LZString.decompressFromBase64(labels)) : null;
	if(labels){
		app.labels = labels;
	}
	
	let heap = localStorage.getItem(app.LS_Heap);
	heap = heap? JSON.parse(LZString.decompressFromBase64(heap)) : null;
	if(heap){
		app.heap = heap;
	}
	
	global.settings.locale = app.config.locale;
	//getString(global.settings.locale);
}

export function saveConfig(){
	app.config.warlord = global.race['warlord'];
	app.config.prepared = global.blood['prepared'];
	app.config.wrath = global.blood['wrath'];
	app.config.gladiator = global.stats.achieve.gladiator.l;
	app.config.scouts = global.portal.mechbay.scouts;
	app.config.resets = global.stats.reset;
	
	if(!app.localStorage) return;
	localStorage.setItem(app.LS_Config, LZString.compressToBase64(JSON.stringify(app.config)));
}
export function saveLabels(){	
	if(!app.localStorage) return;
	localStorage.setItem(app.LS_PageLabels, LZString.compressToBase64(JSON.stringify(app.labels)));
}
export function saveHeap(){
	if(!app.localStorage) return;
	localStorage.setItem(app.LS_Heap, LZString.compressToBase64(JSON.stringify(app.heap)));
}

/*** 	
	Mech buckets array
	[
		1:       [[], [], [], ..n],
		2:       [[], [], [], ..m],
		...
		buckets: [[], [], [], ..max_pages]
	] 
*/
var mechBuckets = {}

function initBuckets(){
	for(var i = 0; i < app.maxMechBuckets; i++){
		
		let bucket;
		if(app.localStorage) {
			bucket = localStorage.getItem(`${app.LS_MechBucket}${i}`);
			bucket = bucket? JSON.parse(LZString.decompressFromBase64(bucket)) : null;
		}
		
		if(bucket && Array.isArray(bucket))
			mechBuckets[i] = bucket;
		else {
			mechBuckets[i] = [];
		}
	}
}

export function getMechList(id){
	if(id >= app.maxMechPages || id < 0)
		return [];
	
	let bid = pageToBucket(id);
	if(mechBuckets.hasOwnProperty(bid.b)){
		while(bid.i >= mechBuckets[bid.b].length ){
			mechBuckets[bid.b].push([]);
		}
		if(mechBuckets[bid.b][bid.i].length == 0){
			// meme pages when empty
			if(id == 5) mechBuckets[bid.b][bid.i] = oopsAllCollectors;
			if(id == 6) mechBuckets[bid.b][bid.i] = sampleMechBay;
			if(id == 7) mechBuckets[bid.b][bid.i] = rainbowMechBay;
		}
		/** performance crusher test
		if(id == 4){
			let list = [];
			let chas = ['wheel', 'spider', 'quad', 'hover', 'tread'];
			let wep = ['laser','flame','plasma','kinetic','missile','sonic','shotgun','tesla'];
			let eq = ['special','shields','sonar','grapple','infrared','flare','radiator','coolant','ablative','stabilizer','seals'];
			for(var i = 0; i < 500; i++){
				let mmm = 
				{
					size: 'small',
					hardpoint: [wep[(500-i)%wep.length]],
					chassis: chas[i%chas.length],
					equip: [eq[(i+3)%eq.length]],
					infernal: (Math.random() < 0.4)
				}
				list.push(mmm);
			}
			mechBuckets[bid.b][bid.i] = list;
		}
		*/
		return mechBuckets[bid.b][bid.i];
	}
	else
		return [];
}

export function saveMechList(id, list){
	let bid = pageToBucket(id);
	if(!mechBuckets.hasOwnProperty(bid.b) || id >= app.maxMechPages || id < 0 || bid.b > app.maxMechBuckets){
		return [false, 'Could not save list - invalid page number'];
	}
	else{
		while(bid.i >= mechBuckets[bid.b].length ){
			mechBuckets[bid.b].push([]);
		}
		mechBuckets[bid.b][bid.i] = list;
		
		if(app.localStorage) {
			localStorage.setItem(`${app.LS_MechBucket}${bid.b}`, LZString.compressToBase64(JSON.stringify(mechBuckets[bid.b])));
			return [true, `Saved page ${id+1} successfully`];
		}
		else
			return [false, 'Failed to access local storage'];
	}
}

function pageToBucket(pageNumber){
	let bucket = pageNumber % app.maxMechBuckets;
	let index = Math.floor(pageNumber / app.maxMechBuckets);
	
	return {b: bucket, i: index};
}

function bucketToPage(bucket){
	return bucket.i * app.maxMechBuckets + bucket.b;;
}

let storage;
try{
	storage = window['localStorage'];
	const x = "_test_";
	storage.setItem(x, x);
	storage.removeItem(x);
	app.localStorage = true;
} 
catch(e){
	app.localStorage = false;
}

initData();
initConfig();
initBuckets();