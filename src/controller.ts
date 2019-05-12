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

/**
 * select proxy while clash is running
 * @param { string } name of the proxy you wanna select
 * @return Promise
 */
export function proxySelect(name:string):Promise<boolean>{
	//if not define "external-controller" in globalConfig, use default value in source file
	let exCon = '127.0.0.1:9090';
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
				resolve(true);
			}else if(res.statusCode==400){
				reject('Info: failed, no that proxy, check!');
			}
		});
		req.write(JSON.stringify(payload));
		req.on("error", (e)=>{
			reject(new Error(`Error: ${e.message}`));
		});
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
			resolve((/([0-9]+).+/.exec(grepString) as RegExpExecArray)[1])
		});

	});
	
}
