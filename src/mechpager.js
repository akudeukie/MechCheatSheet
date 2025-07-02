import { app, initData, saveConfig, saveLabels, saveHeap, getMechList, saveMechList, numFormat } from './app.js';

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
			mechPager.pages[i] = new MechListPage(i, pName, getMechList(i), i, true);
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
		
		let bayPage = new MechListPage('mechbay', loc('portal_mechbay_title'), global.portal.mechbay.mechs ?? [], -1, true);
		mechPager.specialPages.push(bayPage);
		pageDropdown.append($(`<a class="fullSpan"></a>`).text(bayPage.name).on('click', {i: -mechPager.specialPages.length}, (e)=>{ setTimeout(()=>{ mechPager.showPage(e.data.i); mechPager.update(true); }, 0) }));
		pageContainer.append(bayPage.dom);
		
		app.on(app.EV_CLOSE_DROPDOWNS, mechPager.disarmClearList);
		
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
	
};

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

class MechListPage extends Page {
	constructor(key, name, mechList, id, modifiable=true) {
		super();
		
		this.key = key;
		this.name = name;
		this.id = id;
		this.mechList = mechList;
		this.lines = [];
		this.dom = $(`<div id="mpage-${id}"></div>`);
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
			this.pageMeta.factors['ar'].dom.title = `Total raw unadjusted rating: ${numFormat.format(Math.round(this.pageMeta.factors['rr'].val * 1000 * global.portal.spire.count))}`;
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
		
		this.explainLine = $(hvtDescription);
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

const emptyListDud = (text) => `<div class="line smaller" ><div class="text"><span><i>&lt; ${text.replaceAll("<", "&lt;").replaceAll(">", "&gt;")} &gt;</i></span></div></div>`;
const hvtDescription = `<div class="line smaller"><div class="text" id="hvtExplain"><p><span class="titan">Titans</span> have higher raw firepower, but <span class="large">Heavy</span> mechs are more space efficient. 
							On rare occasion, when weapon effectiveness against boss is way below 100%, <span class="titan">Titan</span> mechs can get ahead with the help of <i>${loc(`portal_mech_equip_target`)}</i> equipment.
							This page is meant to illustrate that.</p><p>Loadouts are synced with the constructor.</p></div></div>`;

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
	delNode.className = `mcLn line delimiter smaller ${name}`;
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
		line.className = `mcLn line smaller meta`;
		
		let title = document.createElement('div');
		title.className = 'title';
		this.spaceDom = document.createElement('span');
		this.summaryDom = document.createElement('span');
		this.summaryDom.className = 'summary';
		this.summaryDom.setAttribute('title', 'Filter mech display');
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
		line.className = `mcLn line smaller ${this.mech.size} ${this.mech.chassis} ${(this.mech.infernal && global.blood['prepared'] == 3)? 'infernal' : ''}`;
		
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