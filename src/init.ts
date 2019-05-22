import * as fs from 'fs';
import * as path from 'path';
import {toYaml} from './decode';

export function init(){
	let configPath = path.resolve(__dirname+'/../config');
	let clashConfigPath  = path.resolve(__dirname+'/../clashConfig');
	if(!fs.existsSync(`${configPath}/config.yml`)){
		let config = {
			proxiesPath:path.resolve(__dirname+'/../proxies'),
			clashConfigPath:clashConfigPath,
			subscribles:[]
		}
		let str = toYaml(config);
		fs.writeFileSync(`${configPath}/config.yml`, str);
	}
	if(!fs.existsSync(clashConfigPath)){
		fs.mkdirSync(clashConfigPath);
	}
}
