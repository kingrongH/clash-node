/**
 * Control proxy when clash running
 * File: controller.ts
 * Author: Kingrong
 * Date: 2019-05-04
 * Copyright: @kingrong All right reserved
 */

import * as http from 'http';
import { config as globalConfig } from './config';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { fromYaml,toYaml } from './decode';

/**
 * select proxy while clash is running
 * @param { string } name of the proxy you wanna select
 * @return Promise
 */
export function proxySelect(name:string):Promise<void>{
	//if not define "external-controller" in globalConfig, use default value in source file
	let exCon = 'http://127.0.0.1:9090';
	let payload = {
		name:name
	};
	if(globalConfig['external-controller']){
		exCon =`http://${globalConfig['external-controller']}` ;
	}
	return new Promise((resolve, reject)=>{
		let req = http.request(exCon,{
			path:'/proxies/Proxy',
			method:'PUT'
		},(res)=>{
			if(res.statusCode==204){
				resolve();
			}else if(res.statusCode==400){
				reject('Info: failed, no that proxy, check!');
			}
		});
		req.write(JSON.stringify(payload));
		req.on("error", (e)=>{
			reject(new Error(`Error: ${e.message}`));
		});
		req.end();
	});
}

/** 
 * @return Promise string pid of clash process
 */
export function getClashPid():Promise<string>{

	return new Promise((resolve,reject)=>{
		let ps = spawn('ps',['-e']); 

		let grep = spawn('grep',['clash']);
		let grepString:string = '';
		
		ps.on('error',(err)=>{
			reject(new Error(`can't start child process ps: ${err.message}`))
		})
		ps.stdout.on('data', (chunk)=>{
			grep.stdin.write(chunk);
		});
		ps.stderr.on('data', (chunk)=>{
			reject(chunk);
		});
		ps.on('close',(code)=>{
			if(code !== 0){
				reject(new Error(`ps exit with code ${code}`));
			}
			//stop write to grep stdin stream
			grep.stdin.end();
		});

		grep.on('error',(err)=>{
			reject(new Error(`can't start child process grep: ${err.message}`))
		})
		grep.stdout.on('data',(chunk)=>{
			grepString = grepString + chunk;
		});
		grep.stderr.on('data', (chunk)=>{
			reject(chunk);
		});
		grep.on('close',(code)=>{
			if(code !== code){
				reject(new Error('grep exit with code ${code}'));
			}
			//grepString can be empty
			if(/([0-9]+).+/.test(grepString)){
				resolve((/([0-9]+).+/.exec(grepString) as RegExpExecArray)[1])
			}else{
				resolve('');
			}
		});

	});
}

/**
 * send SIGTERM to the process, especially used to kill clash
 */
export function killProcess(pid:string){
	let kill = spawn('kill',['-15',pid]);
	kill.stderr.on('data',(chunk)=>{
		console.log(`kill error: ${chunk}`);
	});
	kill.on('close',(code)=>{
		if(code !== 0){
			console.log(`kill exit with code: ${code}`);
		}
	});
}

export async function runClash(){
	console.log('starting clash');
	// gengerate config from the template for clash first
	await generateClashConfig();
	let log = fs.openSync(__dirname+'/../logs/clashLog.log','w');
	let clash = spawn(__dirname+'/../source/clash-linux-amd64',['-d',globalConfig.clashConfigPath],{
		stdio:['ignore',log,log],
		detached:true
	});
	clash.unref();
	// if there is default proxy set, change to that
	// TODO: This totally need redesign
	// For now use setTimeout to reach the goal of have default proxy
	if(globalConfig.defaultProxy){
		setTimeout(()=>{proxySelect(globalConfig.defaultProxy)},300) ;
	}
	console.log(`clash started at dir ${globalConfig.clashConfigPath}`);
	console.log(`see the log ${globalConfig.clashConfigPath}`);
}

export async function killClash(){
	while(await getClashPid() != ''){
		let pid = await getClashPid();
		killProcess(pid);
	}
	console.log('all clash process were killed');
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
