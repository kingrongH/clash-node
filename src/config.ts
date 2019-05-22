/**
 * this file is globalConfig file
 * you should import config as globalConfig first
 */


import { fromYaml, toYaml } from './decode';
import { subscribler } from './subscrible';
import * as fs from 'fs';
import { init } from './init';
import { resolve as pathResolve } from 'path';

/**
 * I don't think this file need too much design patern
 * Just export a global config object, I think is OK
 * once you update a new item to global config, you should add one to globalConfig interface and maybe change the updateConfig function
 */
interface globalConfig{
	[index:string]:any;
	proxiesPath:string;
	clashConfigPath:string;
	subscribles:subscribler[];
}

init();
let configFilePath = pathResolve(__dirname+'/../config');
let str = fs.readFileSync(configFilePath+'/config.yml',{encoding:'utf8'});
// this config is global config, you should import it as globalConfig
export let config:globalConfig = fromYaml(str);

// update config
export function updateGlobalConfig(item:string, value:any):void{
	config[item] = value;
	// write config to the file
	let str = toYaml(config);
	try{
		fs.writeFileSync(`${configFilePath}/config.yml`, str);
	}catch(e){
		throw(Error(`updateGlobalConfig encounter an error: ${e.message}`));
	}
}

