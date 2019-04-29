import * as fs from 'fs';
import * as path from 'path';
import {toYaml, fromYaml} from './decode';
import { config as globalConfig } from './config';

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

/**
 * generate config for clash:
 * 1. read startdard config from template
 * 2. clash config's Proxy include our subscrible proxies
 * 3. clash config's Proxy Group include our subscrible proxies name
 * 4. other configs from global config 
 */
export async function generateClashConfig():Promise<void>{
	let clashConfigStr = fs.readFileSync(__dirname + '/../source/config.yml',{encoding:'utf8'});
	let clashConfig= fromYaml(clashConfigStr);
	let proxyFiles = fs.readdirSync(globalConfig.proxiesPath);
	//if there is many proxy files this could resolve many times
	let proxyFilePromises:Promise<string>[] = []; 
	for(let file of proxyFiles){
		proxyFilePromises.push(new Promise((resolve, reject)=>{
		fs.readFile(`${globalConfig.proxiesPath}/${file}`, {encoding:'utf8'}, (err,data)=>{
				if(err){
					reject(new Error(`Generating file err: ${err.message}`));
				}else{
					resolve(data);
				}
			});
		}));
	}
	//对于clashConfig中在有的且全局配置里面也有的，需要将全局配置里的值赋给clashConfig中
	for(let item in globalConfig){
		if(clashConfig.hasOwnProperty(item)){
			clashConfig[item] = globalConfig[item];
		}
	}
	// use Promise.all() resolve all the data together
	await Promise.all(proxyFilePromises).then((allData)=>{
		for(let data of allData){
			let proxies = fromYaml(data);
			//if Proxy is initially null else concat proxies
			if(!clashConfig.Proxy){
				clashConfig.Proxy = proxies;
			}else{
				clashConfig.Proxy = clashConfig.Proxy.concat(proxies);
			}
			// add each proxy's  name to every group 
			for(let x of clashConfig['Proxy Group']){
				for(let y of proxies){
					x.proxies.push(y.name);
				}
			}
		}
	});
	let targetStr = toYaml(clashConfig);
	fs.writeFileSync(globalConfig.clashConfigPath + '/config.yml', targetStr);
}
