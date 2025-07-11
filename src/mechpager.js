import { app, initData, saveConfig, saveLabels, saveHeap, getMechList, saveMechList, numFormat, throttle } from './app.js';

import { global } from '../evolve/src/vars.js';
import { mechRating, mechSize } from '../evolve/src/portal.js';
import { loc } from '../evolve/src/locale.js';
import { timeFormat } from '../evolve/src/functions.js';

import { evolve } from './data.js';
import { inform, isSpireSetup } from './mechcheatsheet.js';
import { mechConstructor } from './mechconstructor.js';
import { doTheTerrainFactorThing, doTheWeaponFactorThing, doTheFullRatingThing, adjustRawRating } from './mechfactors.js';

export const mechPager = {	
	currentPage: 0,
	initialized: false,
	inTransition: false,
	isVisible: true,
	armed: false,
	copied: false,
	copyPage: 0,
	
	pages: [],
	specialPages: [],
	userLabel: null,
	
	init(){
		if(mechPager.initialized) return;
		
		if(!app.heap['pageFilters']){
			app.heap.pageFilters = {};
		}
		
		let pageButton = $('#pageSelector');
		let pageDropdown = $(pageButton.next('.dropdownContent').get(0)).empty();
		
		let pageContainer = $('#mechLists');
		
		mechPager.userLabel = $(`<input type="text" id="pageUserLabel" class="fullSpan spanImpostor" maxlength="32"></input>`);
		mechPager.userLabel.on('click', (e)=>{ e.stopPropagation() });
		mechPager.userLabel.on('input', mechPager.updateLabel);
		mechPager.userLabel.on('keyup', (e)=>{
			if(e.which == 13)
			{}
		});
		// pageDropdown.append($(`<div id="pageLabelHover" class="fullSpan spanImpostor"></div>`).hide());
		pageDropdown.append(mechPager.userLabel);
		
		mechPager.pages.length = app.maxMechPages;
		for(var i = 0; i < mechPager.pages.length; i++){
			let pName = (app.labels[i]) ? `P${i+1} | ${app.labels[i]}` : `${loc('mcs_pager_page')} ${i+1}`;
			mechPager.pages[i] = (app.config.virtualList)
								? new MechVirtualListPage(i, pName, getMechList(i), i, true)
								: new MechListPage(i, pName, getMechList(i), i, true);
			pageDropdown.append($(`<a data-val="${i}">${i+1}</a>`).on('click', {i: i}, (e)=>{ setTimeout(()=>{ mechPager.showPage(e.data.i); mechPager.update(true); }, 0) }));
			pageContainer.append(mechPager.pages[i].dom);
		}
		// pageDropdown.children('a[data-val]')
			// .on('mouseenter', (e)=>{ if(e.target.dataset.val >= 0) { $('#pageLabelHover').text((app.labels[e.target.dataset.val]) ? app.labels[e.target.dataset.val] : `Page ${(parseInt(e.target.dataset.val) + 1)}`).show() } })
			// .on('mouseleave', (e)=>{ $('#pageLabelHover').hide() });
		
		let hvtPage = new HeavyTitanPage('hvt', loc('mcs_pager_page_heavy_v_titan', [loc('portal_mech_size_large'), loc('portal_mech_size_titan')]), [], false);
		mechPager.specialPages.push(hvtPage);
		pageDropdown.append($(`<a class="fullSpan"></a>`).text(hvtPage.name).on('click', {i: -mechPager.specialPages.length}, (e)=>{ setTimeout(()=>{ mechPager.showPage(e.data.i); mechPager.update(true); }, 0) }));
		pageContainer.append(hvtPage.dom);
		
		let bayPage = (app.config.virtualList)
					? new MechVirtualListPage('mechbay', loc('portal_mechbay_title'), global.portal.mechbay.mechs ?? [], -1, true)
					: new MechListPage('mechbay', loc('portal_mechbay_title'), global.portal.mechbay.mechs ?? [], -1, true);
		mechPager.specialPages.push(bayPage);
		pageDropdown.append($(`<a class="fullSpan"></a>`).text(bayPage.name).on('click', {i: -mechPager.specialPages.length}, (e)=>{ setTimeout(()=>{ mechPager.showPage(e.data.i); mechPager.update(true); }, 0) }));
		pageContainer.append(bayPage.dom);
		
		app.on(app.EV_CLOSE_DROPDOWNS, mechPager.disarmClearList);
		app.on(app.EV_OPEN_DROPDOWN, (e)=>{ $('#listJsonString').val('') });
		
		let listJsonInput = $('#listJsonString').on('click', (e)=>{ e.stopPropagation() }).on('focus', (e)=>{ e.target.select(); });;
		$('#listJsonExport').on('click', (e)=>{
			e.stopPropagation();
			$('#listJsonString').val( JSON.stringify(mechPager.getCurrentList()) ).select();
			document.execCommand("copy");
		});
		
		$('#listJsonForm').on('submit', (e)=>{
			e.preventDefault();
			mechPager.importJSONList();
		});
		
		let deleteConfirmContainer = $($('#clearList').next('.dropdownContent').get(0));
		deleteConfirmContainer.on('click', (e)=>{ e.stopPropagation() });
		$('#clearList').on('click', mechPager.disarmClearList);
		// Page manipulation
		$('#clearListArm').on('click', (e)=>{
			mechPager.armed = !mechPager.armed;
			if(mechPager.armed){
				$('#clearListAbsolutely').toggleClass('inactive', false).on('click', (e)=>{ deleteConfirmContainer.toggleClass('show', false); mechPager.clearList(); mechPager.disarmClearList(); });
			}
			else{
				$('#clearListAbsolutely').toggleClass('inactive', true).off('click');
			}
		});
		$('#copyList').on('click', (e)=>{
			mechPager.copied = true;
			mechPager.copyPage = mechPager.currentPage;
			mechPager.setPasteControls(mechPager.copyPage != mechPager.currentPage);
			inform('info', loc('mcs_info_page_copied'));
		});
		$('#pasteListConfirm').on('click', (e)=>{
			if(mechPager.copyPage == mechPager.currentPage) return;
			mechPager.copied = false;
			mechPager.copyFromTo(mechPager.copyPage, mechPager.currentPage);
			mechPager.setPasteControls(false);
		});
		$('#pasteListClear').on('click', (e)=>{
			if(mechPager.copyPage == mechPager.currentPage) return;
			mechPager.copied = false;
			mechPager.setPasteControls(false);
		});
		
		mechPager.currentPage = app.config.defaultPage;
		mechPager.initialized = true;
		mechPager.showPage(mechPager.currentPage);
		
	},
	showPage(index){
		if(mechPager.initialized == false) return;
		
		for(var i = 0; i < mechPager.pages.length; i++){
			if(i != index){
				mechPager.pages[i].hide();
			}
		}
		for(var i = 0; i < mechPager.specialPages.length; i++){
			if(i != -(index + 1)){
				mechPager.specialPages[i].hide();
			}
		}
		
		if(index < 0){
			// Special pages
			if(Math.abs(index) > mechPager.specialPages.length) return;
			mechPager.currentPage = index;
			switch(mechPager.specialPages[-(index + 1)].key){
				case 'mechbay':
					mechPager.specialPages[-(index + 1)].hide();
					mechPager.specialPages[-(index + 1)].mechList = global.portal.mechbay.mechs ?? [];
					break;
			}
			if(mechPager.isVisible)
				mechPager.specialPages[-(index + 1)].show();
			mechPager.userLabel.attr('style', 'display: none');
			let pageDropdown = $($('#pageSelector').text(`${mechPager.specialPages[-(index + 1)].name}`).next('.dropdownContent').get(0));
			$(pageDropdown.children('a').toggleClass('current', false).get(mechPager.pages.length + Math.abs(index) -1)).toggleClass('current', true);
			mechPager.setCopyControls(mechPager.specialPages[-(index + 1)].mechList.length > 0);
		}
		else{
			// Normal mech lists
			if(index >= mechPager.pages.length) return;
			mechPager.currentPage = index;
			if(mechPager.isVisible)
				mechPager.pages[index].show();
			mechPager.userLabel.attr('style', '');
			mechPager.userLabel.attr('placeholder', `${loc('mcs_pager_page')} ${index+1}`);
			mechPager.userLabel.val((app.labels[index]) ? app.labels[index] : '');
			let pageDropdown = $($('#pageSelector').text((app.labels[index]) ? `P${index+1} | ${app.labels[index]}` : `${loc('mcs_pager_page')} ${index+1}`).next('.dropdownContent').get(0));
			$(pageDropdown.children('a').toggleClass('current', false).get(index)).toggleClass('current', true);
			mechPager.setCopyControls(mechPager.pages[index].mechList.length > 0);
		}
		
		mechPager.setPasteControls(mechPager.copied && mechPager.copyPage != mechPager.currentPage);
		
		app.config.defaultPage = mechPager.currentPage;
		saveConfig();
	},
	update(calc){
		if(mechPager.initialized == false) return;
		if(!mechPager.isVisible) return;
		
		if(calc && !isSpireSetup()) return;
		if(mechPager.currentPage < 0){
			// Special pages
			if(Math.abs(mechPager.currentPage) > mechPager.specialPages.length) return;
			let id = -(mechPager.currentPage + 1);
			//setTimeout(()=>{mechPager.specialPages[id].update(calc)}, 0);
			mechPager.specialPages[id].update(calc);
		}
		else{
			// Normal mech lists
			if(mechPager.currentPage >= mechPager.pages.length) return;
			//setTimeout(()=>{mechPager.pages[mechPager.currentPage].update(calc)}, 0);
			mechPager.pages[mechPager.currentPage].update(calc);
		}
	},
	hide(){
		if(mechPager.initialized == false) return;
		
		for(var i = 0; i < mechPager.pages.length; i++){
			mechPager.pages[i].hide();
		}
		for(var i = 0; i < mechPager.specialPages.length; i++){
			mechPager.specialPages[i].hide();
		}
	},
	addMech(mech){
		if(mechPager.currentPage < 0){
			// Special pages
			if(Math.abs(mechPager.currentPage) > mechPager.specialPages.length) return;
			mechPager.specialPages[-(mechPager.currentPage + 1)].addMech(mech);
		}
		else{
			// Normal mech lists
			if(mechPager.currentPage >= mechPager.pages.length) return;
			mechPager.pages[mechPager.currentPage].addMech(mech);
		}
	},
	getCurrent(){
		if(mechPager.currentPage < 0){
			// Special pages
			if(Math.abs(mechPager.currentPage) > mechPager.specialPages.length) return null;
			let id = -(mechPager.currentPage + 1);
			return mechPager.specialPages[id];
		}
		else{
			// Normal mech lists
			if(mechPager.currentPage >= mechPager.pages.length) return null;
			return mechPager.pages[mechPager.currentPage];
		}
	},
	getCurrentList(){
		if(mechPager.currentPage < 0){
			// Special pages
			if(Math.abs(mechPager.currentPage) > mechPager.specialPages.length) return [];
			let id = -(mechPager.currentPage + 1);
			return mechPager.specialPages[id].mechList;
		}
		else{
			// Normal mech lists
			if(mechPager.currentPage >= mechPager.pages.length) return [];
			return mechPager.pages[mechPager.currentPage].mechList;
		}
	},
	disarmClearList(){
		mechPager.armed = false;
		$('#clearListAbsolutely').toggleClass('inactive', true).off('click');
	},
	clearList(id){
		if(!mechPager.armed) return;
		if(!Number.isInteger(id)){
			id = mechPager.currentPage;
		}
		
		let currentPage;
		if(mechPager.currentPage < 0){
			// Special pages
			if(Math.abs(mechPager.currentPage) > mechPager.specialPages.length) return [];
			let id = -(mechPager.currentPage + 1);
			currentPage = mechPager.specialPages[id];
		}
		else{
			// Normal mech lists
			if(mechPager.currentPage >= mechPager.pages.length) return [];
			currentPage = mechPager.pages[mechPager.currentPage];
		}
		
		if(!currentPage.clearable)
			return;
		
		currentPage.mechList = [];
		if(mechPager.currentPage >= 0)
			saveMechList(mechPager.currentPage, []);
		
		mechPager.setCopyControls(false);
		
		inform('~', `Cleared list ${mechPager.currentPage} ${id}`);
		
		setTimeout(()=>{
			currentPage.hide();
			currentPage.show();
			currentPage.update(isSpireSetup());
		}, 0);
	},
	saveMechList(id, list){
		if(id < 0) return;
		
		inform('log', saveMechList(id, list));
		
		if(id == mechPager.copyPage && (!list || list.length == 0)){
			mechPager.copied = false;
			mechPager.setPasteControls(false);
		}
		if(id == mechPager.currentPage)
			mechPager.setCopyControls(list && list.length > 0);
	},
	updateLabel(e){
		if(mechPager.currentPage < 0) return;
		let val = e.target.value ? e.target.value : '';
		app.labels[mechPager.currentPage] = val.trim().substring(0, 32);
		mechPager.pages[mechPager.currentPage].name = (app.labels[mechPager.currentPage]) ? `P${mechPager.currentPage+1} | ${app.labels[mechPager.currentPage]}` : `${loc('mcs_pager_page')} ${mechPager.currentPage+1}`;
		saveLabels();
		$('#pageSelector').text(mechPager.pages[mechPager.currentPage].name)
		
	},
	setPasteControls(yes){
		if(yes && mechPager.currentPage >= 0)
			$('#pasteList').attr('style', '');
		else
			$('#pasteList').attr('style', 'visibility: hidden');
	},
	setCopyControls(yes){
		if(yes)
			$('#copyList').attr('style', '');
		else
			$('#copyList').attr('style', 'visibility: hidden');
	},
	copyFromTo(fromPage, toPage){
		if(fromPage == toPage) return;
		if(toPage < 0) return;
		
		let copiedPage = (fromPage < 0)? mechPager.specialPages[-(fromPage + 1)] : mechPager.pages[fromPage];
		if(copiedPage.mechList.length == 0) return;
		mechPager.saveMechList(toPage, copiedPage.mechList);
		let currentPage = mechPager.pages[toPage];
		inform('info', loc('mcs_info_page_pasted', [copiedPage.name, currentPage.name]));
		
		currentPage.mechList = getMechList(toPage);
		setTimeout(()=>{
			currentPage.hide();
			currentPage.show();
			currentPage.update(isSpireSetup());
		}, 0);
	},
	importJSONList(){
		let newList = parseMechListJSON($('#listJsonString').val());
		if(newList.length > 0){
			// Set new mech list
			let currentPage = mechPager.getCurrent();
			if(currentPage && currentPage.modifiable){
				inform('success', loc('mcs_success_import'));
				
				mechPager.saveMechList(mechPager.currentPage, newList);
				currentPage.mechList = (mechPager.currentPage < 0) ? newList : getMechList(mechPager.currentPage);
				setTimeout(()=>{
					currentPage.hide();
					currentPage.show();
					currentPage.update(isSpireSetup());
				}, 0);
			}
			else{
				inform('error', loc('mcs_error_page_unmodifiable'));
			}
		}
		else{
			$('#listJsonString').val('');
			inform('error', loc('mcs_error_invalid_str'));
		}
	},
	
};

function parseMechListJSON(input){
	let list = [];
	try{
		list = JSON.parse(input);
	}
	catch(e){
		return [];
	}
	
	if( !Array.isArray(list) ) return [];
	
	let isValid = true;
	for(var i = 0; i < list.length && isValid; i++){
		isValid = isValid 
				&& list[i].hasOwnProperty('size')
				&& list[i].hasOwnProperty('hardpoint')
				&& list[i].hasOwnProperty('chassis')
				&& list[i].hasOwnProperty('equip')
				&& list[i].hasOwnProperty('infernal')
				&& Array.isArray(list[i].hardpoint)
				&& Array.isArray(list[i].equip);
	}
	
	if(isValid)	return list;
	else return [];
}

export class Page {
	shown = false;
	show() {
		if(this.shown) return;
		
		this.shown = true;
	};
	hide() {
		if(!this.shown) return;
		
		this.shown = false;
	};
	update() {
		if(!this.shown) return;
		
	};
}

class MechVirtualListPage extends Page {
	constructor(key, name, mechList, id, modifiable=true) {
		super();
		
		this.key = key;
		this.name = name;
		this.id = id;
		this.mechList = mechList;
		this.items = [];
		this.filteredItems = [];
		this.lines = [];
		this.heights = [];
		this.dom = $(`<div id="mpage-${id}" class="smaller vlist"></div>`).get(0);
		this.modifiable = modifiable;
		this.clearable = true;
		this.originalOrder = true;
		
		this.pageFilters = Object.create(pageFilters);
		if(app.heap.pageFilters[this.key]) Object.assign(this.pageFilters, app.heap.pageFilters[this.key]);
		this.pageMeta = new MetaLine();
		
		// Vanilla
		this.pageMeta.dom = this.pageMeta.dom.get(0);
		this.pageMeta.summaryDom.addEventListener('click', this.filter);
		this.pageMeta.totals = Object.create(metaTotals);
		this.container = document.createElement('div');
		this.container.className = 'mpage-cont';
		
		this.dudString = emptyListDud( (key == 'mechbay') ? loc('mcs_pager_dud_mechbay') : loc('mcs_pager_dud_empty') );
		this.delimiters = 0;
		this.delimitingIndexi = [];
		this.delimItems = [];
		this.delimLines = [];
		
		this.observer;
		this.cobserver;
		this.scrollHandler = throttle(this.scrollHandler.bind(this), 25);
		this.positionVirtualItems = this.positionVirtualItems.bind(this);
		
		this.viewport = {scroll: 0, top: 0, start: 0, end: 0, overscan: 10, length: 50, height: 480};
		
		if(key == 'mechbay')
			this.pageFilters['collector'] = false;
	};
	show() {
		if(this.shown) return;
		
		this.shown = true;
		
		this.cobserver = new IntersectionObserver((entries) => {
			for (let entry of entries) {
				if(entry.target == this.container){
					let offsetTarget = entry.target;
					this.viewport.top = 0;
					this.viewport.height = entry.rootBounds.height;
					this.viewport.length = Math.min(90, Math.max(40, Math.ceil(this.viewport.height / 22 ) + 5));
					while(offsetTarget !== null){
						this.viewport.top += offsetTarget.offsetTop;
						offsetTarget = offsetTarget.offsetParent;
					}
				}
				else if(entry.boundingClientRect.height > 0 && entry.target.dataset.idx >= 0){
					this.filteredItems[entry.target.dataset.idx].height = entry.boundingClientRect.height + 2;
				}
			}
			
			let rollingHeight = 0;
			for(let i = 0; i < this.filteredItems.length; i++){
				this.heights[i] = rollingHeight;
				rollingHeight += this.filteredItems[i].height;
			}
			
		}, { root: null, threshold: [0, 0.01, 0.05, 0.1, 0.5, 0.75, 0.9, 0.99, 1] });
		this.observer = new ResizeObserver((entries) => {
			for (let entry of entries) {
				if(entry.contentRect.height > 0 && entry.target.dataset.idx >= 0){
					this.filteredItems[entry.target.dataset.idx].height = entry.contentRect.height + 2;
				}
			}
			
			let rollingHeight = 0;
			for(let i = 0; i < this.filteredItems.length; i++){
				this.heights[i] = rollingHeight;
				rollingHeight += this.filteredItems[i].height;
			}
		});
		
		let createItems = ( this.mechList.length != this.items.length );
		let rollingHeight = 0;
		let space = 0;
		this.pageMeta.totals = Object.create(metaTotals);
		if(createItems)
			this.items.length = 0;
		
		this.mechList.forEach(function(mech, i){
			let mechItem;
			if(createItems){
				mechItem = new MechItem(mech, i);
				this.items.push(mechItem);
			}
			else{
				mechItem = this.items[i];
			}
			
			if(this.pageFilters[mech.size]){
				this.heights.push(rollingHeight);
				this.filteredItems.push(mechItem);
				rollingHeight += mechItem.height;
			}
			space += mechSize(mech.size);
			this.pageMeta.totals[mech.size]++;
			
		}, this);
		
		for(let i = 0; i < this.viewport.length + this.viewport.overscan * 2; i++){
			let mechLine = new MechVirtualLine(this.modifiable, this.removeMech);
			this.lines.push(mechLine);
			this.observer.observe(mechLine.line, vLineObservationOptions);
			this.cobserver.observe(mechLine.line);
			this.container.appendChild(mechLine.line);
		}
		
		if(this.mechList.length == 0){
			this.dom.appendChild($(this.dudString).get(0));
			this.pageMeta.update(this.pageFilters);
		}
		else{
			let spaceSpan = document.createElement('span');
			spaceSpan.appendChild(document.createTextNode(`${space}`));
			let spaceCapacityStr;
			
			if(this.key == 'mechbay'){
				spaceCapacityStr = ` / ${global.portal.mechbay.max}`;
				if(space > global.portal.mechbay.max) spaceSpan.className = 'error';
			}
			else {
				spaceCapacityStr = `/ \u{221e}`;
			}
			this.pageMeta.spaceDom.replaceChildren(spaceSpan, spaceCapacityStr);
			this.pageMeta.update(this.pageFilters);
			
			for(let i = 0; i < evolve.mech.type.standard.length; i++){
				this.delimLines.push( new GroupVirtualDelimiter(i, new GroupItem('', '', 0)) );
				this.container.appendChild(this.delimLines[i].dom);
			}
			this.dom.appendChild(this.container);
			this.cobserver.observe(this.container);
		}
		
		this.dom.prepend(this.pageMeta.dom);
		
		this.scrollHandler();
		window.addEventListener('resize', this.scrollHandler);
		document.addEventListener('scroll', this.scrollHandler);
	};
	hide() {
		if(!this.shown) return;
		
		this.shown = false;
		
		window.removeEventListener('resize', this.scrollHandler);
		document.removeEventListener('scroll', this.scrollHandler);
		this.lines.length = 0;
		//this.items.length = 0;
		this.filteredItems.length = 0;
		this.heights.length = 0;
		this.dom.removeChild(this.pageMeta.dom);
		if(this.container.parentElement) this.dom.removeChild(this.container);
		this.container.replaceChildren();
		this.dom.replaceChildren();
		
		this.delimiters = 0;
		this.delimitingIndexi.length = 0;
		this.delimItems.length = 0;
		this.delimLines.length = 0;
		
		this.cobserver.disconnect();
		this.observer.disconnect();
	};
	update(calc) {
		if(!this.shown) return;
		
		// First calc new values
		let n = 0;
		let space = 0;
		let edenTax = (this.key == 'mechbay')? (global.eden?.mech_station?.mechs || 0) : 0;
		let fKeys = calc? Object.keys(this.pageMeta.factors) : {};
		
		// TODO: Handle group delimiters
		// CALCULATIONS & reordering branch - phase 1
		if(calc){
			if(this.delimiters > 0){
				//this.dom.children('.delimiter').remove();
				this.delimiters = 0;
				this.delimitingIndexi.length = 0;
				this.delimItems.length = 0;
			}
			this.pageMeta.factors.reset();
			this.items.forEach(function(item){
				space += mechSize(item.mech.size);
				item.calc();
				
				if(item.mech.size !== 'collector'){
					fKeys.forEach(function(f, i){
						switch(f){
							case 'rr':
								if(edenTax > 0)
									edenTax--;
								else if(space <= global.portal.mechbay.max || this.key != 'mechbay')
									this.pageMeta.factors[f].val += item.factors[f].val;
								break;
							default:
								this.pageMeta.factors[f].val = (item.factors[f].val + n * this.pageMeta.factors[f].val)/(n + 1);
						}
					}, this);
					n++;
				}
			}, this);
		}
		
		// No hard calculations
		else{
			this.items.forEach(function(item){
				space += mechSize(item.mech.size);
			});
			
		}
		
		// Page meta updates
		if(calc){
			this.pageMeta.factors.applyValues();
			this.pageMeta.factors['ar'].dom.setAttribute('title', `${loc('mcs_pager_total_raw_rate')}: ${numFormat.format(Math.round(this.pageMeta.factors['rr'].val * 1000 * global.portal.spire.count))}`);
			let etaSummary = (`ET [` + ((this.pageMeta.factors['rr']?.val)? timeFormat(100 / (this.pageMeta.factors['rr'].val)) : timeFormat(-1)) + `]`);
			if(this.key == 'mechbay'){	
				let spaceSpan = document.createElement('span');
				if(space > global.portal.mechbay.max) spaceSpan.className = 'error';
				spaceSpan.appendChild(document.createTextNode(`${space}`));
				this.pageMeta.spaceDom.replaceChildren(spaceSpan, ` / ${global.portal.mechbay.max}`);
				
				etaSummary += `    - ${(100 - global.portal.spire.progress).toFixed(2)}% left [` + ((this.pageMeta.factors['rr']?.val)? timeFormat((100 - global.portal.spire.progress) / (this.pageMeta.factors['rr'].val)) : timeFormat(-1)) + `]`;
				if(global.eden?.mech_station?.mechs > 0){
					etaSummary += ` - ${global.eden.mech_station.mechs} mechs busy in ${loc('tab_eden')}`;
				}
			}
			else {
				
			}
			
			this.pageMeta.etaDom.textContent = etaSummary;
		}
		
		// Mech bay space update
		if(this.key == 'mechbay'){
		}
		else {
			let spaceSpan = document.createElement('span');
			spaceSpan.appendChild(document.createTextNode(`${space}`));
			this.pageMeta.spaceDom.replaceChildren(spaceSpan, '/ \u{221e}');
		}
		
		// calculations & REORDERING branch - phase 2
		if(calc && this.sort(true)){
			// SORTED, virtual list handles visual update
			
			// Insert delimiters
			let chassisGrouping = app.config.sortingType != 0 && app.config.sortingType != 4 && app.config.groupingType == 2 && isSpireSetup();
			if(chassisGrouping){
				let inGroupCount = 0;
				let prevChassis = -1;
				let groupIndex = -1;
				
				for(let i = 0; i < this.filteredItems.length; i++){
					// New group
					if(prevChassis != this.filteredItems[i].mech.chassis){
						if(groupIndex > -1){
							this.delimiters++;
							this.delimitingIndexi.push(groupIndex);
							this.delimItems.push( new GroupItem(prevChassis, loc(`portal_mech_chassis_${prevChassis}`), inGroupCount) );
							inGroupCount = 0;
						}							
						groupIndex = i;
					}
					
					inGroupCount++;
					prevChassis = this.filteredItems[i].mech.chassis;
				}
				if(groupIndex > -1 && inGroupCount > 0){
					this.delimiters++;
					this.delimitingIndexi.push(groupIndex);
					this.delimItems.push( new GroupItem(prevChassis, loc(`portal_mech_chassis_${prevChassis}`), inGroupCount) );
				}
				
				// Make up missing delimiter dom items
				for(let i = this.delimLines.length; i < this.delimiters; i++){
					this.delimLines.push( new GroupVirtualDelimiter( i, this.delimItems[i] ) );
					this.container.appendChild(this.delimLines[i].dom);
				}
			}
		}
		
		//this.scrollHandler();
		this.setVirtualItems(calc, this.viewport.start, this.viewport.end);
	};
	scrollHandler() {
		let posScrollY = window.scrollY;
		if((posScrollY - this.viewport.top) > 0){
			this.viewport.start = this.findStartIndex(this.heights, (posScrollY - this.viewport.top));
			// Delimiter correction
			let correction = 0;
			while( correction < this.delimitingIndexi.length && this.delimitingIndexi[correction] < this.viewport.start ){
				correction++;
			}
			this.viewport.start -= correction;
		}
		else {
			this.viewport.start = 0;
		}
		
		// Expand additional virtual lines, if current ones are not enough due to page resizing
		if(this.lines.length < this.viewport.length + this.viewport.overscan * 2){
			for(let i = this.lines.length; i < this.viewport.length + this.viewport.overscan * 2; i++){
				let mechLine = new MechVirtualLine(this.modifiable, this.removeMech);
				this.lines.push(mechLine);
				this.observer.observe(mechLine.line, vLineObservationOptions);
				this.cobserver.observe(mechLine.line);
				this.container.appendChild(mechLine.line);
			}
		}
		
		this.viewport.end = Math.min(this.filteredItems.length, this.viewport.start + this.viewport.length + this.viewport.overscan);
		this.viewport.start = Math.min((this.filteredItems.length > 0) ? this.filteredItems.length - 1 : 0, Math.max(0, this.viewport.start - this.viewport.overscan));
		
		this.container.style = `height: ${this.getTotalHeight()}px`;
		//$('#debug_box').text(`${posScrollY} / ${this.viewport.start} ${this.viewport.end} / ${this.viewport.top} / ${(posScrollY - this.viewport.top)}`);
		
		this.setVirtualItems(isSpireSetup(), this.viewport.start, this.viewport.end);
		setTimeout((e)=>{window.requestAnimationFrame(this.positionVirtualItems)}, 0);
	};
	setVirtualItems(calc, start, end) {
		let i = start;
		let delimiterOffset = 0;
		for(let d = 0; d < this.delimitingIndexi.length; d++){
			if(i <= this.delimitingIndexi[d]){
				delimiterOffset = 38 * d;
				break;
			}
			if(d == (this.delimitingIndexi.length - 1)){
				delimiterOffset = 38 * this.delimitingIndexi.length;
			}
		}
		
		let posTop = this.getTopHeight(i);
		for(; i < end && (i - start) < this.lines.length; i++){
			//if(i == this.lines[i - start].idx) continue;
			let delimIndex = this.delimitingIndexi.indexOf(i);
			if(delimIndex > -1) {
				delimiterOffset = 38 * (delimIndex + 1); // 36 + 2
				this.delimLines[delimIndex].set( this.delimItems[delimIndex] );
				this.delimLines[delimIndex].dom.style.display = null;
				this.delimLines[delimIndex].dom.style.transform = `translate(0px, ${ posTop + delimiterOffset - 38 }px)`;
			}
			
			this.lines[i - start].set( this.filteredItems[i], i, app.config.truncateWeapons );
			if(calc) this.lines[i - start].calc();
			this.lines[i - start].line.style.display = null;
			this.lines[i - start].line.style.transform = `translate(0px, ${ posTop + delimiterOffset }px)`;
			posTop += this.filteredItems[i].height;
		}
		for(; (i - start) < this.lines.length; i++){
			this.lines[i - start].line.style.display = 'none';
			this.lines[i - start].set( null, -1, app.config.truncateWeapons );
		}
		for(i = this.delimItems.length; i < this.delimLines.length; i++){
			this.delimLines[i].dom.style.display = 'none';
		}
	};
	positionVirtualItems() {
		let delimiterOffset = 0;
		for(let d = 0; d < this.delimitingIndexi.length; d++){
			if(this.viewport.start <= this.delimitingIndexi[d]){
				delimiterOffset = 38 * d;
				break;
			}
			if(d == (this.delimitingIndexi.length - 1)){
				delimiterOffset = 38 * this.delimitingIndexi.length;
			}
		}
		
		let posTop = this.getTopHeight(this.viewport.start);
		for(let i = this.viewport.start; i < this.viewport.end && (i - this.viewport.start) < this.lines.length; i++){
			let delimIndex = this.delimitingIndexi.indexOf(i);
			if(delimIndex > -1) {
				delimiterOffset = 38 * (delimIndex + 1); // 36 + 2
				this.delimLines[delimIndex].dom.style.transform = `translate(0px, ${ posTop + delimiterOffset - 38 }px)`;
			}
			this.lines[i - this.viewport.start].line.style.transform = `translate(0px, ${ posTop + delimiterOffset }px)`;
			posTop += this.filteredItems[i].height;
		}
	};
	getTotalHeight(idx = -1) {
		return this.heights[this.heights.length - 1] + 42 + this.delimitingIndexi.length * 38;
	};
	getTopHeight(idx = -1) {
		if(idx < 0 || idx >= this.heights.length)
			return 0;
		else
			return this.heights[idx];
	};
	findStartIndex(arr, offset) {
		let left = 0;
		let right = arr.length - 1;
		while( left <= right ){
			let mid = left + Math.floor((right - left) / 2);
			if(arr[mid] < offset){
				left = mid + 1;
			}
			else if(arr[mid] > offset){
				right = mid - 1;
			}
			else {
				return mid - 1;
			}
		}
		if(arr.length > 0 && left > 0){
			return right - 1;
		}
		return 0;
	};
	filter = (e)=>{
		if(!this.shown) return;
		if(e && e.target && e.target.dataset.hasOwnProperty('pageFilter')){
			switch(e.target.dataset['pageFilter']){
				case 'minion':
				case 'small':
					this.pageFilters['minion'] = !this.pageFilters['minion'];
					this.pageFilters['small'] = !this.pageFilters['small'];
					break;
				case 'fiend':
				case 'medium':
					this.pageFilters['fiend'] = !this.pageFilters['fiend'];
					this.pageFilters['medium'] = !this.pageFilters['medium'];
					break;
				case 'cyberdemon':
				case 'large':
					this.pageFilters['cyberdemon'] = !this.pageFilters['cyberdemon'];
					this.pageFilters['large'] = !this.pageFilters['large'];
					break;
				case 'archfiend':
				case 'titan':
					this.pageFilters['archfiend'] = !this.pageFilters['archfiend'];
					this.pageFilters['titan'] = !this.pageFilters['titan'];
					break;
				default:
					this.pageFilters[e.target.dataset['pageFilter']] = !this.pageFilters[e.target.dataset['pageFilter']];
			}
			
			app.heap.pageFilters[this.key] = this.pageFilters;
			saveHeap();
			
			setTimeout(()=>{
				this.hide();
				this.show();
				this.pageMeta.update(this.pageFilters);
				this.update(isSpireSetup());
			}, 0);
		}
		
	};
	sort(yes){
		let wasSorted = false;
		
		let sortMap;
		let mapSorter;
		let overrideGrouping = (app.config.sortingType == 4) ? 0 : app.config.groupingType;
		switch(overrideGrouping){
			case 1:
			case 2:
				mapSorter = (a, b) =>	(a.v2 < b.v2) ? 1 : (a.v2 > b.v2) ? -1 : 
										((a.v1 < b.v1)? -app.config.sortingDirection : (a.v1 > b.v1)? app.config.sortingDirection : 0);
				break;
			default:
				mapSorter = (a, b) => (a.v1 < b.v1) ? -app.config.sortingDirection : (a.v1 > b.v1) ? app.config.sortingDirection : 0;
				break;
		}
		
		switch(app.config.sortingType){
			case 1:
			case 2:
			case 3:
				sortMap = this.filteredItems.map((item, i) => (
					{ 
						i, 
						v1: (()=>{switch(app.config.sortingType){
							case 1:
								return item.factors.ff.val;
							case 2:
								return item.factors.ar.val;
							case 3:
								return sizeSortingRatings[item.mech.size];
						}})(), 
						v2: (()=>{switch(overrideGrouping){
							case 1:
								return sizeSortingRatings[item.mech.size];
							case 2:
								return chassisSortingRatings[item.mech.chassis];
							default:
								return null;
						}})()
					}
				));
				wasSorted = true;
				this.originalOrder = false;
				break;
			case 4:
				// Original unsorted mech list order
				if(this.originalOrder)
					return false;
				else{
					sortMap = this.filteredItems.map((item, i) => (
						{ 
							i, 
							v1: this.mechList.indexOf(item.mech), 
							v2: null
						}
					), this);
					mapSorter = (b, a) => (a.v1 < b.v1) ? 1 : (a.v1 > b.v1) ? -1 : 0;
					wasSorted = true;
					this.originalOrder = true;
				}
				break;
			default:
				return false;
		}
		
		sortMap.sort(mapSorter);
		this.filteredItems = sortMap.map((sl) => this.filteredItems[sl.i]);
		return wasSorted;
	};
	addMech(mech) {
		//if(!this.shown) return;
		if(!this.modifiable){
			inform('error', loc('mcs_error_page_unmodifiable'));
			return;
		}
		
		if(this.key == 'mechbay' && global.eden?.mech_station?.mechs) global.eden.mech_station.mechs = 0;
		
		this.mechList.push(mech);
		mechPager.saveMechList(this.id, this.mechList);
		
		let mechItem = new MechItem(mech, this.mechList.length);
		this.items.push(mechItem);
		this.pageMeta.totals[mech.size]++;
		this.pageMeta.update(this.pageFilters);
		this.hide();
		this.show();
		
		inform('log', 'Mech added', 'added_mech');
	};
	removeMech = (vline)=>{
		if(!vline || vline.mechItem === null) return;
		let i = this.mechList.indexOf(vline.mechItem.mech);
		let k = this.items.indexOf(vline.mechItem);		
		if(i < 0 || k < 0) return;
		
		this.pageMeta.totals[this.mechList[i].size]--;
		this.mechList.splice(i, 1);
		this.items.splice(k, 1);
		
		mechPager.saveMechList(this.id, this.mechList);
		
		if(this.key == 'mechbay' && global.eden?.mech_station?.mechs) global.eden.mech_station.mechs = 0;
		
		setTimeout(()=>{
			this.hide();
			this.show();
			this.pageMeta.update(this.pageFilters);
			this.update(isSpireSetup())
		}, 0);
	};
}

class MechListPage extends Page {
	constructor(key, name, mechList, id, modifiable=true) {
		super();
		
		this.key = key;
		this.name = name;
		this.id = id;
		this.mechList = mechList;
		this.lines = [];
		this.dom = $(`<div id="mpage-${id}" class="smaller"></div>`);
		this.modifiable = modifiable;
		this.clearable = true;
		this.originalOrder = true;
		
		this.pageFilters = Object.create(pageFilters);
		if(app.heap.pageFilters[this.key]) Object.assign(this.pageFilters, app.heap.pageFilters[this.key]);
		this.pageMeta = new MetaLine();
		// Vanilla
		this.pageMeta.summaryDom.addEventListener('click', this.filter);
		this.pageMeta.totals = Object.create(metaTotals);
		
		this.dudString = emptyListDud( (key == 'mechbay') ? loc('mcs_pager_dud_mechbay') : loc('mcs_pager_dud_empty') );
		this.delimiters = 0;
		
		if(key == 'mechbay')
			this.pageFilters['collector'] = false;
	};
	show() {
		if(this.shown) return;
		
		this.pageMeta.dom.detach();
		this.dom.empty();
		this.shown = true;
		
		let space = 0;
		this.pageMeta.totals = Object.create(metaTotals);
		this.mechList.forEach(function(mech, i){
			let mechLine = new MechLine(mech, i, app.config.truncateWeapons, this.modifiable, this.removeMech);
			this.lines.push(mechLine);
			if(this.pageFilters[mech.size])
				this.dom.append(mechLine.dom);
			space += mechSize(mech.size);
			this.pageMeta.totals[mech.size]++;
			
		}, this);
		
		if(this.lines.length == 0){
			this.dom.append(this.dudString);
			this.pageMeta.update(this.pageFilters);
		}
		else{
			let spaceSpan = document.createElement('span');
			spaceSpan.appendChild(document.createTextNode(`${space}`));
			let spaceCapacityStr;
			
			if(this.key == 'mechbay'){
				spaceCapacityStr = ` / ${global.portal.mechbay.max}`;
				if(space > global.portal.mechbay.max) spaceSpan.className = 'error';
			}
			else {
				spaceCapacityStr = `/ \u{221e}`;
			}
			this.pageMeta.spaceDom.replaceChildren(spaceSpan, spaceCapacityStr);
			this.pageMeta.update(this.pageFilters);
		}
		
		this.dom.prepend(this.pageMeta.dom);
	};
	hide() {
		if(!this.shown) return;
		
		this.shown = false;
		
		this.lines.length = 0;
		this.pageMeta.dom.detach();
		this.dom.empty();
		
		this.delimiters = 0;
	};
	update(calc) {
		if(!this.shown) return;
		
		// First calc new values
		let n = 0;
		let space = 0;
		let edenTax = (this.key == 'mechbay')? (global.eden?.mech_station?.mechs || 0) : 0;
		let fKeys = calc? Object.keys(this.pageMeta.factors) : {};
		
		// CALCULATIONS & reordering branch - phase 1
		if(calc){
			this.pageMeta.factors.reset();
			for(var i = 0; i < this.mechList.length; i++){
				space += mechSize(this.mechList[i].size);
				if(edenTax > 0 && this.mechList[i].size !== 'collector')
					edenTax--;
				else if(space <= global.portal.mechbay.max || this.key != 'mechbay')
					this.pageMeta.factors['rr'].val += mechRating(this.mechList[i], false);
			}
		}
		space = 0;
		
		// CALCULATIONS & reordering branch - phase 2
		if(calc){
			if(this.delimiters > 0){
				this.dom.children('.delimiter').remove();
				this.delimiters = 0;
			}
			this.lines.forEach(function(line){
				space += mechSize(line.mech.size);
				line.calc();
				
				if(line.mech.size !== 'collector'){
					fKeys.forEach(function(f, i){
						switch(f){
							case 'rr':
								break;
							default:
								this.pageMeta.factors[f].val = (line.factors[f].val + n * this.pageMeta.factors[f].val)/(n + 1);
						}
					}, this);
					n++;
				}
			}, this);
		}
		// Static updates & filtering branch
		else{
			let prevLine;
			
			let prevChassis = -1;
			let prevIndex = 0;
			let newChassis = -1;
			let inGroup = 0;
			let chassisGrouping = app.config.sortingType != 0 && app.config.sortingType != 4 && app.config.groupingType == 2 && isSpireSetup();
			
			if(this.delimiters > 0){
				this.dom.children('.delimiter').remove();
				this.delimiters = 0;
			}
			
			this.lines.forEach(function(line, i){
				space += mechSize(line.mech.size);
				let attached = false;
				if(this.pageFilters[line.mech.size] && line.dom.parent().length == 0){
					if(prevLine?.dom.parent().length > 0)
						prevLine.dom.after(line.dom);
					else
						this.pageMeta.dom.after(line.dom);
					prevLine = line;
					attached = true;
				}
				else if(this.pageFilters[line.mech.size] == false)
					line.dom.detach();
				else{
					prevLine = line;
					attached = true;
				}
				if(chassisGrouping && attached){
					newChassis = chassisSortingRatings[line.mech.chassis];
					if(prevChassis >= 0 && prevChassis != newChassis){
						this.lines[prevIndex].dom.before(GroupDelimiter('portal_mech_chassis_', this.lines[prevIndex].mech.chassis, inGroup));
						this.delimiters++;
						inGroup = 1;
						prevIndex = i;
					}
					else 
						inGroup++;
					
					if(prevChassis == -1)
						prevIndex = i;
					
					prevChassis = newChassis;
				}
				line.truncate(app.config.truncateWeapons);
			}, this);
			
			if(chassisGrouping && prevIndex >= 0 && prevIndex < this.lines.length){
				this.lines[prevIndex].dom.before(GroupDelimiter('portal_mech_chassis_', this.lines[prevIndex].mech.chassis, inGroup));
				this.delimiters++;
			}
		}
		
		// Page meta updates
		if(calc){
			this.pageMeta.factors.applyValues();
			this.pageMeta.factors['ar'].dom.setAttribute('title', `${loc('mcs_pager_total_raw_rate')}: ${numFormat.format(Math.round(this.pageMeta.factors['rr'].val * 1000 * global.portal.spire.count))}`);
			let etaSummary = (`ET [` + ((this.pageMeta.factors['rr']?.val)? timeFormat(100 / (this.pageMeta.factors['rr'].val)) : timeFormat(-1)) + `]`);
			if(this.key == 'mechbay'){	
				let spaceSpan = document.createElement('span');
				if(space > global.portal.mechbay.max) spaceSpan.className = 'error';
				spaceSpan.appendChild(document.createTextNode(`${space}`));
				this.pageMeta.spaceDom.replaceChildren(spaceSpan, ` / ${global.portal.mechbay.max}`);
				
				etaSummary += `    - ${(100 - global.portal.spire.progress).toFixed(2)}% left [` + ((this.pageMeta.factors['rr']?.val)? timeFormat((100 - global.portal.spire.progress) / (this.pageMeta.factors['rr'].val)) : timeFormat(-1)) + `]`;
				if(global.eden?.mech_station?.mechs > 0){
					etaSummary += ` - ${global.eden.mech_station.mechs} mechs busy in ${loc('tab_eden')}`;
				}
			}
			else {
				
			}
			
			this.pageMeta.etaDom.textContent = etaSummary;
		}
		
		// Mech bay space update
		if(this.key == 'mechbay'){
		}
		else {
			let spaceSpan = document.createElement('span');
			spaceSpan.appendChild(document.createTextNode(`${space}`));
			this.pageMeta.spaceDom.replaceChildren(spaceSpan, '/ \u{221e}');
		}
		
		// Then sort them
		// calculations & REORDERING branch - phase 3
		if(calc && this.sort(true)){
			let prevChassis = -1;
			let prevIndex = -1;
			let newChassis = -1;
			let inGroup = 0;
			let chassisGrouping = app.config.sortingType != 0 && app.config.sortingType != 4 && app.config.groupingType == 2;
			for(var i = this.lines.length - 1; i >= 0; i--){
				if(this.pageFilters[this.lines[i].mech.size]){
					if(chassisGrouping){
						newChassis = chassisSortingRatings[this.lines[i].mech.chassis];
						if(prevChassis >= 0 && prevChassis != newChassis){
							this.pageMeta.dom.after(GroupDelimiter('portal_mech_chassis_', this.lines[prevIndex].mech.chassis, inGroup));
							this.delimiters++;
							inGroup = 1;
						}
						else
							inGroup++;
						
						prevChassis = newChassis;
						prevIndex = i;
					}
					this.pageMeta.dom.after(this.lines[i].dom);
				}
				else
					this.lines[i].dom.detach();
			}
			if(chassisGrouping && prevIndex >= 0 && prevIndex < this.lines.length){
				this.pageMeta.dom.after(GroupDelimiter('portal_mech_chassis_', this.lines[prevIndex].mech.chassis, inGroup));
				this.delimiters++;
			}
		}
		
	};
	sort(yes){
		let wasSorted = false;
		
		let sortMap;
		let mapSorter;
		let overrideGrouping = (app.config.sortingType == 4) ? 0 : app.config.groupingType;
		switch(overrideGrouping){
			case 1:
			case 2:
				mapSorter = (a, b) =>	(a.v2 < b.v2) ? 1 : (a.v2 > b.v2) ? -1 : 
										((a.v1 < b.v1)? -app.config.sortingDirection : (a.v1 > b.v1)? app.config.sortingDirection : 0);
				break;
			default:
				mapSorter = (a, b) => (a.v1 < b.v1) ? -app.config.sortingDirection : (a.v1 > b.v1) ? app.config.sortingDirection : 0;
				break;
		}
		
		switch(app.config.sortingType){
			case 1:
			case 2:
			case 3:
				sortMap = this.lines.map((line, i) => (
					{ 
						i, 
						v1: (()=>{switch(app.config.sortingType){
							case 1:
								return line.factors.ff.val;
							case 2:
								return line.factors.ar.val;
							case 3:
								return sizeSortingRatings[line.mech.size];
						}})(), 
						v2: (()=>{switch(overrideGrouping){
							case 1:
								return sizeSortingRatings[line.mech.size];
							case 2:
								return chassisSortingRatings[line.mech.chassis];
							default:
								return null;
						}})()
					}
				));
				wasSorted = true;
				this.originalOrder = false;
				break;
			case 4:
				// Original unsorted mech list order
				if(this.originalOrder)
					return false;
				else{
					sortMap = this.lines.map((line, i) => (
						{ 
							i, 
							v1: this.mechList.indexOf(line.mech), 
							v2: null
						}
					), this);
					mapSorter = (b, a) => (a.v1 < b.v1) ? 1 : (a.v1 > b.v1) ? -1 : 0;
					wasSorted = true;
					this.originalOrder = true;
				}
				break;
			default:
				return false;
		}
		
		sortMap.sort(mapSorter);
		this.lines = sortMap.map((sl) => this.lines[sl.i]);
		return wasSorted;
	};
	filter = (e)=>{
		if(!this.shown) return;
		if(e && e.target && e.target.dataset.hasOwnProperty('pageFilter')){
			switch(e.target.dataset['pageFilter']){
				case 'minion':
				case 'small':
					this.pageFilters['minion'] = !this.pageFilters['minion'];
					this.pageFilters['small'] = !this.pageFilters['small'];
					break;
				case 'fiend':
				case 'medium':
					this.pageFilters['fiend'] = !this.pageFilters['fiend'];
					this.pageFilters['medium'] = !this.pageFilters['medium'];
					break;
				case 'cyberdemon':
				case 'large':
					this.pageFilters['cyberdemon'] = !this.pageFilters['cyberdemon'];
					this.pageFilters['large'] = !this.pageFilters['large'];
					break;
				case 'archfiend':
				case 'titan':
					this.pageFilters['archfiend'] = !this.pageFilters['archfiend'];
					this.pageFilters['titan'] = !this.pageFilters['titan'];
					break;
				default:
					this.pageFilters[e.target.dataset['pageFilter']] = !this.pageFilters[e.target.dataset['pageFilter']];
			}
			
			app.heap.pageFilters[this.key] = this.pageFilters;
			saveHeap();
			
			setTimeout(()=>{
				this.pageMeta.update(this.pageFilters);
				this.update(false)
			}, 0);
		}
		
	};
	addMech(mech) {
		//if(!this.shown) return;
		if(!this.modifiable){
			inform('error', loc('mcs_error_page_unmodifiable'));
			return;
		}
		
		if(this.lines.length == 0){
			this.pageMeta.dom.detach();
			this.dom.empty();
			this.dom.append(this.pageMeta.dom);
		}
		
		if(this.key == 'mechbay' && global.eden?.mech_station?.mechs) global.eden.mech_station.mechs = 0;
		
		let mechLine = new MechLine(mech, this.mechList.length, app.config.truncateWeapons, this.modifiable, this.removeMech);
		this.mechList.push(mech);
		this.lines.push(mechLine);
		this.dom.append(mechLine.dom);
		this.pageMeta.totals[mech.size]++;
		this.pageMeta.update(this.pageFilters);
		
		mechPager.saveMechList(this.id, this.mechList);
		
		inform('log', 'Mech added', 'added_mech');
	};
	//removeMech = (e)=>{
	//	let i = this.mechList.indexOf(e.data.line.mech);
	//	let k = this.lines.indexOf(e.data.line);
	removeMech = (line)=>{
		let i = this.mechList.indexOf(line.mech);
		let k = this.lines.indexOf(line);		
		if(i < 0 || k < 0) return;
		
		line.dom.remove();
		this.pageMeta.totals[this.mechList[i].size]--;
		this.mechList.splice(i, 1);
		//this.lines[k].dom.remove();
		this.lines.splice(k, 1);
		
		mechPager.saveMechList(this.id, this.mechList);
		
		if(this.lines.length == 0){
			this.pageMeta.dom.detach();
			this.dom.empty();
			this.dom.append(this.pageMeta.dom);
			this.dom.append(this.dudString);
		}
		
		if(this.key == 'mechbay' && global.eden?.mech_station?.mechs) global.eden.mech_station.mechs = 0;
		
		setTimeout(()=>{
			this.pageMeta.update(this.pageFilters);
			this.update(isSpireSetup())
		}, 0);
	};
}

class HeavyTitanPage extends MechListPage {
	constructor(key, name, mechList, id, modifiable=false) {
		let tvhList = [
			{
				size: 'large',
				hardpoint: ['tesla', 'tesla'],
				chassis: 'hover',
				equip: ['special', 'coolant', 'shields'],
				infernal: false
			},
			{
				size: 'titan',
				hardpoint: ['tesla', 'tesla', 'tesla', 'tesla'],
				chassis: 'hover',
				equip: ['special', 'coolant', 'shields', 'sonar', 'stabilizer'],
				infernal: false
			}
		];
		super(key, name, tvhList, id, false);
		this.clearable = false;
		
		this.explainLine = $('<div class="line"><div class="text" id="hvtExplain"></div></div>');
		
		let spanTitan = `<span class="titan">${loc('portal_mech_size_titan')}</span>`;
		let spanHeavy = `<span class="large">${loc('portal_mech_size_large')}</span>`;
		let spanTargetting = `<i>${loc('portal_mech_equip_target')}</i>`;
		this.explainLine.children('#hvtExplain').append(`<p>${loc('mcs_hvt_p1', [spanTitan, spanHeavy, spanTargetting])}</p>`).append(`<p>${loc('mcs_hvt_p2')}</p>`);
	};
	syncWithConstructor(){
		if(!evolve.mech.size.standard.includes(mechConstructor.mech.size))
			return;
		
		for(let mech of this.mechList){
			mech.chassis = mechConstructor.mech.chassis;
			mech.infernal = mechConstructor.mech.infernal;
			for(let i = 0; i < mech.hardpoint.length; i++){
				if(i < mechConstructor.mech.hardpoint.length)
					mech.hardpoint[i] = mechConstructor.mech.hardpoint[i];
			}
			for(let i = 0; i < mech.equip.length; i++){
				if(i < mechConstructor.mech.equip.length)
					mech.equip[i] = mechConstructor.mech.equip[i];
			}
		}
	};
	show() {
		// Prepare loadout
		this.syncWithConstructor();
		
		// Default show
		super.show();
		this.dom.append(this.explainLine);
		
		app.on(app.EV_CONSTRUCTOR, (e)=>{ this.hide(); this.show(); this.update(isSpireSetup()); });
	};
	hide() {
		app.off(app.EV_CONSTRUCTOR);
		
		this.explainLine.detach();
		super.hide()
	};
	update(calc) {
		// Prepare loadout
		this.syncWithConstructor();
		
		this.explainLine.detach();
		// Default update
		super.update(calc);
		this.dom.append(this.explainLine);
	};
	addMech(mech) {
		inform('error', loc('mcs_error_page_unmodifiable'));
		return;
	};
	removeMech = (line)=>{
		return;
	};
	
}

const emptyListDud = (text) => `<div class="line" ><div class="text"><span><i>&lt; ${text.replaceAll("<", "&lt;").replaceAll(">", "&gt;")} &gt;</i></span></div></div>`;

var mechAllSizes = evolve.mech.size.standard.concat( evolve.mech.size.warlord );

const sizeSortingRatings = {
	'collector': 0,
	'minion': 1,
	'small': 2,
	'fiend': 3,
	'medium': 4,
	'cyberdemon': 5,
	'large': 6,
	'archfiend': 7,
	'titan': 8
};
mechAllSizes.forEach((s)=>{
	sizeSortingRatings[s] ??= 0;
});

const chassisSortingRatings = Object.fromEntries( 
	[...new Set([...evolve.mech.type.standard, ...evolve.mech.type.minion, ...evolve.mech.type.fiend, ...evolve.mech.type.cyberdemon, ...evolve.mech.type.archfiend])]
		.sort().map((entry, i) => [entry, i])
	);

const pageFilters = Object.fromEntries(mechAllSizes.map((s)=>[s, true]));
const metaTotals = Object.fromEntries(mechAllSizes.map((s)=>[s, 0]));

function GroupDelimiter(locString, name, count){			
	let delNode = document.createElement('div');
	delNode.className = `mcLn line delimiter ${name}`;
	let titleDiv = document.createElement('div');
	titleDiv.className = 'title';
	let delSpan = document.createElement('span');
	delSpan.textContent = `${count}x ${loc(`${locString}${name}`)}`;
	titleDiv.appendChild(delSpan);
	delNode.appendChild(titleDiv);
	
	return delNode;
}

function LineFactors(){
	this.tf = {
		val: 0,
		dom: null
	};
	this.wf = {
		val: 0,
		dom: null
	};
	this.ff = {
		val: 0,
		dom: null
	};
	this.ar = {
		val: 0,
		dom: null
	};
	this.rr = {
		val: 0,
		dom: null
	};
}

const lineFactorKeys = Object.keys(new LineFactors());

LineFactors.prototype.applyValues = function(){
	lineFactorKeys.forEach(function(f){
		switch(f){
			case 'rr':
				break;
			case 'ar':
				if(this[f].val != 0)
					this[f].dom.textContent = numFormat.format((this[f].val * 1000).toFixed(0));
				else
					this[f].dom.textContent = '-';
				break;
			default:
				this[f].dom.textContent = (this[f].val * 100).toFixed(1) + '%';
		}
	}, this);
}
LineFactors.prototype.reset = function(){
	lineFactorKeys.forEach(function(f){
		this[f].val = 0;
	}, this);
}

class MetaLine {
	constructor(){
		
		this.factors = new LineFactors();
		
		let stats = [];
		lineFactorKeys.forEach(function(f, i){
			if(f == 'rr') return;
			let statDiv = document.createElement('div');
			statDiv.className = `stat sco${i}`;
			stats.push(statDiv);
			this.factors[f].dom = statDiv;
		}, this);
		
		// Vanilla
		let line = document.createElement('div');
		line.className = `mcLn line meta`;
		
		let title = document.createElement('div');
		title.className = 'title';
		this.spaceDom = document.createElement('span');
		this.summaryDom = document.createElement('span');
		this.summaryDom.className = 'summary';
		this.summaryDom.setAttribute('title', loc('mcs_pager_filter'));
		title.appendChild(this.spaceDom);
		title.appendChild(this.summaryDom);
						
		let description = document.createElement('div');
		description.className = 'form';
		
		this.etaDom = document.createElement('span');
		description.appendChild(this.etaDom);
			
		line.appendChild(title);
		for(let stat of stats){
			line.appendChild(stat);
		}
		
		line.appendChild(description);
		this.dom = $(line);
		
		
	};
	update(filters){
		let mechCount = [];
		mechCount.push(['titan', this.totals['titan'] + this.totals['archfiend'], filters['titan']]);
		mechCount.push(['large', this.totals['large'] + this.totals['cyberdemon'], filters['large']]);
		mechCount.push(['medium', this.totals['medium'] + this.totals['fiend'], filters['medium']]);
		mechCount.push(['small', this.totals['small'] + this.totals['minion'], filters['small']]);
		mechCount.push(['collector', this.totals['collector'], filters['collector']]);
		
		// Vanilla
		let newSummary = [];
		mechCount.forEach(function(d){
			if(d[1] > 0){
				let mechPip = document.createElement('a');
				mechPip.className = `${d[0]} clickable`;
				mechPip.appendChild(document.createTextNode(`${(d[2]) ? '\u{25fc}' : '\u{25fb}'} ${d[1]}`));
				mechPip.dataset.pageFilter = `${d[0]}`;
				newSummary.push(mechPip);
			}
			// \u{25fb} \u{25fc}
		});
		this.summaryDom.replaceChildren(...newSummary);
	};
}

const vLineObservationOptions = { box: 'border-box' };

function GroupItem(key, label, count){
	this.key = key;
	this.label = label;
	this.count = count;
}

class GroupVirtualDelimiter {
	constructor(i, groupItem){
		this.idx = i;
		this.dom = document.createElement('div');
		this.dom.className = `mcLn line delimiter ${groupItem.key}`;
		let titleDiv = document.createElement('div');
		titleDiv.className = 'title';
		this.label = document.createElement('span');
		this.label.textContent = `${groupItem.count}x ${groupItem.label}`;
		titleDiv.appendChild(this.label);
		this.dom.appendChild(titleDiv);
	};
	set(groupItem){
		this.dom.className = `mcLn line delimiter ${groupItem.key}`;
		this.label.textContent = `${groupItem.count}x ${groupItem.label}`;
	};
}

export class MechItem {
	constructor(mech, i){
		this.idx = i;
		this.mech = mech;
		this.factors = new LineFactors();
		this.height = 22;
	};
	calc(){
		this.factors.tf.val = doTheTerrainFactorThing(this.mech);
		this.factors.wf.val = (this.mech.size != 'collector')? doTheWeaponFactorThing(this.mech) : 0;
		this.factors.ff.val = (this.mech.size != 'collector')? this.factors.tf.val * this.factors.wf.val : this.factors.tf.val;
		this.factors.rr.val = mechRating(this.mech, false);
		this.factors.ar.val = adjustRawRating(this.mech, this.factors.rr.val);		
	};
}

export class MechVirtualLine {
	constructor(deletable=true, removeCallback){
		this.deletable = deletable;
		this.removeCallback = removeCallback;
		this.mechItem = null;
		this.idx = -1;
		
		// Vanilla
		let line = document.createElement('div');
		line.className = `mcLn line`;
		line.dataset.idx = this.idx;
		
		let title = document.createElement('div');
		title.className = 'title';
		let size = document.createElement('span');
		size.className = 'mcCls';
		let type = document.createElement('span');
		title.appendChild(size);
		title.appendChild(type);
		
		this.factors = new LineFactors();
		let stats = [];
		lineFactorKeys.forEach(function(f, i){
			if(f == 'rr') return;
			let statDiv = document.createElement('div');
			statDiv.className = `stat sco${i}`;
			stats.push(statDiv);
			this.factors[f].dom = statDiv;
		}, this);
				
		let description = document.createElement('div');
		description.className = 'text';
		let wepDom = document.createElement('span');
		let equipSpan = document.createElement('span');
		equipSpan.className = 'mcCls';
		
		let deleteSpan;
		if(deletable){
			deleteSpan = document.createElement('span');
			deleteSpan.className = 'delete';
			deleteSpan.appendChild(document.createTextNode('x'));
			description.appendChild(deleteSpan);
			
			deleteSpan.addEventListener('click', removeCallback.bind(null, this), /*{'once': true}*/);
		}
		description.appendChild(wepDom);
		description.appendChild(equipSpan);
			
		line.appendChild(title);
		for(let stat of stats){
			line.appendChild(stat);
		}
		
		line.appendChild(description);
		this.line = line;
		this.size = size;
		this.type = type;
		this.wep = wepDom;
		this.equip = equipSpan;
		this.delet = (deletable) ? deleteSpan : null;
		
	};
	set(mechItem, idx, truncate){
		this.mechItem = mechItem;
		this.idx = idx;
		
		if(!this.mechItem) {
			// TODO: remove delete event listeners??
			return;
		}
		let weapons = [];
		mechItem.mech.hardpoint.forEach(function(w, i){
			if(truncate && i > 0) { weapons.push('..'); return;}
			weapons.push(loc(`portal_mech_weapon_${w}`));
		});
		
		let equips = [];
		mechItem.mech.equip.forEach(function(e){
			equips.push(loc(`portal_mech_equip_${mechConstructor.filterEquip(mechItem.mech.size, e)}`));
		});
		
		this.line.dataset.idx = this.idx;
		this.line.className = `mcLn line ${mechItem.mech.size} ${mechItem.mech.chassis} ${(mechItem.mech.infernal && global.blood['prepared'] == 3)? 'infernal' : ''}`;
		this.size.textContent = loc(`portal_mech_size_${mechItem.mech.size}`);
		this.type.textContent = loc(`portal_mech_chassis_${mechItem.mech.chassis}`);
		
		lineFactorKeys.forEach(function(f, i){
			if(f == 'rr') return;
			this.factors[f].val = mechItem.factors[f].val
		}, this);
		//this.factors.applyValues();
		
		this.wep.textContent = weapons.join(' | ');
		this.equip.textContent = equips.join(' | ');
		
		// TODO: add delete event listeners??
	};
	calc(){
		if(this.mechItem === null) return;
		
		lineFactorKeys.forEach(function(f, i){
			if(f == 'rr') return;
			this.factors[f].val = this.mechItem.factors[f].val
		}, this);
		this.factors.applyValues();
	}
}

export class MechLine {
	constructor(mech, i, truncate, deletable=true, removeCallback){
		
		this.idx = i;
		this.mech = mech;
		this.factors = new LineFactors();
		
		let weapons = [];
		this.mech.hardpoint.forEach(function(w, i){
			if(truncate && i > 0) { weapons.push('..'); return;}
			weapons.push(loc(`portal_mech_weapon_${w}`));
		});
		
		let equips = [];
		this.mech.equip.forEach(function(e){
			equips.push(loc(`portal_mech_equip_${mechConstructor.filterEquip(this.mech.size, e)}`));
		}, this);
		
		// Vanilla
		let line = document.createElement('div');
		line.className = `mcLn line ${this.mech.size} ${this.mech.chassis} ${(this.mech.infernal && global.blood['prepared'] == 3)? 'infernal' : ''}`;
		
		let title = document.createElement('div');
		title.className = 'title';
		let size = document.createElement('span');
		size.className = 'mcCls';
		size.appendChild(document.createTextNode(loc(`portal_mech_size_${this.mech.size}`)));
		if(this.mech.infernal){
			let infernal = document.createElement('sup');
			infernal.appendChild(document.createTextNode('Inf'));
			size.appendChild(infernal);
		}
		let type = document.createElement('span');
		type.appendChild(document.createTextNode(loc(`portal_mech_chassis_${this.mech.chassis}`)));
		title.appendChild(size);
		title.appendChild(type);
		
		let stats = [];
		lineFactorKeys.forEach(function(f, i){
			if(f == 'rr') return;
			let statDiv = document.createElement('div');
			statDiv.className = `stat sco${i}`;
			stats.push(statDiv);
			this.factors[f].dom = statDiv;
		}, this);
				
		let description = document.createElement('div');
		description.className = 'text';
		
		this.wepDom = document.createElement('span');
		this.wepDom.appendChild(document.createTextNode(weapons.join(' | ')));
		
		let equipSpan = document.createElement('span');
		equipSpan.className = 'mcCls';
		equipSpan.appendChild(document.createTextNode(equips.join(' | ')));
		
		if(deletable){
			let deleteSpan = document.createElement('span');
			deleteSpan.className = 'delete';
			deleteSpan.appendChild(document.createTextNode('x'));
			description.appendChild(deleteSpan);
			
			deleteSpan.addEventListener('click', removeCallback.bind(null, this), {'once': true});
		}
		description.appendChild(this.wepDom);
		description.appendChild(equipSpan);
			
		line.appendChild(title);
		for(let stat of stats){
			line.appendChild(stat);
		}
		
		line.appendChild(description);
		this.dom = $(line);
		
	};
	truncate(yes){
		let weapons = [];
		this.mech.hardpoint.forEach(function(w, i){
			if(yes && i > 0) { weapons.push('..'); return;}
			weapons.push(loc(`portal_mech_weapon_${w}`));
		});
		
		this.wepDom.textContent = weapons.join(' | ');
	};
	calc(){
		this.factors.tf.val = doTheTerrainFactorThing(this.mech);
		this.factors.wf.val = (this.mech.size != 'collector')? doTheWeaponFactorThing(this.mech) : 0;
		this.factors.ff.val = (this.mech.size != 'collector')? this.factors.tf.val * this.factors.wf.val : this.factors.tf.val;
		this.factors.rr.val = mechRating(this.mech, false);
		this.factors.ar.val = adjustRawRating(this.mech, this.factors.rr.val);
		
		this.factors.applyValues();
		
		// if(this.mech.infernal)
			// this.dom.toggleClass('infernal', global.blood['prepared'] == 3);
		
	};
}