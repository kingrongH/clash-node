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

/**
 * select proxy while clash is running
 * @param { string } name of the proxy you wanna select
 * @return Promise
 */
export function proxySelect(name:string):Promise<boolean>{
	//if not define "external-controller" in globalConfig, use default value in source file
	let exCon = 'http://127.0.0.1:9090';
	let payload = {
		name:name
	};
	if(globalConfig['external-controller']){
		exCon = globalConfig['external-controller'];
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

//return a clash child_process
export function runClash(){
	console.log('starting clash');
	let log = fs.openSync(__dirname+'/../logs/clashLog.log','w');
	let clash = spawn(__dirname+'/../source/clash-linux-amd64',['-d',globalConfig.clashConfigPath],{
		stdio:['ignore',log,log],
		detached:true
	});
	clash.unref();
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
