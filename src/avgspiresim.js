import { app, initData, saveConfig, getMechList, saveMechList, numFormat } from './app.js';

import { global } from '../evolve/src/vars.js';
import { mechRating, mechSize } from '../evolve/src/portal.js';
import { loc } from '../evolve/src/locale.js';
import { timeFormat } from '../evolve/src/functions.js';

import { Datum, Floorum, getMedianFromArray, lerp, invlerp, sortNumbers, shrinkMedianArray } from './data.js';
import { inform, isSpireSetup, importFloorum } from './mechcheatsheet.js';
import { mechPager } from './mechpager.js';

//import * as test from './mechaveragerun.worker.js';

var MAX_WORKERS = 4;
export const MAX_THREADS = 16;

const simKeys = ['e', 't'];

export const avgCalc = {	
	initialized: false,
	running: false,
	avgResults: 0,
	workers: [],
	workersDone: 0,
	involvedWorkers: MAX_WORKERS,
	progress: 0,
	grapher: {},
	medianGrapher: {},
	summarizer: {},
	
	pages: 0,
	sims: [],
	currentSim: -1,
	runningSim: -1,
	currentInsight: -1,
	insightLock: false,
	canvas: {
		'e': {'c': {}, 'b': {}}, 't': {'c': {}, 'b': {}},
		'emed': {'c': {}, 'b': {}}, 'tmed': {'c': {}, 'b': {}},
	},
	
	bucketHighlight: {},

	init(){
		avgCalc.grapher = new Grapher();
		avgCalc.canvas.e.c = avgCalc.grapher.createCanvas();
		avgCalc.canvas.t.c = avgCalc.grapher.createCanvas();
		
		avgCalc.medianGrapher = new Grapher(193, 24, {t: 0, r: 0, b: 0, l: 0});
		avgCalc.canvas.emed.c = avgCalc.medianGrapher.createCanvas();
		avgCalc.canvas.tmed.c = avgCalc.medianGrapher.createCanvas();
		avgCalc.medianGrapher.baseFill = '#99999940';
		
		avgCalc.canvas.e.c.setAttribute('aria-label', 'Efficiency graph');
		avgCalc.canvas.t.c.setAttribute('aria-label', 'Time graph');
		avgCalc.canvas.emed.c.setAttribute('title', 'Approximate efficiency distribution');
		avgCalc.canvas.tmed.c.setAttribute('title', 'Approximate completion time distribution');
		
		avgCalc.summarizer = new AvgSummaryGrid([ avgCalc.canvas.e.c, avgCalc.canvas.t.c ], [ avgCalc.canvas.emed.c, avgCalc.canvas.tmed.c ]);
		
		avgCalc.bucketHighlight = $(avgCalc.summarizer.highlight);
		$(avgCalc.summarizer.canvasDiv).on('mousemove', function(e){
			if(avgCalc.insightLock) return;
			
			let scale = avgCalc.canvas.e.c.offsetWidth / avgCalc.grapher.width;
			if(scale <= 0) return;
			
			let scaledX = e.offsetX / scale;
			if(!avgCalc.initialized || avgCalc.currentSim < 0) return;
			if(scaledX > avgCalc.grapher.rect.l && scaledX < avgCalc.grapher.rect.r){
				let x = scaledX - avgCalc.grapher.rect.l;
				let b = Math.floor(x / avgCalc.grapher.bWidth);
				avgCalc.bucketHighlight.show();
				avgCalc.bucketHighlight.css('left', scale * ( b * avgCalc.grapher.bWidth + avgCalc.grapher.rect.l ));
				avgCalc.bucketHighlight.css('width', scale * Math.max(avgCalc.grapher.bWidth - 1, 1));
				avgCalc.insightBucket(b);
			}
			else{
				avgCalc.bucketHighlight.hide();
				avgCalc.insightBucket(-1);
			}
		});
		$(avgCalc.summarizer.canvasDiv).on('mouseleave', function(e){
			if(avgCalc.insightLock) return;
			
			avgCalc.bucketHighlight.hide();
			avgCalc.insightBucket(-1);
		});
		$(avgCalc.summarizer.canvasDiv).on('click', function(e){
			let scale = avgCalc.canvas.e.c.offsetWidth / avgCalc.grapher.width;
			if(scale <= 0) return;
			
			let scaledX = e.offsetX / scale;
			if(!avgCalc.initialized || avgCalc.currentSim < 0) return;
			if(scaledX > avgCalc.grapher.rect.l && scaledX < avgCalc.grapher.rect.r){
				// Inside
				e.stopPropagation();
				
				let x = scaledX - avgCalc.grapher.rect.l;
				let b = Math.floor(x / avgCalc.grapher.bWidth);
				if(b == avgCalc.currentInsight && avgCalc.insightLock){
					// Unlock
					avgCalc.unlockInsight();
				}
				else{
					// Lock new
					avgCalc.bucketHighlight.toggleClass('locked', true);
					avgCalc.bucketHighlight.show();
					avgCalc.bucketHighlight.css('left', scale * ( b * avgCalc.grapher.bWidth + avgCalc.grapher.rect.l ));
					avgCalc.bucketHighlight.css('width', scale * Math.max(avgCalc.grapher.bWidth - 1, 1));
					avgCalc.insightBucket(b);
					avgCalc.lockInsight(b);
				}
			}
		});
		app.on(app.EV_CLOSE_DROPDOWNS, avgCalc.unlockInsight);
		avgCalc.initialized = true;
	},
	
	sim(list, eden = false){
		if(!avgCalc.initialized) return;
		
		if(avgCalc.running){
			avgCalc.running = false;
			for(var i = 0; i < avgCalc.workers.length; i++){
				avgCalc.workers[i].postMessage({'a': 'stop'});
			}
			$('#avgDoIt').text('Do it!');
			return;
		}
		else{
			$('#avgDoIt').text('Stop');
			avgCalc.running = true;
		}
		
		avgCalc.avgResults = 0;
		avgCalc.workersDone = 0;
		avgCalc.progress = 0;
		$('#simProgress').val(0);
		
		let edenTax = eden? (global.eden?.mech_station?.mechs || 0) : 0;
		
		let sStart = parseInt($('#avgStart').val()) || 1;
		let sLength = parseInt($('#avgLength').val()) || 10;
		let sRepeats = parseInt($('#avgRepeats').val()) || 10;
		let sLabel = `${mechPager.getCurrent().name} [${sStart} + ${sLength} --> ${sStart + sLength}] x ${sRepeats}`;
		let sDescriptor = `${list.length} mech${(list.length > 1 && list.length  % 100 != 11 && list.length % 10 != 1) ? 's' : ''}${(edenTax > 0)? ` (-${edenTax} in ${loc('tab_eden')})` : ''}`;
		let sPrecise = $('#avgPrecise').get(0)?.checked || app.config.preciseMedians;
		
		MAX_WORKERS = parseInt($('#avgThreads').val()) || 4;
		MAX_WORKERS = Math.max(1, Math.min(MAX_THREADS, MAX_WORKERS));
		
		if(avgCalc.sims.length == 0 || avgCalc.runningSim < 0){
			avgCalc.addSim(new AverageSim(sStart, sLength, sRepeats, sLabel, sDescriptor, sPrecise));
			avgCalc.runningSim = avgCalc.sims.length - 1;
			
			$('#avgCalcPageContainer').append(avgCalc.summarizer.dom);
		}
		else{
			avgCalc.runningSim = avgCalc.currentSim;
			avgCalc.sims[avgCalc.runningSim].init(sStart, sLength, sRepeats, sLabel, sDescriptor, sPrecise);
		}
		
		avgCalc.grapher.clear(avgCalc.canvas.e);
		avgCalc.grapher.clear(avgCalc.canvas.t);
		avgCalc.medianGrapher.clear(avgCalc.canvas.emed);
		avgCalc.medianGrapher.clear(avgCalc.canvas.tmed);
		
		for(let canvas in avgCalc.canvas){
			avgCalc.canvas[canvas].b = new Datum();
			
			avgCalc.canvas[canvas].b.min = 0;
			avgCalc.canvas[canvas].b.max = 1;
		}
		
		avgCalc.showSim(avgCalc.runningSim);
		//avgCalc.summarizer.summarize( avgCalc.sims[avgCalc.runningSim] );
				
		avgCalc.setupWorkers();
		
		// Spread repeats across workers
		let repPerWorker = 1;
		let leftoverRepeats = 0;
		if(sRepeats > MAX_WORKERS){
			repPerWorker = Math.floor(sRepeats / MAX_WORKERS);
			leftoverRepeats = sRepeats % MAX_WORKERS;
		}
		avgCalc.involvedWorkers = Math.min(sRepeats, MAX_WORKERS);
		
		avgCalc.sims[avgCalc.runningSim].time.gathering = performance.now();
		for(var i = 0; i < avgCalc.involvedWorkers; i++){
			avgCalc.workers[i].postMessage({ 'a': 'start', 'wId': i, 'mechs': list, 'global': global, 'edenTax': edenTax, 'precise': sPrecise,
				'start': sStart, 'length': sLength, 'repeats': repPerWorker + ( (i < leftoverRepeats) ? 1 : 0 ) });
		}
	},
	
	setupWorkers(){
		if(avgCalc.workers.length < MAX_WORKERS){
			for(var i = avgCalc.workers.length; i < MAX_WORKERS; i++){
				avgCalc.workers.push(new Worker(new URL("mechaveragerun.worker.js", import.meta.url), { type: 'module' }));
				avgCalc.workers[i].onmessage = avgCalc.handleWorkerMessage;
			}
		}
		// Pool workers instead of terminating them
		/* else if(avgCalc.workers.length > MAX_WORKERS){
			for(var i = MAX_WORKERS; i < avgCalc.workers.length; i++){
				avgCalc.workers[i].terminate();
			}
			avgCalc.workers.splice(MAX_WORKERS);
		} */
	},
	
	handleWorkerMessage(e){
		switch(e.data['a']){
			case 'result':
				avgCalc.sims[avgCalc.runningSim].addData(parseInt(e.data.f), e.data.e, e.data.t, e.data.slow, e.data.raw);
				
				let bucket = parseInt(e.data.f) - avgCalc.sims[avgCalc.runningSim].start;
				let leftoverRepeats = (avgCalc.sims[avgCalc.runningSim].repeats > MAX_WORKERS) ? avgCalc.sims[avgCalc.runningSim].repeats % MAX_WORKERS : 0;
				let draw = (avgCalc.sims[avgCalc.runningSim].buckets.n[bucket] % avgCalc.involvedWorkers == 0);
				if(leftoverRepeats > 0)
					draw = draw || (avgCalc.sims[avgCalc.runningSim].buckets.n[bucket] % avgCalc.involvedWorkers == leftoverRepeats);
				draw = draw && (avgCalc.currentSim === avgCalc.runningSim);
				
				if(draw){
					avgCalc.grapher.drawBucket(avgCalc.canvas.e, avgCalc.canvas.e.b, avgCalc.sims[avgCalc.runningSim], 'e', bucket);
					avgCalc.grapher.drawBucket(avgCalc.canvas.t, avgCalc.canvas.t.b, avgCalc.sims[avgCalc.runningSim], 't', bucket);
				}
				
				avgCalc.avgResults++;
				break;
			case 'progress':
				avgCalc.workers[e.data.w]['progress'] = e.data.progress;
				let minProgress = e.data.progress;
				for(var i = 0; i < MAX_WORKERS && i < avgCalc.workers.length; i++){
					let worker = avgCalc.workers[i];
					if(worker['progress'] && worker['progress'] < minProgress)
						minProgress = worker['progress'];
				}
				if(minProgress > avgCalc.progress) avgCalc.progress = minProgress;
				$('#simProgress').val(avgCalc.progress * 100);
				break;
			case 'done':
				avgCalc.workersDone++;
				if(avgCalc.workersDone == avgCalc.involvedWorkers){
					avgCalc.sims[avgCalc.runningSim].finalizeResults();
					//avgCalc.medianGrapher.drawMedians(avgCalc.canvas.emed.c, avgCalc.canvas.emed.b, 'e', avgCalc.sims[avgCalc.runningSim].medians.e);
					//avgCalc.medianGrapher.drawMedians(avgCalc.canvas.tmed.c, avgCalc.canvas.tmed.b, 't', avgCalc.sims[avgCalc.runningSim].medians.t);
					avgCalc.showSim(avgCalc.runningSim);
					//avgCalc.summarizer.summarize( avgCalc.sims[avgCalc.runningSim] );
					avgCalc.running = false;
					$('#avgDoIt').text('Do it!');
				}
				break;
			case 'error':
				switch(e.data['error']){
					case 'no_mechs':
						avgCalc.sims[avgCalc.runningSim].descriptor = 'Where are the mechs?';
						inform('info', 'Where are the mechs?', 'sim_no_mechs');
						break;
					case 'mechs_busy':
						avgCalc.sims[avgCalc.runningSim].descriptor = `All mechs are busy in ${loc('tab_eden')}`;
						inform('info', `All mechs are busy in ${loc('tab_eden')}`, 'sim_eden');
						break;
				}
				//avgCalc.sims[avgCalc.runningSim].done = true;
				avgCalc.running = false;
				$('#avgDoIt').text('Do it!');
				avgCalc.summarizer.summarize( avgCalc.sims[avgCalc.runningSim] );
				avgCalc.summarizer.clear();
				break;
			default:
				//console.log(e.data);
				break;
		}
	},
	
	showSim(id){
		avgCalc.unlockInsight();
		if(id == 'i'){
			$('#avgCalcInfo').show();
			let pager = $('#avgCalcPager');
			pager.find('.current').removeClass('current');
			pager.find(`[data-val="${id}"]`).addClass('current');
			$(avgCalc.summarizer.dom).hide();
		}
		else if(Number.isInteger(id)){
			let pager = $('#avgCalcPager');
			pager.show();
			$('#avgCalcInfo').hide();
			$(avgCalc.summarizer.dom).show();
			avgCalc.currentSim = id % avgCalc.sims.length;
			
			pager.find('.current').removeClass('current');
			pager.find(`[data-val="${id}"]`).addClass('current');
			
			avgCalc.summarizer.summarize( avgCalc.sims[avgCalc.currentSim] );
			avgCalc.grapher.draw(avgCalc.canvas.e, avgCalc.sims[avgCalc.currentSim], 'e');
			avgCalc.grapher.draw(avgCalc.canvas.t, avgCalc.sims[avgCalc.currentSim], 't');
			
			if(avgCalc.sims[avgCalc.currentSim].done){
				avgCalc.medianGrapher.drawMedians(avgCalc.canvas.emed.c, avgCalc.sims[avgCalc.currentSim].bounds.emed, 'e', avgCalc.sims[avgCalc.currentSim].medians.e);
				avgCalc.medianGrapher.drawMedians(avgCalc.canvas.tmed.c, avgCalc.sims[avgCalc.currentSim].bounds.tmed, 't', avgCalc.sims[avgCalc.currentSim].medians.t);
			}
			else{
				avgCalc.medianGrapher.clear(avgCalc.canvas.emed);
				avgCalc.medianGrapher.clear(avgCalc.canvas.tmed);
			}
		}
		
	},
	
	addSim(sim){
		let pager = $($('#avgCalcPager').children('div').get(0));
		let max = 4;
		if(avgCalc.pages == 0){
			pager.append($(`<a data-val="i" class="clickable"><svg class="bi" width="1.1em" height="1.1em" fill="currentColor"><use xlink:href="./icons/icons.svg#info-square-fill"/></svg></a>`)
				.on('click', (e)=>{ avgCalc.showSim('i'); }));
			pager.append($(`<a id="addSimTab" class="clickable">&nbsp;+&nbsp;</a>`)
				.on('click', (e)=>{ if( avgCalc.addSim() ) avgCalc.showSim(avgCalc.pages - 1); }));
		}
		if(avgCalc.pages < max){
			let adder = pager.children('#addSimTab');
			if(avgCalc.pages == (max - 1)){
				adder.hide();
			}
			adder.before($(`<a data-val="${avgCalc.pages}" class="clickable"><svg class="bi" width="1.1em" height="1.1em" fill="currentColor"><use xlink:href="./icons/icons.svg#bar-chart-fill"/></svg></a>`)
				.on('click', (e)=>{ if(e.target?.dataset?.val >= 0) avgCalc.showSim(parseInt(e.target.dataset.val)); }));
				
			
			avgCalc.sims.push( (sim === undefined) ? new AverageSim(1, 0, 0, '', 'Start a new calculation', false) : sim );
			avgCalc.currentSim = avgCalc.sims.length - 1;
			avgCalc.pages++;
		}
		else
			return false;
		
		return true;
	},
	
	insightBucket(b){
		if(b == avgCalc.currentInsight) return;
		avgCalc.currentInsight = b;
		if(avgCalc.sims.length == 0 || avgCalc.currentSim < 0) return;
		
		if(b < 0 || b >= avgCalc.sims[avgCalc.currentSim].nBuckets){
			if(avgCalc.sims[avgCalc.currentSim].done){
				avgCalc.sims[avgCalc.currentSim].bounds.tmed.min = avgCalc.sims[avgCalc.currentSim].medians.t[0];
				avgCalc.sims[avgCalc.currentSim].bounds.tmed.max = avgCalc.sims[avgCalc.currentSim].medians.t[avgCalc.sims[avgCalc.currentSim].medians.t.length - 1];
				avgCalc.medianGrapher.drawMedians(avgCalc.canvas.emed.c, avgCalc.sims[avgCalc.currentSim].bounds.emed, 'e', avgCalc.sims[avgCalc.currentSim].medians.e);
				avgCalc.medianGrapher.drawMedians(avgCalc.canvas.tmed.c, avgCalc.sims[avgCalc.currentSim].bounds.tmed, 't', avgCalc.sims[avgCalc.currentSim].medians.t);
			}
			avgCalc.summarizer.summarize(avgCalc.sims[avgCalc.currentSim]);
		}
		else{
			if(avgCalc.sims[avgCalc.currentSim].done && avgCalc.sims[avgCalc.currentSim].precise && avgCalc.sims[avgCalc.currentSim].buckets.t[b].med.length > 0){
				avgCalc.sims[avgCalc.currentSim].bounds.tmed.min = avgCalc.sims[avgCalc.currentSim].buckets.t[b].med[0];
				avgCalc.sims[avgCalc.currentSim].bounds.tmed.max = avgCalc.sims[avgCalc.currentSim].buckets.t[b].med[avgCalc.sims[avgCalc.currentSim].buckets.t[b].med.length - 1];
				avgCalc.medianGrapher.drawMedians(avgCalc.canvas.emed.c, avgCalc.sims[avgCalc.currentSim].bounds.emed, 'e', avgCalc.sims[avgCalc.currentSim].buckets.e[b].med);
				avgCalc.medianGrapher.drawMedians(avgCalc.canvas.tmed.c, avgCalc.sims[avgCalc.currentSim].bounds.tmed, 't', avgCalc.sims[avgCalc.currentSim].buckets.t[b].med);
			}
			avgCalc.summarizer.summarize(avgCalc.sims[avgCalc.currentSim] , b);
		}
	},
	
	lockInsight(b){
		avgCalc.insightLock = true;
	},
	
	unlockInsight(){
		avgCalc.insightLock = false;
		avgCalc.bucketHighlight.hide();
		avgCalc.bucketHighlight.removeClass('locked');
		avgCalc.insightBucket(-1);
	},
	
	loadUpFloorum(e){
		if(avgCalc.sims.length == 0 || avgCalc.currentSim < 0) return;
		if(e.currentTarget?.dataset?.bucket && avgCalc.currentSim >= 0 && e.currentTarget?.dataset?.key){
			let b = e.currentTarget.dataset.bucket;
			if(b >= avgCalc.sims[avgCalc.currentSim].nBuckets) return;
			if(avgCalc.sims[avgCalc.currentSim].totals.n == 0) return;
			let key = e.currentTarget.dataset.key;
			
			importFloorum(( b < 0 ) ? avgCalc.sims[avgCalc.currentSim].totals.slowest[key] : avgCalc.sims[avgCalc.currentSim].slowest[key][b] );
		}
	},
}

const color = {
	graphBase: '#555',
	graphBlue: '#0095DD',
	graphError: '#DD000090',
};

class Grapher {
	bWidth = 3;
	
	constructor(width = 560, height = 140, padding = {t: 10, r: 10, b: 10, l: 10}) {
		this.width = width;
		this.height = height;
		this.padding = padding;
		this.rect = {t: this.padding.t, r: (this.width - this.padding.r), b: (this.height - this.padding.b), l: this.padding.l};
		
		let context = document.createElement('canvas').getContext('2d');
		
		this.baseFill = color.graphBase;
		this.errorFill = color.graphError;
		
		this.warningGradient = context.createLinearGradient(0, 0, 0, this.height);
		this.warningGradient.addColorStop(0, color.graphBase);
		this.warningGradient.addColorStop(0.8, color.graphBase);
		this.warningGradient.addColorStop(1, '#ED6500');
		
		this.errorGradient = context.createLinearGradient(0, 0, 0, this.height);
		this.errorGradient.addColorStop(0, color.graphBase);
		this.errorGradient.addColorStop(0.8, color.graphBase);
		this.errorGradient.addColorStop(1, '#ED0000');
		
		this.longGradient = context.createLinearGradient(0, 0, 0, this.height);
		this.longGradient.addColorStop(0, '#ED000040');
		//this.longGradient.addColorStop(0.09, '#ED000040');
		//this.longGradient.addColorStop(0.09, '#0095DD40');
		this.longGradient.addColorStop(0.1, color.graphBase);
		
		this.highGradient = context.createLinearGradient(0, 0, 0, this.height);
		this.highGradient.addColorStop(0, '#95DD0080');
		this.highGradient.addColorStop(0.1, color.graphBase);
	};
	createCanvas() {
		let canvas = document.createElement('canvas');
		canvas.height = this.height;
		canvas.width = this.width;
		return canvas;
	};
	draw(canvas, sim, key) {
		let context = canvas.c.getContext('2d');
		this.clear(context);
		let step = 1;
		if(sim.nBuckets > (this.width - this.padding.l - this.padding.r))
			step = Math.floor(sim.nBuckets / (this.width - this.padding.l - this.padding.r));
		
		for(var i = 0; i < sim.nBuckets; i = i + step){
			if(sim.buckets.n[i] > 0)
				this.drawBucket(context, canvas.b, sim, key, i);
		}
	};
	drawBucket(canvas, cBounds, sim, key, bucket) {
		let context = (canvas instanceof CanvasRenderingContext2D)? canvas : canvas.c.getContext('2d');
		let renormalize = false;
		this.bWidth = (this.width - this.padding.l - this.padding.r) / sim.nBuckets;
		if((this.width - this.padding.l - this.padding.r) >= sim.nBuckets)
			this.bWidth = Math.floor(this.bWidth);
		
		switch(key){
			case 't':
				if(cBounds.min != sim.bounds[key].min) renormalize = true;
				if(cBounds.max != sim.bounds[key].max) renormalize = true;
				break;
		}
		cBounds.min = sim.bounds[key].min;
		cBounds.max = sim.bounds[key].max;
		
		this.rect.l = this.padding.l + Math.floor((this.width - this.padding.l - this.padding.r - this.bWidth * sim.nBuckets) / 2);
		this.rect.r = this.width - this.rect.l;
				
		if(renormalize){
			// Redraw everything if min/max changed to fit data on canvas
			for(var i = 0; i < bucket; i++){
				this.strokeBucket(context, sim.bounds[key], key, i, sim.buckets[key][i]);
			}
		}
		this.strokeBucket(context, sim.bounds[key], key, bucket, sim.buckets[key][bucket]);
		
	};
	clear(canvas) {
		let context = (canvas instanceof CanvasRenderingContext2D)? canvas : canvas.c.getContext('2d');
		context.clearRect(
			0,
			0, 
			this.width, 
			this.height
		);
	};
	strokeBucket(context, dataBounds, key, bucket, datum) {
		context.clearRect(
			this.bWidth * bucket + this.rect.l,
			0, 
			this.bWidth, 
			this.height
		);
		
		let dataMax = datum.max;
		if(key == 't' && datum.max == -1)
			dataMax = dataBounds.max * 1.2;
		
		let barWidth = Math.max(this.bWidth - 1, 1);
		context.fillStyle = this.baseFill;
		let topPoint = Math.round(lerp(this.rect.t, this.rect.b, 1 - invlerp(dataBounds.min, dataBounds.max, dataMax)));
		let bottomPoint = Math.round(lerp(this.rect.t, this.rect.b, 1 - invlerp(dataBounds.min, dataBounds.max, datum.min)));
		if(datum.min == 0)
			context.fillStyle = this.errorFill;
		else if(datum.min < 0.009)
			context.fillStyle = this.errorGradient;
		else if(datum.min < 0.05)
			context.fillStyle = this.warningGradient;
		else if(dataMax > dataBounds.max)
			context.fillStyle = (key == 't')? this.longGradient : this.highGradient;
			
		context.fillRect(
			this.bWidth * bucket + this.rect.l, 
			topPoint, 
			barWidth, 
			(bottomPoint - topPoint)
		);
		if(dataMax > dataBounds.max){
			context.clearRect(
				this.bWidth * bucket + this.rect.l,
				this.rect.t + 4,
				barWidth,
				2
			);
		}
		
		let median = Array.isArray(datum.med) ? getMedianFromArray( datum.med ) : datum.med;
		let avgPoint = Math.round(lerp(this.rect.t, this.rect.b, 1 - invlerp(dataBounds.min, dataBounds.max, datum.avg)));
		let medPoint = Math.round(lerp(this.rect.t, this.rect.b, 1 - invlerp(dataBounds.min, dataBounds.max, median)));
		let avgStart = avgPoint;
		let avgHeight = Math.max(Math.abs(avgPoint - medPoint), 2);
		if(avgPoint >= medPoint){
			avgStart = medPoint;
		}
		else{
			avgHeight = Math.max(Math.abs(medPoint - avgPoint), 2);
		}
		
		if(((key == 't')? -1 : 1) * (avgPoint - medPoint) < 0)
			context.fillStyle = '#DD9500';
		else
			context.fillStyle = '#95DD00';
		
		context.fillRect(
			this.bWidth * bucket + this.rect.l, 
			avgStart - 1, 
			barWidth, 
			avgHeight
		);
	};
	drawMedians(canvas, dataBounds, key, medianArray) {
		let context = canvas.getContext('2d');
		this.clear(context);
		context.beginPath();
		context.moveTo(this.rect.l, this.rect.b);
		if(medianArray.length < this.rect.r - this.rect.l){
			for(var i = 0; i < medianArray.length; i++){
				
				let x = lerp(this.rect.l, this.rect.r, invlerp(0, medianArray.length - 1, i));
				
				let y = Math.round(lerp(this.rect.t, this.rect.b, 1 - invlerp(dataBounds.min, dataBounds.max, medianArray[i])));
				context.lineTo(x, y);
			}
		}
		else{
			for(var i = 0; i <= (this.rect.r - this.rect.l); i++){
				
				let x = i + this.rect.l;
				
				let medIndex = Math.floor(lerp(0, medianArray.length - 1, invlerp(this.rect.l, this.rect.r, x)));
				let y = Math.round(lerp(this.rect.t, this.rect.b, 1 - invlerp(dataBounds.min, dataBounds.max, medianArray[medIndex])));
				context.lineTo(x, y);
			}
		}
		context.lineTo(this.rect.r, Math.round(lerp(this.rect.t, this.rect.b, 1 - invlerp(dataBounds.min, dataBounds.max, medianArray[medianArray.length - 1]))));
		context.lineTo(this.rect.r, this.rect.b);
		context.closePath();
		context.fillStyle = this.baseFill;
		context.fill();
		
		let halfPoint = Math.floor(this.rect.l + (this.rect.r - this.rect.l) / 2);
		context.beginPath();
		context.moveTo(halfPoint, this.rect.b - 5);
		context.lineTo(halfPoint - 5, this.rect.b);
		context.lineTo(halfPoint + 5, this.rect.b);
		context.lineTo(halfPoint, this.rect.b - 5);
		context.closePath();
		context.fillStyle = color.graphBlue;
		context.fill();
	};
}

class AverageSim {
	constructor(start, length, repeats, label, descriptor, precise) {
		this.start = start || 1;
		this.length = length || 1;
		this.repeats = repeats || 1;
		this.label = label || '';
		this.descriptor = descriptor || '';
		this.precise = precise || false;
		this.done = false;
		
		this.buckets = {'n': [], 'e': [], 't': []};
		this.medians = {'e': [], 't': []};
		this.slowest = {'e': [], 't': []};		
		this.bounds = {'e': {}, 't': {}, 'emed': {}, 'tmed': {}};
		
		this.nBuckets = length;
		
		Object.keys(this.buckets).forEach(function(key){
			this.buckets[key].length = this.nBuckets;
		}, this);
		Object.keys(this.slowest).forEach(function(key){
			this.slowest[key].length = this.nBuckets;
		}, this);
		Object.keys(this.bounds).forEach(function(key){
			this.bounds[key] = new Datum();		
			this.bounds[key].min = 0;		
			this.bounds[key].max = 1;			
		}, this);
		
		this.buckets.n.fill(0);
		for(var i = 0; i < this.nBuckets; i++){
			this.buckets.e[i] = new Datum();
			this.buckets.t[i] = new Datum();
			this.buckets.e[i].med = [];
			this.buckets.t[i].med = [];
			this.slowest.e[i] = new Floorum(0, 0, 0, null);
			this.slowest.t[i] = new Floorum(0, 0, 0, null);
		}
		
		this.totals = {'n': 0, 'e': new Datum(), 't': new Datum(), 'slowest': { 'e': new Floorum(), 't': new Floorum() }};
		this.time = {'gathering': 0, 'finalizing': 0};
	}
	init(start, length, repeats, label, descriptor, precise) {
		this.start = start;
		this.length = length;
		this.repeats = repeats;
		this.label = label;
		this.descriptor = descriptor;
		this.precise = precise;
		this.done = false;
		
		this.nBuckets = length;
		
		Object.keys(this.buckets).forEach(function(key){
			this.buckets[key].length = this.nBuckets;
		}, this);
		Object.keys(this.slowest).forEach(function(key){
			this.slowest[key].length = this.nBuckets;
		}, this);
		Object.keys(this.bounds).forEach(function(key){
			this.bounds[key].min = 0;		
			this.bounds[key].max = 1;		
		}, this);
		
		this.buckets.n.fill(0);
		this.medians.e = [];
		this.medians.t = [];
		this.slowest.e = [];
		this.slowest.t = [];
		for(var i = 0; i < this.nBuckets; i++){
			this.buckets.e[i] = new Datum();
			this.buckets.t[i] = new Datum();
			this.buckets.e[i].med = [];
			this.buckets.t[i].med = [];
			this.slowest.e[i] = new Floorum(0, 0, 0, null);
			this.slowest.t[i] = new Floorum(0, 0, 0, null);
		}
		
		this.totals.n = 0;
		this.totals.e = new Datum();
		this.totals.t = new Datum();
		this.totals.slowest.e = new Floorum();
		this.totals.slowest.t = new Floorum();
		this.time.gathering = 0;
		this.time.finalizing = 0;
	}
	addData(floor, effData, timeData, slowestData, raw = null) {
		floor -= this.start;
		if(floor < 0 || floor >= this.nBuckets) return;
		
		if(this.buckets.e[floor].min > effData.min) {
			this.slowest.e[floor] = slowestData.e;
		}
		
		this.buckets.e[floor].min = (this.buckets.e[floor].min > effData.min)? effData.min : this.buckets.e[floor].min;
		this.buckets.e[floor].max = (this.buckets.e[floor].max < effData.max)? effData.max : this.buckets.e[floor].max;
		this.buckets.e[floor].avg = (effData.avg + this.buckets.n[floor] * this.buckets.e[floor].avg)/(this.buckets.n[floor] + 1);
		
		if(timeData.max == -1) {
			this.buckets.t[floor].max = -1;
			this.slowest.t[floor] = slowestData.t;
		}
		if(this.buckets.t[floor].max !== -1 && this.buckets.t[floor].max < timeData.max) {
			this.slowest.t[floor] = slowestData.t;
		}
		
		this.buckets.t[floor].min = (this.buckets.t[floor].min > timeData.min)? timeData.min : this.buckets.t[floor].min;
		this.buckets.t[floor].max = (this.buckets.t[floor].max !== -1 && this.buckets.t[floor].max < timeData.max)? timeData.max : this.buckets.t[floor].max;
		this.buckets.t[floor].avg = (timeData.avg + this.buckets.n[floor] * this.buckets.t[floor].avg)/(this.buckets.n[floor] + 1);
		
		if(this.precise && raw){
			this.buckets.e[floor].med.push( ...raw.e );
			this.buckets.t[floor].med.push( ...raw.t );
			this.medians.e.push( ...raw.e );
			this.medians.t.push( ...raw.t );
		}
		else{
			this.buckets.e[floor].med.push( ...( Array.isArray(effData.med) ? effData.med : [effData.med] ) );
			this.buckets.t[floor].med.push( ...( Array.isArray(timeData.med) ? timeData.med : [timeData.med] ) );
			this.medians.e.push( ...( Array.isArray(effData.med) ? effData.med : [effData.med] ) );
			this.medians.t.push( ...( Array.isArray(timeData.med) ? timeData.med : [timeData.med] ) );
		}
		this.buckets.e[floor].med.sort(sortNumbers);
		this.buckets.t[floor].med.sort(sortNumbers);
		
		this.buckets.n[floor]++;
		
		// Data bounds/normals for graphing
		if(this.bounds.t.min > this.buckets.t[floor].min) 
			this.bounds.t.min = this.buckets.t[floor].min;
		
		if(this.bounds.t.max < this.buckets.t[floor].max && (this.buckets.t[floor].max / this.buckets.t[floor].avg < 5))
			this.bounds.t.max = this.buckets.t[floor].max;
			
		else if(this.bounds.t.max < this.buckets.t[floor].avg)
			this.bounds.t.max = this.buckets.t[floor].avg;
		
		else if(this.bounds.t.max < getMedianFromArray( this.buckets.t[floor].med ))
			this.bounds.t.max = getMedianFromArray( this.buckets.t[floor].med );
		
	}
	finalizeResults() {
		let timeNow = performance.now();
		this.time.gathering = timeNow - this.time.gathering;
		let neverFinished = false;
		let bucketReductionFn = shrinkMedianArray.bind(50);
		for(var floor = 0; floor < this.nBuckets; floor++){
			if(this.buckets['n'][floor] == 0) continue;
			
			this.totals['slowest']['e'] = (this.totals['e'].min > this.buckets['e'][floor].min)? this.slowest['e'][floor] : this.totals['slowest']['e'];
			
			this.totals['e'].min = (this.totals['e'].min > this.buckets['e'][floor].min)? this.buckets['e'][floor].min : this.totals['e'].min;
			this.totals['e'].max = (this.totals['e'].max < this.buckets['e'][floor].max)? this.buckets['e'][floor].max : this.totals['e'].max;
			
			this.totals['slowest']['t'] = (this.totals['t'].max < this.buckets['t'][floor].max)? this.slowest['t'][floor] : this.totals['slowest']['t'];
			
			this.totals['t'].min = (this.totals['t'].min > this.buckets['t'][floor].min && this.buckets['t'][floor].min > 0)? this.buckets['t'][floor].min : this.totals['t'].min;
			this.totals['t'].max = (this.totals['t'].max < this.buckets['t'][floor].max)? this.buckets['t'][floor].max : this.totals['t'].max;
			if(this.buckets['t'][floor].min !== 0)
				neverFinished = true;
			
			simKeys.forEach(function(key){
				this.totals[key].avg = (this.buckets[key][floor].avg + floor * this.totals[key].avg)/(floor + 1);
				
				this.buckets[key][floor].med.sort(sortNumbers);
				
				if(this.buckets[key][floor].med.length > 50)
					this.buckets[key][floor].med = this.buckets[key][floor].med.filter(bucketReductionFn);
			}, this);
			this.totals.n += this.buckets.n[floor];
			
			
		}
		
		this.medians.e.sort(sortNumbers);
		this.medians.t.sort(sortNumbers);
		this.totals.e.med = getMedianFromArray(this.medians.e);
		this.totals.t.med = getMedianFromArray(this.medians.t);
		
		// Reduce raw/median array, for no reason at all
		if(this.medians.e.length > 200){
			this.medians.e = this.medians.e.filter(shrinkMedianArray);
			this.medians.t = this.medians.t.filter(shrinkMedianArray);
		}
		
		//if(neverFinished)
		//	this.totals.t.max = -1;
		
		this.bounds.emed.min = 0;
		this.bounds.emed.max = Math.max(1, this.medians.e[this.medians.e.length - 1]);
		
		this.bounds.tmed.min = this.medians.t[0];
		this.bounds.tmed.max = this.medians.t[this.medians.t.length - 1];
		
		this.normals = {
			'e': avgCalc.canvas.e.b, 't': avgCalc.canvas.t.b,
			'emed': avgCalc.canvas.emed.b, 'tmed': avgCalc.canvas.tmed.b,
		}
		
		this.time.finalizing = performance.now() - timeNow;
		this.done = true;
	}
}

class AvgSummaryGrid {
	constructor(canvases, medianCanvases) {
		this.noDataBucket = new Datum();
		Object.keys(this.noDataBucket).forEach(function(key){
			this.noDataBucket[key] = 0;
		}, this);
		this.noDataBucket['med'] = [];
		
		this.dom = document.createElement('div');
		this.dom.id = `avgSummary-`;
		this.dom.className = 'avgSummary';
		this.dom.style = 'display: none';
		
		this.labelDiv = document.createElement('div');
		this.labelDiv.className = 'co0 title';
		
		this.label = document.createElement('h3');
		this.descriptor = document.createElement('p');
		
		this.labelDiv.appendChild(this.label);
		this.labelDiv.appendChild(this.descriptor);
		this.dom.appendChild(this.labelDiv);
		
		this.statDiv = document.createElement('div');
		this.statDiv.className = 'co0 breakdown';
		this.dom.appendChild(this.statDiv);
		
		this.canvasDiv = document.createElement('div');
		this.canvasDiv.className = 'co1 canvas';
		this.dom.appendChild(this.canvasDiv);
		
		this.highlight = document.createElement('div');
		this.highlight.id = 'bucketHighlight';
		this.highlight.style = 'pointer-events: none; display: none';
		this.canvasDiv.appendChild(this.highlight);
		
		for(let canvas of canvases){
			this.canvasDiv.appendChild(canvas);
		}
		
		this.grid = {'e': {}, 't': {}};
		
		
		let eHeader = document.createElement('div');
		eHeader.className = `co0 header`;
		eHeader.appendChild(medianCanvases[0]);
		eHeader.appendChild(document.createTextNode('Efficiency'));
		
		this.statDiv.appendChild(eHeader);
		Object.keys(new Datum()).forEach(function(key, i){
			let dataLabel = document.createElement('div');
			dataLabel.className = `co0`;
			dataLabel.appendChild(document.createTextNode(`${key}:`));
			let eVal = document.createElement('div');
			eVal.className = `co1`;
			
			this.grid.e[key] = eVal;
			
			this.statDiv.appendChild(dataLabel);
			this.statDiv.appendChild(eVal);
		}, this);
		
		this.bHeader = document.createElement('div');
		this.bHeader.className = `co0 bucket`;
		this.bHeader.appendChild(document.createTextNode('Total'));
		let tHeader = document.createElement('div');
		tHeader.className = `co0 header`;
		tHeader.appendChild(medianCanvases[1]);
		tHeader.appendChild(document.createTextNode('Time'));
		
		this.statDiv.appendChild(this.bHeader);
		this.statDiv.appendChild(tHeader);
		Object.keys(new Datum()).forEach(function(key, i){
			let dataLabel = document.createElement('div');
			dataLabel.className = `co0`;
			dataLabel.appendChild(document.createTextNode(`${key}:`));
			let tVal = document.createElement('div');
			tVal.className = `co1`;
			
			this.grid.t[key] = tVal;
			
			this.statDiv.appendChild(dataLabel);
			this.statDiv.appendChild(tVal);
		}, this);
		
		this.slowest = [];
		this.slowestDiv = document.createElement('div');
		this.slowestDiv.className = 'co0 footer slowest';
		this.dom.appendChild(this.slowestDiv);
		
		let slowestTitle = document.createElement('span');
		slowestTitle.className = 'label';
		slowestTitle.appendChild(document.createTextNode('Slowest floor:'));
		this.slowestDiv.appendChild(slowestTitle);
		
		for(let i = 0; i < 2; i++){
			this.slowest.push(document.createElement('div'));
			this.slowest[i].className = 'blockContainer';
			this.slowestDiv.appendChild(this.slowest[i]);
			this.slowest[i].col = [];
			
			for(let col = 0; col < (5 + app.maxStatus); col++){
				let column = document.createElement((col == 2) ? 'button' : 'span');
				column.className = `floor co${col}`;
				this.slowest[i].col.push(column);
				if(col == 3){
					let wrapper = document.createElement('div');
					wrapper.className = 'emannuelWrap';
					this.slowest[i].appendChild(wrapper);
				}
				this.slowest[i].appendChild(column);
			}
			this.slowest[i].col[2].textContent = '\u{1F845}';
			this.slowest[i].col[2].classList.add('spanImpostor');
			this.slowest[i].col[2].title = 'Load up floor config into cheat sheet';
			this.slowest[i].col[2].dataset.key = (i == 0) ? 'e' : 't';
			this.slowest[i].col[2].addEventListener('click', avgCalc.loadUpFloorum);
		}
		
		this.summary = document.createElement('div');
		this.summary.className = 'co0 footer';
		this.dom.appendChild(this.summary);
		
		this.footers = [];
		for(let i = 0; i < 2; i++){
			this.footers.push(document.createElement('span'));
			this.summary.appendChild(this.footers[i]);
		}
		this.footers[1].className = 'notImportant';
	};
	clear() {
		Object.keys(this.grid.e).forEach(function(key, i){
			this.grid.e[key].textContent = '-';
			this.grid.t[key].textContent = '-';
				
			if(key == 'min'){
				this.grid.e[key].classList.remove('error');
				this.grid.e[key].classList.remove('warning');
			}
			if(key == 'max'){
				this.grid.t[key].classList.remove('error');
			}
		}, this);
	}
	summarize(sim, bucket = -1) {
		this.label.textContent = sim.label;
		this.descriptor.textContent = (sim.done)? sim.descriptor + ' | Done \u{2714}' : sim.descriptor;
		this.footers[0].textContent = '\u00a0';
		this.footers[1].textContent = '\u00a0';
		this.slowestDiv.style = 'display: none';
		// if(!sim.done)
			// return;
		
		if(sim.done){
			let effBucket, timeBucket;
			if(bucket >= 0 && bucket < sim.nBuckets){
				this.bHeader.textContent = `Floor [${sim.start + bucket}]`;
				if(sim.buckets.n[bucket] > 0){
					effBucket = sim.buckets.e[bucket];
					timeBucket = sim.buckets.t[bucket];
				}
				else{
					effBucket = this.noDataBucket;
					timeBucket = this.noDataBucket;
				}
			}
			else{
				this.bHeader.textContent = 'Total';
				effBucket = sim.totals.e;
				timeBucket = sim.totals.t;
			}
			Object.keys(sim.totals.e).forEach(function(key, i){
				if(key == 'med'){
					this.grid.e[key].textContent = (( Array.isArray(effBucket[key]) ? getMedianFromArray(effBucket[key]) : effBucket[key] ) *100).toFixed(2) + '%';
					this.grid.t[key].textContent = timeFormat( Array.isArray(timeBucket[key]) ? getMedianFromArray(timeBucket[key]) : timeBucket[key]);
				}
				else{
					this.grid.e[key].textContent = (effBucket[key] * 100).toFixed(2) + '%';
					this.grid.t[key].textContent = timeFormat(timeBucket[key]);
				}
					
				if(key == 'min'){
					if(effBucket[key] == 0){
						this.grid.e[key].classList.remove('warning');
						this.grid.e[key].classList.add('error');
					}
					else if(effBucket[key] < 0.009){
						if(effBucket[key] < 0.0001) this.grid.e[key].textContent = (effBucket[key] * 100).toFixed(5) + '%';
						this.grid.e[key].classList.remove('error')
						this.grid.e[key].classList.add('warning');;
					}
					else {
						this.grid.e[key].classList.remove('error');
						this.grid.e[key].classList.remove('warning');
					}
				}
				if(key == 'max'){
					if(timeBucket[key] == -1)
						this.grid.t[key].classList.add('error');
					else
						this.grid.t[key].classList.remove('error');
				}
			}, this);
		}
		else if(bucket == -1){
			Object.keys(sim.totals.e).forEach(function(key, i){
				this.grid.e[key].textContent = '-';
				this.grid.t[key].textContent = '-';
			}, this);
		}
		
		if(sim.done){
			let gatheringStr = (sim.time.gathering > 1000) ? timeFormat(sim.time.gathering/1000) : `${Math.round(sim.time.gathering)}ms`;
			this.footers[0].textContent = `Done! Average time per floor ${timeFormat(sim.totals.t.avg)}`
			this.footers[1].textContent = ` | Gathering: ${gatheringStr} | Finalizing: ${(Math.floor(sim.time.finalizing * 100) / 100).toFixed(2)}ms`;
			
			this.slowestDiv.style = null;
			if(bucket >= 0 && bucket < sim.nBuckets && sim.buckets.n[bucket] > 0){
				
				this.slowest[0].style = null;
				if(!Floorum.areEqual(sim.slowest.e[bucket], sim.slowest.t[bucket])){
					this.slowest[1].style = null;
					this.summarizeSlowestFloor(this.slowest[0], sim, bucket, sim.slowest.e[bucket], 'e');
					this.summarizeSlowestFloor(this.slowest[1], sim, bucket, sim.slowest.t[bucket], 't');
				}
				else{
					this.summarizeSlowestFloor(this.slowest[0], sim, bucket, sim.slowest.e[bucket]);
					this.slowest[1].style = 'visibility: hidden';
					//this.slowest[1].col[2].style = 'display: none';
				}
			}
			else if(sim.totals.n > 0){
				
				this.slowest[0].style = null;
				if(!Floorum.areEqual(sim.totals.slowest.e, sim.totals.slowest.t)){
					this.slowest[1].style = null;
					this.summarizeSlowestFloor(this.slowest[0], sim, bucket, sim.totals.slowest.e, 'e');
					this.summarizeSlowestFloor(this.slowest[1], sim, bucket, sim.totals.slowest.t, 't');
				}
				else{
					this.summarizeSlowestFloor(this.slowest[0], sim, bucket, sim.totals.slowest.e);
					this.slowest[1].style = 'visibility: hidden';
					//this.slowest[1].col[2].style = 'display: none';
				}
			}
			else {
				this.slowest[0].style = 'visibility: hidden';
				this.slowest[1].style = 'visibility: hidden';
			}
		}
	};
	summarizeSlowestFloor(node, sim, bucket, slowestData, key = null) {
		node.col[0].textContent = `${slowestData.count}`;
		switch(key){
			case 'e':
				node.col[1].textContent = `${(sim.buckets.e[slowestData.count - sim.start].min * 100).toFixed(2)}%`;
				break;
			case 't':
				node.col[1].textContent = `${timeFormat(sim.buckets.t[slowestData.count - sim.start].max)}`;
				break;
			default:
				node.col[1].textContent = `${(sim.buckets.e[slowestData.count - sim.start].min * 100).toFixed(2)}% / ${timeFormat(sim.buckets.t[slowestData.count - sim.start].max)}`;
		}
		node.col[3].textContent = loc(`portal_mech_boss_${slowestData.boss}`);
		node.col[4].textContent = loc(`portal_spire_type_${slowestData.type}`);
		
		node.col[0].dataset.bucket = slowestData.count - sim.start;
		node.col[2].dataset.bucket = bucket;
		node.col[2].style = null;
		
		let effects = Object.keys(slowestData.status);
		for(var i = 0; i < app.maxStatus; i++){
			if(i < effects.length){
				node.col[i + 5].textContent = loc(`portal_spire_status_${effects[i]}`);
				node.col[i + 5].style = null;
			}
			else{
				node.col[i + 5].textContent = '\u{00a0}';
				node.col[i + 5].style = 'visibility: hidden';
			}
		}
	}
}
