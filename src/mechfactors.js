import { global } from '../evolve/src/vars.js';
import { statusEffect, terrainEffect, terrainRating, checkBossResist, weaponPower, mechRating, mechSize } from '../evolve/src/portal.js';

export function doTheTerrainFactorThing(mech){
	if(!global || !global.portal?.spire || global.portal?.spire.boss == '') return 0;
	
	let rating = 1;
	let terrainFactor = terrainEffect(mech);

	let effects = [];
	Object.keys(global.portal.spire.status).forEach(function(effect){
		effects.push(effect);
		rating *= statusEffect(mech,effect);
	});

	rating *= terrainRating(mech,terrainFactor,effects);
	
	return rating;
}

export function doTheWeaponFactorThing(mech){
	if(!global || !global.portal?.spire || global.portal?.spire.boss == '') return 0;
	
	if(mech.hardpoint.length == 0) return 0;
	let rating = 0;
	for(let i=0; i<mech.hardpoint.length; i++){
		let effect = checkBossResist(global.portal.spire.boss,mech.hardpoint[i]);
		rating += weaponPower(mech,effect);
	}
	return rating / mech.hardpoint.length;
}

export function doTheFullRatingThing(mech, boss, adjust){
	if(!global || !global.portal?.spire || global.portal?.spire.boss == '') return 0;
	
	let adjustValue = 1;
	if(adjust){
		
		// Round down to number of whole mechs in denominated space
		adjustValue = Math.floor(mechbayCommonDenominator() / mechSize(mech.size));
		
	}
	
	return mechRating(mech, boss) * global.portal.spire.count * adjustValue;
}

export function adjustRawRating(mech, rating){
	return rating * global.portal.spire.count * Math.floor(mechbayCommonDenominator() / mechSize(mech.size));
}

export function mechbayCommonDenominator(common = false){
	if(!common)
		return global.blood['prepared'] && global.blood.prepared >= 2 ? (global.race['warlord'] ? 30 : 40) : (global.race['warlord'] ? 40 : 50);
	else
		return global.blood['prepared'] && global.blood.prepared >= 2 ? 120 : 200;
}