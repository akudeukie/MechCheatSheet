import { app, saveConfig, numFormat } from './app.js';

import { global } from '../evolve/src/vars.js';
import { validWeapons, validEquipment, terrainEffect, checkBossResist, mechRating, monsters, statusEffect } from '../evolve/src/portal.js';
import { loc } from '../evolve/src/locale.js';

import { evolve } from './data.js';
import { highlightHazards, highlightTarget } from './mechcheatsheet.js';
import { mechPager } from './mechpager.js';
import { doTheTerrainFactorThing, doTheWeaponFactorThing, doTheFullRatingThing } from './mechfactors.js';

export const mechConstructor = {
	mech: {
		size: 'small',
		hardpoint: ['laser'],
		chassis: 'tread',
		equip: [],
		infernal: false
	},
	
	dummy: {
		size: 'small',
		hardpoint: ['laser'],
		chassis: 'tread',
		equip: [],
		infernal: false
	},
	
	config: {
		initialized: false,
		warlord: false,
		wrath: 0,
		prepared: 0
	},
	
	callbacks: {
		saveMech: null
	},
	
	statusTable: {},
	
	init(){
		mechConstructor.config['warlord'] = global.race['warlord'] || false;
		mechConstructor.config['prepared'] = global.blood['prepared'] || false;
		mechConstructor.config['wrath'] = global.blood['wrath'] || 0;
		
		if(!mechConstructor.config['initialized']) {
			$('#cMechInfernal').on('click', (e)=>{ mechConstructor.setInfernal(!mechConstructor.mech.infernal); });
			$('#cMechAdd').on('click', (e)=>{ mechConstructor.save(); });
			mechConstructor.statusTable = buildStatusEquipDeltaTable();
			//console.log(mechConstructor.statusTable);
			$('#cMechChassis').on('mouseenter', {'chassis': true}, highlightHazards).on('mouseleave', {'not': true}, highlightHazards);
			$($('#cMechChassis').next('.dropdownContent').get(0))
				.on('mouseenter', {'target': '#spireTerrain'}, highlightTarget).on('mouseleave', {'not': true}, highlightTarget);
			$('.cMechWeapon').each((i, el)=>{
				$($(el).next('.dropdownContent').get(0)).on('mouseenter', {'target': '#spireBoss'}, highlightTarget).on('mouseleave', {'not': true}, highlightTarget)
					.on('click',  (e)=>{
						if(e.target?.dataset?.val){
							mechConstructor.setWeapon(e.target.dataset.val, i); mechConstructor.calc();
						}
					})
			});
			
			$('.cMechEquip').each((i, el)=>{
				$($(el).next('.dropdownContent').get(0))
					.on('click',  (e)=>{
						if(e.target?.dataset?.val){
							mechConstructor.setEquip(e.target.dataset.val, i);
							if(e.target?.dataset?.delta)
								el.dataset.delta = e.target.dataset.delta;
							else
								delete el.dataset.delta;
							mechConstructor.calc();
						}
					});
			}).on('mouseenter', {'equip': true}, highlightHazards).on('mouseleave', {'not': true}, highlightHazards);
			
		}
		
		mechConstructor.config['initialized'] = true;
		mechConstructor.draw();
		
	},
	
	draw(){
		if(!mechConstructor.config.initialized) return;
		
		$('#cMechInfernal').text((mechConstructor.mech.infernal)? '\u{2714}' : '\u{1F7AD}').parent().toggleClass('faded', !mechConstructor.mech.infernal);
		
		let oHtml = '';
		let sizeButton = $('#cMechSize');
		let sizeSelector = $(sizeButton.next('.dropdownContent').get(0)).empty();
		let sizeTypes = mechConstructor.config['warlord'] ? evolve.mech.size.warlord : evolve.mech.size.standard;
		sizeTypes.forEach(function(val, i){
			let effectDelta = 0;
			if(global.portal?.spire?.status){
				Object.keys(global.portal.spire.status).forEach(function(effect){
					if(mechConstructor.statusTable[effect]['size'][val]){
						effectDelta += mechConstructor.statusTable[effect]['size'][val];
					}
				});
			}
			let deltaStr = (effectDelta > 0)? `<span style="pointer-events: none;" class="${chassisRatingClasses[Math.floor((1 - Math.min(effectDelta, 1.0)) * (chassisRatingClasses.length-1))]}"> -${Math.round(effectDelta * 100)}%</span>` : '';
			oHtml += `<a data-val="${val}"${(effectDelta > 0) ? ` data-delta="${effectDelta}"` : ''}>${loc(`portal_mech_size_${val}`)}${deltaStr}</a>`;
		});
		sizeSelector.append($(oHtml).on('click',  (e)=>{
			mechConstructor.setSize(e.currentTarget.dataset.val);
			mechConstructor.draw();
			app.config.defaultMSize = mechConstructor.mech.size;
			saveConfig();
		}));
		sizeSelector.children('a[data-delta]').on('mouseenter', {'size': true}, highlightHazards).on('mouseleave', {'not': true}, highlightHazards);
		
		if(!sizeTypes.includes(mechConstructor.mech.size)){
			mechConstructor.setSize(sizeTypes[0]);
		}
			
		let selectedSize = mechConstructor.mech.size;
		if(sizeTypes.includes(sizeButton.val())){
			selectedSize = sizeButton.val();
			mechConstructor.mech.size = selectedSize;
		}
		sizeButton.val(selectedSize).text(loc(`portal_mech_size_${selectedSize}`));
		
		let typeButton = $('#cMechChassis');
		let typeSelector = $(typeButton.next('.dropdownContent').get(0)).empty();
		let typeList = validChassisTypes(mechConstructor.mech);
		
		oHtml = '';
		mechConstructor.dummy.size = mechConstructor.mech.size;
		typeList.forEach(function(val, i){
			mechConstructor.dummy.chassis = val;
			let tFactor = (global.portal?.spire?.type)? terrainEffect(mechConstructor.dummy) : 0;
			let tFactorString = (global.portal?.spire?.type)? `<span class="${chassisRatingClasses[Math.floor(Math.min(tFactor, 1.0) * (chassisRatingClasses.length-1))]}">[${(tFactor * 100).toFixed(0)}%]</span>` : '';
			let effectDelta = 0;
			if(global.portal?.spire?.status){
				Object.keys(global.portal.spire.status).forEach(function(effect){
					if(mechConstructor.statusTable[effect]['chassis'][val]){
						effectDelta += mechConstructor.statusTable[effect]['chassis'][val];
					}
				});
			}
			oHtml += `<a data-val="${val}" ${(effectDelta != 0)? `data-delta="${effectDelta}" class="${(effectDelta > 0)? 'notreally ' : ''}recommended strength-1"` : ''}"><span>${loc(`portal_mech_chassis_${val}`)}</span> ${tFactorString}</a>`;
		});
		typeSelector.append($(oHtml).on('click',  (e)=>{ 
			mechConstructor.setType(e.currentTarget.dataset.val); 
			mechConstructor.draw(); 
			app.config.defaultMType = mechConstructor.mech.chassis;
			saveConfig();
			highlightHazards(); 
			highlightTarget(); 
		}));
		typeSelector.children('a[data-delta]').on('mouseenter', {'chassis': true}, highlightHazards).on('mouseleave', {'not': true}, highlightHazards);
		
		if(!typeList.includes(mechConstructor.mech.chassis))
			mechConstructor.setType(typeList[0]);
		else
			mechConstructor.setType(mechConstructor.mech.chassis);
			
			
		let selectedType = mechConstructor.mech.chassis;
		if(typeList.includes(typeButton.val())){
			selectedType = typeButton.val();
			mechConstructor.mech.chassis = selectedType;
		}
		typeButton.val(selectedType).text(loc(`portal_mech_chassis_${selectedType}`));
		
		$('.cMechWeapon').each((i, el)=>{
			let $el = $(el);
			let weapons = validWeapons(mechConstructor.mech.size, mechConstructor.mech.chassis, i);
			
			// Vanilla
			let container = $el.next('.dropdownContent').get(0);
			container.replaceChildren();
			weapons.forEach(function(val){				
				let wepLine = document.createElement('a');
				wepLine.dataset.val = val;
				let wepName = document.createElement('span');
				wepName.appendChild(document.createTextNode(loc(`portal_mech_weapon_${val}`)));
				wepName.style.pointerEvents = "none";
				wepLine.appendChild(wepName);
				if(global.portal?.spire?.boss){
					let bBaseFactor = monsters[global.portal.spire.boss].weapon[val];
					let bFactor = checkBossResist(global.portal.spire.boss, val);
					let bFactorSpan = document.createElement('span');
					bFactorSpan.className = weaponRatingClasses[Math.floor(Math.min(bFactor, 1.0) * (weaponRatingClasses.length-1))];
					bFactorSpan.appendChild(document.createTextNode(` [${(bFactor * 100).toFixed(0)}%]${(bFactor < bBaseFactor)? '\u{2BC6}' : (bFactor > bBaseFactor)? '\u{2BC5}' : ''}`));
					bFactorSpan.style.pointerEvents = "none";
					wepLine.appendChild(bFactorSpan);
				}
				
				container.appendChild(wepLine);
			});
			$el.parent().toggleClass('inactive', !mechConstructor.vis(i));
			
			if(mechConstructor.vis(i)){
				let visWeapon = $el.val();
				if(!weapons.includes(visWeapon))
					mechConstructor.setWeapon(weapons[0], i);
				else
					mechConstructor.setWeapon(visWeapon, i);
					
			}
		});
		
		let e_cap = mechConstructor.config['prepared'] ? 5 : 4;
		$('.cMechEquip').each((i, el)=>{
			let $el = $(el);
			let equips = validEquipment(mechConstructor.mech.size, mechConstructor.mech.chassis, i);
			
			// Vanilla
			let container = $el.next('.dropdownContent').get(0);
			$(container).children("a[data-delta]").off();
			container.replaceChildren();
			equips.forEach(function(val){
				let valS = mechConstructor.filterEquip(mechConstructor.mech.size, val);
				let recommended = false;
				let effectDelta = 0;
				if(global.portal?.spire?.status){
					Object.keys(global.portal.spire.status).forEach(function(effect){
						if(mechConstructor.statusTable[effect]['equip'][val]){
							effectDelta += mechConstructor.statusTable[effect]['equip'][val];
							recommended = true;
						}
					});
				}
						
				let equipLine = document.createElement('a');
				equipLine.dataset.val = val;
				equipLine.appendChild(document.createTextNode(loc(`portal_mech_equip_${valS}`)));
				if(recommended && effectDelta < 0){
					equipLine.dataset.delta = effectDelta;
					equipLine.className = `recommended strength-${Math.min(Math.floor(Math.abs(effectDelta)*3 + 1), 3)}`;
				}
				
				container.appendChild(equipLine);
			});
			$el.parent().toggleClass('inactive', !(mechConstructor.eqVis(i) && i < e_cap));
			$(container).children("a[data-delta]").on('mouseenter', {'equip': true}, highlightHazards).on('mouseleave', {'not': true}, highlightHazards);
			
			if(mechConstructor.eqVis(i) && i < e_cap){			
				let visEquip = $el.val();
				if(!equips.includes(visEquip)){
					mechConstructor.setEquip(equips[i], i);
				}
				else{
					let valS = mechConstructor.filterEquip(mechConstructor.mech.size, mechConstructor.mech.equip[i]);
					$el.val(mechConstructor.mech.equip[i]).text(loc(`portal_mech_equip_${valS}`));
					el.dataset.val = mechConstructor.mech.equip[i];
				}
			}
		});
		
		$('#cMechInfernal').parent().toggleClass('inactive', !(mechConstructor.config['prepared'] == 3));
				
		mechConstructor.calc();
		
	},
	
	drawBasicTable(){
		if(!mechConstructor.config.initialized) return;
		
		let chassisTable = $('#terrainTable');
		let resistTable = $('#resistanceTable');
		let equipTable = $('#equipmentTable');
		
		chassisTable.empty();
		resistTable.empty();
		equipTable.empty();
		
		// Chassis
		if(global.portal?.spire?.type){
			chassisTable.prev().text(loc(`portal_spire_type_${global.portal.spire.type}`));
		}
		chassisTable = chassisTable.get(0);
		
		let sizeTypes = global.race['warlord'] ? evolve.mech.size.warlord : [''];
		
		sizeTypes.forEach(function(size){
			mechConstructor.dummy.size = size;
			let typeList = validChassisTypes(mechConstructor.dummy);
			typeList.forEach(function(val, i){
				mechConstructor.dummy.size = global.race['warlord'] ? size : 'small';
				mechConstructor.dummy.chassis = val;
				let tFactor = (global.portal?.spire?.type)? terrainEffect(mechConstructor.dummy) : 0;
				mechConstructor.dummy.size = 'large';
				let tFactorLarge = (global.portal?.spire?.type)? terrainEffect(mechConstructor.dummy) : 0;
				
				let effectDelta = 0;
				if(global.portal?.spire?.status){
					Object.keys(global.portal.spire.status).forEach(function(effect){
						if(mechConstructor.statusTable[effect]['chassis'][val]){
							effectDelta += mechConstructor.statusTable[effect]['chassis'][val];
						}
					});
				}
				
				let chassisLine = document.createElement('a');
				chassisLine.dataset.val = val;
				let chassisName = document.createElement('span');
				chassisName.appendChild(document.createTextNode(loc(`portal_mech_chassis_${val}`)));
				chassisName.style.pointerEvents = "none";
				
				if(global.portal?.spire?.type){
					let tFactorSpan = document.createElement('span');
					tFactorSpan.className = chassisRatingClasses[Math.floor(Math.min(tFactor, 1.0) * (chassisRatingClasses.length-1))];
					tFactorSpan.style.pointerEvents = "none";
					tFactorSpan.appendChild(document.createTextNode( `[${(tFactor * 100).toFixed(0)}%] ` ));
					if(global.race['warlord']){
						chassisLine.appendChild(tFactorSpan);
					}
					else{
						let tFactorLargeSpan = document.createElement('span');
						tFactorLargeSpan.className = chassisRatingClasses[Math.floor(Math.min(tFactorLarge, 1.0) * (chassisRatingClasses.length-1))];
						tFactorLargeSpan.style.pointerEvents = "none";
						tFactorLargeSpan.appendChild(document.createTextNode( `[${(tFactorLarge * 100).toFixed(0)}%] ` ));
						
						chassisLine.appendChild(document.createTextNode( 'S' ));
						chassisLine.appendChild(tFactorSpan);
						chassisLine.appendChild(document.createTextNode( 'L' ));
						chassisLine.appendChild(tFactorLargeSpan);
					}
				}
				
				if(effectDelta != 0){
					chassisLine.dataset.delta = effectDelta;
					chassisLine.className = `${(effectDelta > 0)? 'notreally ' : ''}recommended strength-1`;
				}
				
				chassisLine.appendChild(chassisName);
				chassisTable.appendChild(chassisLine);
			});
		});
		$(chassisTable).children('a[data-delta]').on('mouseenter', {'chassis': true}, highlightHazards).on('mouseleave', {'not': true}, highlightHazards);
		
		// Weapons
		if(global.portal.spire.boss){
			resistTable.prev().text(loc(`portal_mech_boss_${global.portal.spire.boss}`));
			resistTable = resistTable.get(0);
			
			let standardWeapons = validWeapons('medium', 'tread', 0);
			for(var [key, val] of Object.entries(monsters[global.portal.spire.boss].weapon)){
				if(!global.race['warlord'] && !standardWeapons.includes(key))
					continue;
				
				let wepLine = document.createElement('a');
				wepLine.dataset.val = key;
				let wepName = document.createElement('span');
				wepName.appendChild(document.createTextNode(loc(`portal_mech_weapon_${key}`)));
				wepName.style.pointerEvents = "none";
				if(global.portal?.spire?.boss){
					let bBaseFactor = val;
					let bFactor = checkBossResist(global.portal.spire.boss, key);
					let bFactorSpan = document.createElement('span');
					bFactorSpan.className = weaponRatingClasses[Math.floor(Math.min(bFactor, 1.0) * (weaponRatingClasses.length-1))];
					bFactorSpan.appendChild(document.createTextNode(`[${(bFactor * 100).toFixed(0)}%]${(bFactor < bBaseFactor)? '\u{2BC6}' : (bFactor > bBaseFactor)? '\u{2BC5}' : ''} `));
					bFactorSpan.style.pointerEvents = "none";
					wepLine.appendChild(bFactorSpan);
				}
				wepLine.appendChild(wepName);
				
				resistTable.appendChild(wepLine);
			}
		}
		
		// Equipment
		equipTable = equipTable.get(0);
		let equips = evolve.mech.equip.standard;
		if(global.race['warlord'])
			equips = equips.concat( evolve.mech.equip.warlord );
		equips = equips.filter((eq) => ['special', 'scavenger', 'scouter'].includes(eq) == false);
		
		equips.forEach(function(val){
			let recommended = false;
			let effectDelta = 0;
			if(global.portal?.spire?.status){
				Object.keys(global.portal.spire.status).forEach(function(effect){
					if(mechConstructor.statusTable[effect]['equip'][val]){
						effectDelta += mechConstructor.statusTable[effect]['equip'][val];
						recommended = true;
					}
				});
			}
					
			let equipLine = document.createElement('a');
			equipLine.dataset.val = val;
			equipLine.appendChild(document.createTextNode(loc(`portal_mech_equip_${val}`)));
			if(recommended && effectDelta < 0){
				equipLine.dataset.delta = effectDelta;
				equipLine.className = `recommended strength-${Math.min(Math.floor(Math.abs(effectDelta)*3 + 1), 3)}`;
			}
			
			equipTable.appendChild(equipLine);
		});
		$(equipTable).children("a[data-delta]").on('mouseenter', {'equip': true}, highlightHazards).on('mouseleave', {'not': true}, highlightHazards);
	},
	
	calc(){
		if(!mechConstructor.config.initialized) return;
		
		$('#mechConstructor').find('.stat').each((i, el)=>{
			let val = 0;
			switch(i){
				case 0:
					val = (doTheTerrainFactorThing(mechConstructor.mech) * 100).toFixed(1) + '%';
					break;
				case 1:
					val = (doTheWeaponFactorThing(mechConstructor.mech)* 100).toFixed(1) + '%';
					break;
				case 2:
					val = (doTheTerrainFactorThing(mechConstructor.mech) * doTheWeaponFactorThing(mechConstructor.mech) * 100).toFixed(1) + '%';
					break;
				case 3:
					val = numFormat.format((doTheFullRatingThing(mechConstructor.mech, false, true) * 1000).toFixed(0));
					break;
			}
			$(el).children('span').text(val);
		});
	},
	
	setSize(size){
		mechConstructor.mech.size = size;
		if (size === 'collector'){
			mechConstructor.mech.hardpoint.length = 0;
		}
		else if (size === 'small' || size === 'medium' || size === 'minion' || size === 'fiend'){
			if (mechConstructor.mech.hardpoint.length === 0){
				mechConstructor.mech.hardpoint.push('laser');
			}
			mechConstructor.mech.hardpoint.length = 1;
		}
		else {
			if (mechConstructor.mech.hardpoint.length === 0){
				mechConstructor.mech.hardpoint.push('laser');
			}
			if (mechConstructor.mech.hardpoint.length === 1){
				mechConstructor.mech.hardpoint.push(mechConstructor.mech.hardpoint.includes('laser') ? 'plasma' : 'laser');
			}
			if (size === 'titan'){
				if (mechConstructor.mech.hardpoint.length === 2){
					mechConstructor.mech.hardpoint.push(mechConstructor.mech.hardpoint.includes('laser')  ? 'shotgun' : 'laser');
					mechConstructor.mech.hardpoint.push(mechConstructor.mech.hardpoint.includes('laser')  ? 'kinetic' : 'laser');
				}
			}
			else {
				mechConstructor.mech.hardpoint.length = 2;
			}
		}
		if (mechConstructor.config['warlord']){ 
			mechConstructor.mech.equip[0] = validEquipment(size,mechConstructor.mech.chassis)[0]; 
			mechConstructor.mech.equip.length = 1;
		}
		switch (size){
			case 'small':
			case 'minion':
				if (mechConstructor.config['prepared']){
					mechConstructor.mech.equip.push(validEquipment(size,mechConstructor.mech.chassis)[0]);
				}
				mechConstructor.mech.equip.length = mechConstructor.config['prepared'] ? 1 : 0;
				break;
			case 'medium':
			case 'fiend':
				if (mechConstructor.mech.equip.length < 1){
					mechConstructor.mech.equip.push(validEquipment(size,mechConstructor.mech.chassis)[0]);
				}
				if (mechConstructor.config['prepared']){
					mechConstructor.mech.equip.push(validEquipment(size,mechConstructor.mech.chassis)[1]);
				}
				mechConstructor.mech.equip.length = mechConstructor.config['prepared'] ? 2 : 1;
				break;
			case 'collector':
			case 'large':
			case 'cyberdemon':
				if (mechConstructor.mech.equip.length < 1){
					mechConstructor.mech.equip.push('special');
				}
				if (mechConstructor.mech.equip.length < 2){
					mechConstructor.mech.equip.push('shields');
				}
				if (mechConstructor.config['prepared']){
					mechConstructor.mech.equip.push('grapple');
				}
				mechConstructor.mech.equip.length = mechConstructor.config['prepared'] ? 3 : 2;
				break;
			case 'titan':
			case 'archfiend':
				if (mechConstructor.mech.equip.length < 1){
					mechConstructor.mech.equip.push(validEquipment(size,mechConstructor.mech.chassis)[0]);
				}
				if (mechConstructor.mech.equip.length < 2){
					mechConstructor.mech.equip.push(validEquipment(size,mechConstructor.mech.chassis)[1]);
				}
				if (mechConstructor.mech.equip.length < 3){
					mechConstructor.mech.equip.push(validEquipment(size,mechConstructor.mech.chassis)[2]);
				}
				if (mechConstructor.mech.equip.length < 4){
					mechConstructor.mech.equip.push(validEquipment(size,mechConstructor.mech.chassis)[3]);
				}
				if (mechConstructor.config['prepared']){
					mechConstructor.mech.equip.push(validEquipment(size,mechConstructor.mech.chassis)[4]);
				}
				mechConstructor.mech.equip.length = mechConstructor.config['prepared'] ? 5 : 4;
				break;
		}
		if (mechConstructor.config['warlord']){
			switch (size){
				case 'minion':
					mechConstructor.mech.chassis = 'imp';
					break;
				case 'fiend':
					mechConstructor.mech.chassis = 'cambion';
					break;
				case 'cyberdemon':
					mechConstructor.mech.chassis = 'biped';
					mechConstructor.mech.hardpoint[1] = validWeapons(size,mechConstructor.mech.chassis,1)[1];
					break;
				case 'archfiend':
					mechConstructor.mech.chassis = 'dragon';
					mechConstructor.mech.hardpoint[1] = validWeapons(size,mechConstructor.mech.chassis,1)[0];
					break;
			}
			mechConstructor.mech.hardpoint[0] = validWeapons(size,mechConstructor.mech.chassis,0)[0];
			//redraw
		}
		
		let sizeSelector = $('#cMechSize');
		sizeSelector.val(size).text(loc(`portal_mech_size_${size}`));
		//mechConstructor.draw();
		app.dispatchEvent(app.EV_CONSTRUCTOR);
	},
	
	setType(type){
		mechConstructor.mech.chassis = type;
		if (mechConstructor.config['warlord']){
			mechConstructor.mech.hardpoint[0] = validWeapons(mechConstructor.mech.size,type,0)[0];
			if (type === 'hydra'){
				mechConstructor.mech.hardpoint[1] = validWeapons(mechConstructor.mech.size,type,1)[0];
				mechConstructor.mech.hardpoint[2] = validWeapons(mechConstructor.mech.size,type,2)[0];
				mechConstructor.mech.hardpoint[3] = validWeapons(mechConstructor.mech.size,type,3)[0];
			}
			else if (type !== 'hydra' && mechConstructor.mech.size.size === 'archfiend'){
				mechConstructor.mech.hardpoint.length = 2;
			}
			//redraw
			//mechConstructor.draw();
		}
		
		let typeSelector = $('#cMechChassis');
		typeSelector.val(type).text(loc(`portal_mech_chassis_${type}`)).attr('data-val', type);
		app.dispatchEvent(app.EV_CONSTRUCTOR);
	},
	
	setWeapon(weapon, index){
		mechConstructor.mech.hardpoint[index] = weapon;
		
		$($('.cMechWeapon').get(index)).val(weapon).text(loc(`portal_mech_weapon_${weapon}`));
		app.dispatchEvent(app.EV_CONSTRUCTOR);
	},
	
	setEquip(equip, index){
		mechConstructor.mech.equip[index] = equip;
		
		let valS = mechConstructor.filterEquip(mechConstructor.mech.size, equip);
		$($('.cMechEquip').get(index)).val(equip).text(loc(`portal_mech_equip_${valS}`)).attr('data-val', equip);
		app.dispatchEvent(app.EV_CONSTRUCTOR);
	},
	
	vis(slot){
		if (mechConstructor.mech.size === 'collector'){
			return false;
		}
		if (slot === 0 || (['large','cyberdemon'].includes(mechConstructor.mech.size) && slot < 2) || mechConstructor.mech.size === 'titan'){
			return true;
		}
		else if (mechConstructor.mech.size === 'archfiend'){
			switch (mechConstructor.mech.chassis){
				case 'dragon':
				case 'snake':
				case 'gorgon':
					return slot < 2 ? true : false;
				case 'hydra':
					return slot < 4 ? true : false;
			}
		}
		return false;
	},
	eqVis(slot){
		let prep = mechConstructor.config['prepared'] ? 1 : 0;
		switch (mechConstructor.mech.size){
			case 'small':
			case 'minion':
				return prep === 1 && slot === 0 ? true : false;
			case 'medium':
			case 'fiend':
				return slot <= (0 + prep) ? true : false;
			case 'collector':
			case 'large':
			case 'cyberdemon':
				return slot <= (1 + prep) ? true : false;
			case 'titan':
			case 'archfiend':
				return true;
		}
	},
	filterEquip(size, equip){
		let filtered = equip;
		if (equip === 'special'){
			switch (size){
				case 'large':
				case 'cyberdemon':
					filtered = 'battery';
					break;
				case 'titan':
					filtered = 'target';
					break;
				default:
					filtered = 'jumpjet';
					break;
			}
		}
		return filtered;
	},
	
	setWarlord(val){
		mechConstructor.config['warlord'] = val;
		mechConstructor.draw();
	},
	setPrepared(val){
		mechConstructor.config['prepared'] = val;
		mechConstructor.setSize(mechConstructor.mech.size);
		mechConstructor.draw();
	},
	setInfernal(val){
		mechConstructor.mech.infernal = (val === true);
		$('#cMechInfernal').text((mechConstructor.mech.infernal)? '\u{2714}' : '\u{1F7AD}').parent().toggleClass('faded', !mechConstructor.mech.infernal);
		mechConstructor.calc();
		app.dispatchEvent(app.EV_CONSTRUCTOR);
	},
	save(){
		if(mechConstructor.callbacks.saveMech){
			mechConstructor.callbacks.saveMech(structuredClone(mechConstructor.mech));
		}
	}
		
}

function validChassisTypes(mech){
	let typeList = evolve.mech.type.standard;
	if (mechConstructor.config['warlord']){
		switch (mech.size){
			case 'minion':
				typeList = evolve.mech.type.minion;
				break;
			case 'fiend':
				typeList = evolve.mech.type.fiend;
				break;
			case 'cyberdemon':
				typeList = evolve.mech.type.cyberdemon;
				break;
			case 'archfiend':
				typeList = evolve.mech.type.archfiend;
				break;
		}
	}
	return typeList;
}

function buildStatusEquipDeltaTable(){
	
	let mechZero = {
		size: '',
		hardpoint: [],
		chassis: '',
		equip: [],
		infernal: false
	};
	let mechSz = {
		size: '',
		hardpoint: [],
		chassis: '',
		equip: [],
		infernal: false
	};
	let mechCh = {
		size: '',
		hardpoint: [],
		chassis: '',
		equip: [],
		infernal: false
	};
	let mechEq = {
		size: '',
		hardpoint: [],
		chassis: '',
		equip: [''],
		infernal: false
	};
	
	let size = evolve.mech.size.standard.concat( evolve.mech.size.warlord );
	let chassis = [...new Set([...evolve.mech.type.standard, ...evolve.mech.type.minion, ...evolve.mech.type.fiend, ...evolve.mech.type.cyberdemon, ...evolve.mech.type.archfiend])];
	let equips = evolve.mech.equip.standard.concat( evolve.mech.equip.warlord );
	
	let effects = evolve.spire.hazards.slice();
	let effectTable = {};
	effects.forEach((effect)=>{
		let effectMap = {
			'size': {},
			'chassis': {},
			'equip': {}
		};
		
		switch(effect){
			case 'gravity':
				size.forEach((sz)=>{
					mechSz.size = sz;
					let delta = statusEffect(mechZero, effect) - statusEffect(mechSz, effect);
					if(delta != 0){
						effectMap['size'][sz] = delta;
					}
				});
				//break;
			case 'windy':
			case 'hilly':
			case 'river':
			case 'tar':
			case 'flooded':
			case 'chasm':
				chassis.forEach((ch)=>{
					mechCh.chassis = ch;
					let delta = statusEffect(mechZero, effect) - statusEffect(mechCh, effect);
					if(delta != 0){
						effectMap['chassis'][ch] = delta;
					}
				});
			default:
				equips.forEach((eq)=>{
					let delta = 0;
					switch(eq){
						case 'athletic':
							mechEq.equip[0] = eq;
							mechEq.size = mechZero.size = 'medium';
							delta = statusEffect(mechZero, effect) - statusEffect(mechEq, effect);
							mechEq.size = mechZero.size = '';
							break;
						default:
							mechEq.equip[0] = eq;
							delta = statusEffect(mechZero, effect) - statusEffect(mechEq, effect);
							break;
					}
					if(delta != 0){
						effectMap['equip'][eq] = delta;
					}
				});
				break;
		}
		
		effectTable[effect] = effectMap;
	});
	
	return effectTable;
}

const weaponRatingClasses = ['error', 'error', 'error', 'error', 'error', 'warning', 'warning', 'warning', 'success', 'success'];
const chassisRatingClasses = ['error', 'error', 'error', 'error', 'error', 'warning', 'warning', 'warning', 'warning', 'success'];