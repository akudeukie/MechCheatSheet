import { app, initData, saveConfig } from './app.js';

import { global, setGlobal } from '../evolve/src/vars.js';
import { statusEffect, monsters } from '../evolve/src/portal.js';
import { loc, locales, usedLoc } from '../evolve/src/locale.js';
import { timeFormat } from '../evolve/src/functions.js';

import { lerp, evolve } from './data.js';
import { truncationOptions, listSortingOptions, sortingDirectionOptions, mathVisualStyles, listGroupingOptions, pagerVisibilityOptions, infoTableVisibilityOptions } from './settings.js';
import { mechConstructor } from './mechconstructor.js';
import { mechPager } from './mechpager.js';
import { avgCalc, MAX_THREADS } from './avgspiresim.js';
import { mechbayCommonDenominator } from './mechfactors.js';

var importData;

function submitCalculatorForm(e){
	e.preventDefault();
	setTimeout( ()=>{ avgCalc.sim(mechPager.getCurrentList(), app.config.avgEdenTax && mechPager.getCurrent().key == 'mechbay') }, 0 );
}

export function importSaveString(){
	if($('#saveString').val().length > 0) {
		let saveString = $('#saveString').val();
		try{
			importData = JSON.parse(LZString.decompressFromBase64(saveString));
		}
		catch(e){
			importData = '';
		}
		if(importData){
			
			if(app.localStorage)
				localStorage.setItem(app.LS_SString, saveString);
			setGlobal(structuredClone(importData));
			
			console.log(global);
			
			let prevTerrain = $('#spireTerrain').val();
			let prevBoss = $('#spireBoss').val();
			
			let errors = 0;
	
			if(!global.portal?.mechbay) {
				inform('error', loc('mcs_error_nomechbay'));
				errors++;
			}
			if(!global.portal?.spire){
				inform('error', loc('mcs_error_nospire'));
				errors++;
				initData();
				
				global.blood.prepared = importData.blood.prepared? importData.blood.prepared : 0;
				global.blood.wrath = importData.blood.wrath? importData.blood.wrath : 0;
				global.stats.achieve.gladiator.l = importData.stats.achieve.gladiator?.l? importData.stats.achieve.gladiator.l : 0;
				global.stats.reset = importData.stats.reset? importData.stats.reset : 0;
				
				$('#spireTerrain').val(prevTerrain).text((prevTerrain)? loc(`portal_spire_type_${prevTerrain}`) : '\u{1F7AD}');
				$('#spireBoss').val(prevBoss).text((prevBoss)? loc(`portal_mech_boss_${prevBoss}`) : '\u{1F7AD}');
				selectTerrain(prevTerrain);
				selectBoss(prevBoss);
			}
			else{
				$('#spireTerrain').val(global.portal.spire.type).text(loc(`portal_spire_type_${global.portal.spire.type}`));
				$('#spireBoss').val(global.portal.spire.boss).text(loc(`portal_mech_boss_${global.portal.spire.boss}`));
				selectTerrain(global.portal.spire.type);
				selectBoss(global.portal.spire.boss);
				visual.update.terrain();
				visual.update.boss();
			}
			
			selectStatus(-1, -1);
				
			visual.update.spireCount();
			$('#scouts').val(global.portal.mechbay.scouts? global.portal.mechbay.scouts : 0);
			
			$('#prepared').val(global.blood.prepared? global.blood.prepared : 0);
			$('#wrathlvl').val(global.blood.wrath? global.blood.wrath : 0);
			$('#gladiatorlvl').val(global.stats.achieve.gladiator?.l? global.stats.achieve.gladiator.l : 0);
			$('#resets').val(global.stats.reset? global.stats.reset : 0);
			visual.update.warlord();
			visual.update.prepared();
			visual.update.hazards();
				
			saveConfig();
			mechConstructor.init();
			mechConstructor.drawBasicTable();
			setTimeout(()=>{
				mechPager.showPage(mechPager.currentPage);
				if(isSpireSetup()) {
					mechPager.update(true);
					$('#mechbaySpaceDenominator').text(mechbayCommonDenominator());
					mechConstructor.calc();
				}
			}, 0);
			
			if(errors == 0) 
				inform('success', loc('mcs_success_import'));
			
		}
		else {
			inform('error', loc('mcs_error_invalid_str'));
		}
		
		importData = null;
	}
	else {
		inform('error', loc('mcs_error_empty_str'));
	}
	visual.update.calcEdenTax();
}

export function importFloorum(floorData) {
	global.portal.spire.count = parseInt(floorData.count);
	selectTerrain(floorData.type);
	selectBoss(floorData.boss);
	global.portal.spire.status = structuredClone(floorData.status);
	selectStatus(-1, -1);
	
	visual.update.spireCount();
	visual.update.terrain();
	visual.update.boss();
	visual.update.hazards();
	
	saveConfig();
	
	mechConstructor.draw();
	mechConstructor.drawBasicTable();
	updateMechCalcs();
}

export function isSpireSetup(){
	return global && global.portal?.spire && global.portal.spire.type && global.portal.spire.boss;
}

function mechString(mech) {
	let result = `[${mech.size} | ${mech.chassis} | ${mech.hardpoint[0]} | ${mech.equip.join(' - ')}]`;
	return result;
}

function addMech(mech){
	setTimeout(()=>{
		mechPager.addMech(mech);
		if(isSpireSetup()) {
			mechPager.update(true);
		}
	}, 0);
}

function defferPageUpdate(param){
	setTimeout((e)=>{ mechPager.update(param); }, 0);
}

function updateMechCalcs(){
	if(!isSpireSetup()) {
		defferPageUpdate(false);
		return;
	}
	
	$('#mechbaySpaceDenominator').text(mechbayCommonDenominator());
	mechConstructor.calc()
	defferPageUpdate(true);
}

function updateMechTruncation(){
	defferPageUpdate(false);
}

function updateListSorting(){
	setTimeout((e)=>{ 
		mechPager.update(app.config.sortingType != 0);
		visual.update.sorting();
	}, 0);
}

function updateSortingDirection(){
	defferPageUpdate(app.config.sortingType != 0);
}

function updatePagerVisibility(){
	$('#isVisible').parent().toggleClass('faded', app.config.pagerVisibility != 0);
	let wasVisible = mechPager.isVisible;
	mechPager.isVisible = app.config.pagerVisibility == 0? true : false;
	if(mechPager.isVisible){
		if(!wasVisible){
			$('#mechLists').show();
			setTimeout(()=>{
				mechPager.showPage(mechPager.currentPage);
				if(isSpireSetup()) {
					mechPager.update(true);
					mechConstructor.calc();
				}
			}, 0);
		}
	}
	else {
		$('#mechLists').hide();
		setTimeout(mechPager.hide, 0);
	}
}

function populateMenus(){
	let terrainSelector = $('#spireTerrain');
	let terrainTypes = evolve.spire.terrain.slice();
	
	let terrainDropdown = $(terrainSelector.next('.dropdownContent').get(0));
	let terrainHtml = '';
	terrainTypes.sort(locTerrainSort).forEach(function(type){
		terrainHtml += `<a data-val="${type}">${loc(`portal_spire_type_${type}`)}</a>`;
	});
	terrainDropdown.append($(terrainHtml).on('click', pickTerrain));
	
	let effects = evolve.spire.hazards.slice();
	effects.sort(locHazardSort);
	
	$('.statusButton').next('.dropdownContent').each((i, el)=>{
		let statusHtml = '<a data-val="" class="negative">\u{1F7AD}</a>';
		effects.forEach((status)=>{
			statusHtml += `<a data-val="${status}">${loc(`portal_spire_status_${status}`)}</a>`;
		});
			
		$(el).append($(statusHtml).on('click', {index: i}, pickStatus));
	});
	
	let bossDropdown = $('#bossList');
	let bossHtml = '';
	Object.keys(monsters).sort(locBossSort).forEach(function(m){
		bossHtml += `<a data-val="${m}">${loc(`portal_mech_boss_${m}`)}</a>`;
	});
	bossDropdown.append($(bossHtml).on('click', pickBoss))
	
	// Fill out options
	let oHtml = '';
	
	let truncateButton = $('#truncateSelector');
	let truncateDropdown = $(truncateButton.next('.dropdownContent').get(0));
	truncationOptions.forEach(function(opt, i){
		oHtml += `<a data-val="${i}">${loc(opt.full)}</a>`;
		if(app.config.truncateWeapons == opt.val){
			truncateButton.text(loc(opt.short));
		};
	});
	truncateDropdown.append($(oHtml).on(
		'click',
		{
			optionList: truncationOptions,
			optionSelector: '#truncateSelector',
			optionConfig: 'truncateWeapons',
			action: updateMechTruncation
		}, 
		pickPagerOption
	));
	
	oHtml = '';
	let listSortingButton = $('#sortingSelector');
	let listSortingDropdown = $(listSortingButton.next('.dropdownContent').get(0));
	listSortingOptions.forEach(function(opt, i){
		oHtml += `<a data-val="${i}">${loc(opt.full)}</a>`
		if(app.config.sortingType == opt.val){
			listSortingButton.text(loc(opt.short));
		};
	});
	listSortingDropdown.append($(oHtml).on(
		'click', 
		{
			optionList: listSortingOptions,
			optionSelector: '#sortingSelector',
			optionConfig: 'sortingType',
			action: updateListSorting
		}, 
		pickPagerOption
	));
	
	let sortDirectionButton = $('#sortingDirection').on('click', (e)=>{
		let dir = (app.config.sortingDirection > 0)? 0 : 1;
		e.currentTarget.dataset['val'] = dir;
		e.data = {
				optionList: sortingDirectionOptions,
				optionSelector: '#sortingDirection',
				optionConfig: 'sortingDirection',
				action: updateSortingDirection
			};
		pickPagerOption(e);
	});
	sortDirectionButton.text(sortingDirectionOptions[(app.config.sortingDirection > 0)? 1 : 0].short);
	
	oHtml = '';
	let listGroupingButton = $('#groupingSelector');
	let listGroupingDropdown = $(listGroupingButton.next('.dropdownContent').get(0));
	listGroupingOptions.forEach(function(opt, i){
		oHtml += `<a data-val="${i}">${loc(opt.full)}</a>`;
		if(app.config.groupingType == opt.val){
			listGroupingButton.text(loc(opt.short));
		};
	});
	listGroupingDropdown.append($(oHtml).on(
		'click', 
		{
			optionList: listGroupingOptions,
			optionSelector: '#groupingSelector',
			optionConfig: 'groupingType',
			action: updateListSorting
		}, 
		pickPagerOption
	));
	
	let visualStyleButton = $('#visStyleSwitch').on(
		'click', 
		{
			optionList: mathVisualStyles,
			optionSelector: '#visStyleSwitch',
			optionConfig: 'mathVisStyle',
			action: visual.update.mathStyle
		},
		switchPagerOption
	);
	visualStyleButton.html(mathVisualStyles[app.config.mathVisStyle].short);
	
	let isVisibleButton = $('#isVisible').on(
		'click', 
		{
			optionList: pagerVisibilityOptions,
			optionSelector: '#isVisible',
			optionConfig: 'pagerVisibility',
			action: updatePagerVisibility
		},
		switchPagerOption
	);
	isVisibleButton.html(pagerVisibilityOptions[app.config.pagerVisibility].short);
	
	$('#totalEffectHeader').attr('data-val', 1).on(
		'click', 
		{
			optionList: listSortingOptions,
			optionSelector: '#sortingSelector',
			optionConfig: 'sortingType',
			action: updateListSorting
		}, 
		pickPagerOption
	);
	$('#finalRatingHeader').attr('data-val', 2).on(
		'click', 
		{
			optionList: listSortingOptions,
			optionSelector: '#sortingSelector',
			optionConfig: 'sortingType',
			action: updateListSorting
		}, 
		pickPagerOption
	);
	
	
	let localeDropdown = $($('#localeButton').next('.dropdownContent').get(0));
	let localeHtml = '';
	Object.keys(locales).forEach(function(locale){
		localeHtml += `<a data-val="${locale}"${(locale == app.config.locale)? ' class="current"' : ''}>${locales[locale]}</a>`;
	});
	localeDropdown.append($(localeHtml).on('click', pickLocale));
	
	$('#mechbaySpaceDenominator').text(mechbayCommonDenominator());
	
	$('#avgStart, #avgLength, #avgRepeats, #avgThreads').each((i, el)=>{
		$(el).val(app.config[el.dataset.field]);
	});
	
	$('#avgPrecise, #avgEdenTax').each((i, el)=>{
		$(el).prop('checked', app.config[el.dataset.field]);
	});
	
	visual.update.sorting();
	visual.update.prepared();
	visual.update.calcVisibility();
	visual.update.infoTableVisibility();
}

export function highlightHazards(e){
	if(!e || e.data?.not){
		$('.statusButton').each((i, stel)=>{
			$(stel).parent().toggleClass("highlight", false).toggleClass("dangerlight", false);
		});
		
		return;
	}
	
	$('.statusButton').each((i, stel)=>{
		let hazard = $(stel).val();
		if(e.data['equip'] && mechConstructor.statusTable[hazard]?.equip[e.currentTarget.dataset['val']]){
			$(stel).parent().toggleClass("highlight", true);
		}
		else if(e.data['chassis'] && mechConstructor.statusTable[hazard]?.chassis[e.currentTarget.dataset['val']]){
			if(mechConstructor.statusTable[hazard].chassis[e.currentTarget.dataset['val']] < 0)
				$(stel).parent().toggleClass("highlight", true);
			else
				$(stel).parent().toggleClass("dangerlight", true);
		}
		else if(e.data['size'] && mechConstructor.statusTable[hazard]?.size[e.currentTarget.dataset['val']]){
			if(mechConstructor.statusTable[hazard].size[e.currentTarget.dataset['val']] > 0)
				$(stel).parent().toggleClass("dangerlight", true);
		}
		else{
			$(stel).parent().toggleClass("highlight", false).toggleClass("dangerlight", false);
		}
	});
}

export function highlightTarget(e){
	if(!e || e.data?.not || !e.data.target){
		$('.hightarget').toggleClass("hightarget", false);
		return;
	}
	$(e.data.target).parent().toggleClass("hightarget", true);
}

function selectTerrain(terrain){
	global.portal.spire.type = terrain;
	
	let terrainDropdown = $($('#spireTerrain').next('.dropdownContent').get(0));
	terrainDropdown.children('.current').removeClass('current');
	terrainDropdown.find(`[data-val="${terrain}"]`).addClass('current');
}

function selectBoss(boss){
	global.portal.spire.boss = boss;
	
	let bossDropdown = $('#bossList');
	bossDropdown.children('.current').removeClass('current');
	bossDropdown.find(`[data-val="${boss}"]`).addClass('current');
}

function selectStatus(i, status){
	let searchQ = [];
	if(global.portal.spire?.status) {
		Object.keys(global.portal.spire.status).forEach(function(effect){
			searchQ.push(`[data-val="${effect}"]`);
		});
	}
	
	$('.statusButton').each((i, stel)=>{
		let statusDropdown = $($(stel).next('.dropdownContent').get(0));
		statusDropdown.children('.current').removeClass("current");
		if(searchQ.length > 0) statusDropdown.find(searchQ.join(",")).addClass('current');
	});
}

function pickTerrain(e){
	selectTerrain(e.currentTarget.dataset.val);
	visual.update.terrain();
	mechConstructor.draw();
	mechConstructor.drawBasicTable();
	updateMechCalcs();
}

function pickBoss(e){
	selectBoss(e.currentTarget.dataset.val);
	visual.update.boss();
	mechConstructor.draw();
	mechConstructor.drawBasicTable();
	updateMechCalcs();
}

function pickStatus(e){
	let status = e.currentTarget.dataset.val
	if(status && global.portal.spire?.status && global.portal.spire.status[status] == true){
		inform('info', loc('mcs_info_hazard_present'));
		return;
	}
	
	let targetStatusObj = $($('.statusButton').get(e.data.index));
	
	if(status){
		targetStatusObj.parent().toggleClass('inactive', false);
		targetStatusObj.text(loc(`portal_spire_status_${status}`));
	}
	else{
		targetStatusObj.parent().toggleClass('inactive', true);
		targetStatusObj.text('\u{1F7AD}');
	}
	
	if(global.portal.spire?.status){
		delete global.portal.spire.status[targetStatusObj.val()];
		if(status) global.portal.spire.status[status] = true;
	}
	
	selectStatus(-1, status);
	targetStatusObj.val(status);
	mechConstructor.draw();
	mechConstructor.drawBasicTable();
	updateMechCalcs();
}

function pickLocale(e){
	if(!e.currentTarget.dataset.val || !locales[e.currentTarget.dataset.val]) return;
	
	app.config.locale = e.currentTarget.dataset.val;
	global.settings.locale = e.currentTarget.dataset.val;
	//$('#localeButton').text(e.data.locale);
	saveConfig();
	window.location.reload();
}

/*** 
Pager options data:
	e.data.index
	e.data.optionList
	e.data.optionSelector
	e.data.optionConfig
	e.data.action
*/
function pickPagerOption(e){
	let newVal = e.data.optionList[e.currentTarget.dataset.val].val;
	
	if(newVal != app.config[e.data.optionConfig]){
		$(e.data.optionSelector).text(loc(e.data.optionList[e.currentTarget.dataset.val].short)).val(newVal);
		app.config[e.data.optionConfig] = newVal;
		saveConfig();
		
		if(e.data.action)
			e.data.action();
	}
}

function switchPagerOption(e){
	let newOption = (app.config[e.data.optionConfig] + 1) % e.data.optionList.length;
	
	$(e.data.optionSelector).html(e.data.optionList[newOption].short).val(newOption);
	app.config[e.data.optionConfig] = newOption;
	saveConfig();
	
	if(e.data.action)
		e.data.action();
}

function locSort(a, b){
	let ast = loc(`${this}${a}`);
	let bst = loc(`${this}${b}`);
	return (ast > bst)? 1 : (ast < bst)? -1 : 0;
}

const locTerrainSort = locSort.bind('portal_spire_type_');
const locBossSort = locSort.bind('portal_mech_boss_');
const locHazardSort = locSort.bind('portal_spire_status_');

export function inform(type, info, id, actions = []){
	let timeout = 1000;
	switch(type){
		case 'success':
		case 'info':
			timeout = 1500;
			timeout *= lerp(1, 2, (info.length - 15)/25);
			break;
		case 'error':
			timeout = 2000;
			break;
		default:
			//console.log(type + info);
			return;
	}
	
	if(id && $(`#${id}`).length > 0) return;
	
	let msgb = $(`<div class="${type}"${(id)? `id="${id}"` : ''}></div>`).text(info);
	$('#messageBox').append(msgb);
	setTimeout(()=>{msgb.fadeOut(500, ()=>{msgb.remove()})}, timeout);
}

function onFormInput(e){
	if(e.currentTarget?.dataset){
		let input = $(e.currentTarget).val();
		switch(e.currentTarget.dataset['field']){
			case 'avgStart':
			case 'avgLength':
			case 'avgRepeats':
				let value = parseInt(input);
				if(isNaN(value)) return;
				app.config[e.currentTarget.dataset['field']] = value;
				saveConfig();
				break;
			case 'avgThreads':
				let threads = parseInt(input);
				if(isNaN(threads)) return;
				app.config[e.currentTarget.dataset['field']] = Math.max(1, Math.min(MAX_THREADS, threads));
				saveConfig();
				break;
			case 'avgEdenTax':
			case 'preciseMedians':
				app.config[e.currentTarget.dataset['field']] = (e.currentTarget.checked)? true : false;
				saveConfig();
				break;
		}
	}
}

function bindLocaleStrings(){
	$('[data-locale-string]').each((i, el)=>{
		if(el.dataset.localeString)
			$(el).text( getLocaleString(el.dataset.localeString) );
	});
	$('[data-locale-title]').each((i, el)=>{
		if(el.dataset.localeTitle)
			$(el).attr( 'title', getLocaleString(el.dataset.localeTitle) );
	});
}

function getLocaleString(binding){
	if(binding.indexOf(',') !== -1){
		let strings = binding.split(',');
		switch(strings[0]){
			case 'i':
				return loc(strings[1]).toLowerCase();
				break;
			default:
				return loc(strings[0], strings.slice(1).map((s)=>loc(s)));
		}
	}
	else{
		switch(binding){
			case 'portal_spire_type':
			case 'portal_spire_hazard':
				let locString = loc(binding);
				locString = locString.split(/[:：]+/)[0];
				locString = locString.split("：")[0];
				return locString;
				break;
			case 'portal_mech_size_small':
				if(app.config.locale != 'en-US')
					return loc(binding) + ' #';
				else
					return loc(binding) + 's';
				break;
			default:
				return loc(binding);
		}
	}
}

function initDropdowns(){
	$('.dropdownButton').on('click', (e)=>{
		let thisContent = $(e.currentTarget).next('.dropdownContent').get(0);
		$('.dropdownContent').each((i, el)=>{
			if(el != thisContent) $(el).toggleClass('show', false);
		});
		
		$(thisContent).toggleClass('right', false).toggleClass('show');
		let rect = thisContent.getBoundingClientRect();
		let dx = (rect.x + rect.width - document.body.getBoundingClientRect().width);
		$(thisContent).toggleClass('right', dx > 0);
	});
	$('.dropdownContent.popbox').on('click', (e)=>{
		e.stopPropagation();
	});
	$(window).on('click', (e)=>{
		if(!e.target.matches('.dropdownButton')){
			$('.dropdownContent').toggleClass('show', false);
			app.dispatchEvent(app.EV_CLOSE_DROPDOWNS);
		}
	});
}

function initEvents() {
	$('#parseSaveString').on('click', (e)=>{
		importSaveString();
	});
	$('#saveString').on('keyup', (e)=>{
		if(e.which == 13)
			importSaveString();
	});
	$('#spireCount').on('input', (e)=>{
		if(!global || !global.portal?.spire) return;
		
		global.portal.spire.count = parseInt($('#spireCount').val());
		saveConfig();
		mechConstructor.draw();
		mechConstructor.drawBasicTable();
		updateMechCalcs();
	});
	$('#scouts').on('input', (e)=>{
		if(!global || !global.portal?.mechbay) return;
		
		global.portal.mechbay.scouts = parseInt($('#scouts').val());
		saveConfig();
		updateMechCalcs();
	});
	$('#resets').on('input', (e)=>{
		if(!global || !global.portal?.mechbay) return;
		
		global.stats.reset = parseInt($('#resets').val());
		saveConfig();
		mechConstructor.draw();
		mechConstructor.drawBasicTable();
		updateMechCalcs();
	});
	$('#wrathlvl').on('input', (e)=>{
		if(!global || !global.blood) return;
		
		global.blood.wrath = parseInt($('#wrathlvl').val());
		saveConfig();
		updateMechCalcs();
	});
	$('#gladiatorlvl').on('input', (e)=>{
		if(!global || !global.stats.achieve.gladiator) return;
		
		global.stats.achieve.gladiator.l = parseInt($('#gladiatorlvl').val());
		saveConfig();
		updateMechCalcs();
	});
	$('#prepared').on('input', (e)=>{
		if(!global || !global.blood) return;
		
		global.blood.prepared = parseInt($('#prepared').val());
		visual.update.prepared()
		mechConstructor.setPrepared(global.blood.prepared);
		saveConfig();
		updateMechCalcs();
	});
	$('#warlord').on('click', (e)=>{
		if(!global || !global.race) return;
		
		global.race['warlord'] = !global.race['warlord'];
		mechConstructor.setWarlord(global.race['warlord']);
		visual.update.warlord();
		saveConfig();
		mechConstructor.drawBasicTable();
		updateMechCalcs();
	});
	$('#openCalculator').on('click', (e)=>{
		let isActive = $('#openCalculator').hasClass('action');
		app.config['calculatorVisibility'] = !isActive;
		visual.update.calcVisibility();
		saveConfig();
	});
	$('#showInfoTable').on('click', (e)=>{
		app.config['showInfoTable'] = !app.config['showInfoTable'];
		visual.update.infoTableVisibility();
		saveConfig();
	});
	
	
	$('#avgStart, #avgLength, #avgRepeats, #avgThreads').on('input', onFormInput);
	$('#avgPrecise, #avgEdenTax').on('change', onFormInput);
	$('#avgSimForm').on('submit', submitCalculatorForm);
	
	mechConstructor.callbacks.saveMech = addMech;
	
	goTopButton = $('#goToTop').on('click', (e)=>{
		window.scroll({top: 0, behavior: 'instant'});
		//console.log(usedLoc);
	});
	//goTopButton.hide();
	//goTopThreshold = 10 * parseFloat(getComputedStyle(document.documentElement).fontSize);
	$(window).on('scroll', (e)=>{
		if (document.body.scrollTop < goTopThreshold && document.documentElement.scrollTop < goTopThreshold)
			goTopButton.hide();
		else
			goTopButton.show();
	});
}

const visual = {
	update: {
		spireCount(){
			$('#spireCount').val(global.portal.spire.count);
		},
		terrain(){
			$('#spireTerrain').val(global.portal.spire.type).text(loc(`portal_spire_type_${global.portal.spire.type}`));
		},
		boss(){
			$('#spireBoss').val(global.portal.spire.boss).text(loc(`portal_mech_boss_${global.portal.spire.boss}`));
		},
		hazards(){
			let effects = [];
			Object.keys(global.portal.spire.status).forEach(function(effect){
				effects.push(effect);
			});
			
			$('.statusButton').text((i)=>{
				if(i < effects.length){
					return loc(`portal_spire_status_${effects[i]}`);
				}
				else
					return '\u{1F7AD}';
					
			});
			
			$('.statusButton').each((i, el)=>{
				if(i < effects.length){
					$(el).val(effects[i]);
					$(el).parent().toggleClass("inactive", false);
				}
				else{
					$(el).val(0);
					$(el).parent().toggleClass("inactive", true);
				}
			});
		},
		warlord(){
			$('#warlord').text(global.race['warlord']? '\u{2714}' : '\u{1F7AD}').parent().toggleClass('faded', !global.race['warlord']);
			$('#terrainTable').toggleClass('warlord', global.race['warlord'] == true);
		},
		prepared(){
			$('#mechLists').toggleClass('prepared-3', global.blood['prepared'] == 3);
		},
		sorting(){
			$('#sortingDirection').parent().toggleClass('faded', app.config.sortingType == 0 || app.config.sortingType == 4);
			$('#groupingSelector').parent().toggleClass('faded', app.config.sortingType == 0 || app.config.sortingType == 4 || app.config.groupingType == 0);
			$('#mechLists, #mechListHeader, #mechConstructor')
				.toggleClass('sortedByFactor', app.config.sortingType == 1)
				.toggleClass('sortedByRating', app.config.sortingType == 2)
				.toggleClass('isSorted', app.config.sortingType != 0 && app.config.sortingType != 4);
		},
		mathStyle(){
			$('body').children('section').attr('class', mathVisualStyles[app.config.mathVisStyle].val);
		},
		calcVisibility(){
			$('#avgCalculator').toggleClass('show', app.config.calculatorVisibility);
			$('#openCalculator').toggleClass('action', app.config.calculatorVisibility);
			$('#mechListHeader').toggleClass('shadowed', app.config.calculatorVisibility);
		},
		infoTableVisibility(){
			$('#showInfoTable').html(infoTableVisibilityOptions[(app.config.showInfoTable? 0 : 1)].short).parent().toggleClass('faded', !app.config.showInfoTable);
			$('#infoTable').toggleClass('show', app.config.showInfoTable);
		},
		calcEdenTax(){
			$('#avgEdenTaxLabel').toggle(global.eden?.mech_station?.mechs > 0);
		}
	}
}

var goTopButton;
var goTopThreshold = 160;

(()=>{
	let saveString;
	if(app.localStorage){
		saveString = localStorage.getItem(app.LS_SString);
		
	}
	if(saveString && saveString.length > 0)
		$('#saveString').val(saveString);
	
	$('#saveString').on('focus', (e)=>{ e.target.select(); });
	
	console.log(global);
	$('html').attr('lang', app.config.locale);
	$('#prepared').val(global.blood.prepared);
	$('#wrathlvl').val(global.blood.wrath);
	$('#gladiatorlvl').val(global.stats.achieve.gladiator.l);
	$('#scouts').val(global.portal.mechbay.scouts);
	$('#resets').val(global.stats.reset);
	visual.update.spireCount();
	visual.update.warlord();
	visual.update.mathStyle();
	
	mechConstructor.setSize(app.config.defaultMSize);
	mechConstructor.setType(app.config.defaultMType);
	mechConstructor.setWarlord(global.race['warlord']);
	updatePagerVisibility();
	setTimeout(populateMenus, 0);
	setTimeout(mechConstructor.init, 0);;
	setTimeout(()=>{ mechPager.init(); visual.update.calcEdenTax(); }, 0);
	setTimeout(avgCalc.init, 0);
	initDropdowns();
	bindLocaleStrings();
	initEvents();
	
	if(!app.localStorage)
		inform('error', loc('mcs_error_lstorage'));
	
})();
