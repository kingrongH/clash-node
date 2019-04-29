/**
 * All the decode stuff here
 * File: decode.ts
 * Author: kingrong
 * Date: 2019-04-26
 * Copyright: @kingrong All right reserved
 */
import * as yaml from 'js-yaml';

export interface clashConfig {
	[index:string]:string|number|boolean;
	name:string;
	type:string;
	server:string;
	port:number;
	uuid:string;
	alterId:number;
	cipher:string;
	tls:boolean;
	"skip-cert-verify":boolean
}

export function b64Decode(s: string){
	//delete the empty char
	s.replace(/\s+/g, '');
	let b = Buffer.from(s,'base64');
	return b.toString('utf8');
}
/**
 * yaml load and dump
 */
export function toYaml(obj: object){
	return yaml.safeDump(obj);
}
export function fromYaml(str: string){
	return yaml.safeLoad(str);
}

/**
 * for link decode
 */
export function linkDecode(s: string){
	//judge if supported link
	if(s.startsWith("vmess://")){
		return b64Decode(s.substring(8));
	}else if(s.startsWith("ssr://")){
		return b64Decode(s.substring(6));
	}else if(s.startsWith("ss://")){
		return b64Decode(s.substring(5));
	}else{
		throw Error('linkDecode: An illegal link!');
	}
}

/** 
 * subdata decode 
 * @param {string} s the data get from subscrible
 * @return [[object]] an array contains configs
 */
export function subDecode(s: string){
	let linksStr = b64Decode(s).split(/\s+/);
	let configs = [];
	for(let i=0;i<linksStr.length;i++){
		//to make sure not decoding empty string
		if(linksStr[i] !== ''){
			configs.push(JSON.parse(linkDecode(linksStr[i])));
		}
	}
	return configs;
}

interface vmessConf {
	[index:string]:string;
	v:string;
	ps: string;
	add: string;
	port: string;
	id: string;
	aid: string;
	net: string;
	type: string;
	host: string;
	path: string;
	tls: string
}

export function clashFormat(inConf: vmessConf):clashConfig{
	//a table for refer
	const table:any = {
		ps:"name",
		add:"server",
		port:"port",
		id:"uuid",
		aid:"alterId",
		security:"cipher",
		tls:"tls"
	};
	let outConf:clashConfig = {
		name:"local",
		type:"vmess",
		server:"127.0.0.1",
		port:1080,
		uuid:"",
		alterId:0,
		cipher:"auto",
		tls:false,
		"skip-cert-verify":true
	};
	for(var key in inConf){
		if(key === "tls"){
			if(inConf[key]==="tls"){
				outConf[table[key]] = true;
			}
		}else if(table[key]){
			outConf[table[key]] = inConf[key];
		}
	}
	return outConf;
}

