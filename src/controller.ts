/**
 * Control proxy when clash running
 * File: controller.ts
 * Author: Kingrong
 * Date: 2019-05-04
 * Copyright: @kingrong All right reserved
 */

import * as http from 'http';
import { config as globalConfig } from 'config';

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
