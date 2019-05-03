/**
 * All the decode stuff here
 * File: decode.ts
 * Author: kingrong
 * Date: 2019-04-26
 * Copyright: @kingrong All right reserved
 */
import * as yaml from 'js-yaml';

export interface vmessClashConf {
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

export interface ssClashConf {
	[index:string]:string | number;
	name:string;
	type:string;
	server:string;
	port:number;
	cipher:string;
	password:string;
}



export function b64Decode(s: string){
	//delete the empty char
	s.replace(/\s+/g, '');
	let b = Buffer.from(s,'base64');
	return b.toString('utf8');
}

//For now only support utf8
export function urlDecode(str:string){
	let bytes = [];
	for(let i=0; i<str.length;i++){
		if(str[i]==="%"){
			bytes.push(parseInt(str.substring(i+1,i+3),16));
			i = i+2;
		}else{
			bytes.push(str.charCodeAt(i));
		}
	}
	let buf = Buffer.from(bytes);
	return buf.toString('utf8');
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
 * to decode a ss link to a config object
 * @param { string } string to do ssDecode
 * @return  obj|null  ssDecode result
 */
export function ssDecode(s:string):object|null{
	let obj = {
		tag:"default",
		server:"0.0.0.0",
		server_port:1080,
		password:'xxxx',
		method:"chacha20"
	};
	if(s.startsWith('ss://')){
		s = s.substring(5);
	}
	s = urlDecode(s);
	// there are two types ss url
	// If not match how to make it correctly work
	let re1 = /([\w\-_=]+?)@([\w\.\-]+?):(\d+)(.*)/; // 1 encoded methodAndPass, 2 server 3 server_port 4 target
	let re2 = /([\w\-_=]+)(.*)/; //Fully decoded, 1 configs 2 tag
	if(re1.test(s)){
		let result = re1.exec(s);
		//actually it is tested the result couldn't be null
		result = (result as RegExpExecArray);//assert it is RegExpExecArray
		let methodAndPass = result[1]; 
		methodAndPass = b64Decode(methodAndPass);
		let re3 = /([\w\-]+?):(\w+)/; // Decoded 1 method 2 password
		if(re3.test(methodAndPass)){
			let methodAndPassSep = re3.exec(methodAndPass);
			methodAndPassSep = methodAndPassSep as RegExpExecArray; // it is testd so assert it 
			obj.method = methodAndPassSep[1];
			obj.password = methodAndPassSep[2];
			obj.server = result[2];
			obj.server_port = Number(result[3]);
			obj.tag = result[4].startsWith("#")?result[4].substring(1):(result[4] || 'default'); // tag could be null or undefined
			return obj;
		}else{
			return null
		}
	}else if(re2.test(s)){
		let result = re2.exec(s);
		result = result as RegExpExecArray;
		s = result[1];
		s = b64Decode(s);
		let re4 = /([\w\-]+?):(\w+?)@([\w\.\-]+?):(\d+)(.*)/; // 1 method 2 password 3 server 4 server_port 5 target
		if(re4.test(s)){
			let result2 = re4.exec(s);
			result2 = result2 as RegExpExecArray; //It is testd, so assert it 
			obj.method = result2[1];
			obj.password = result2[2];
			obj.server = result2[3];
			obj.server_port = Number(result2[4]);
			obj.tag = result[2].startsWith("#")?result[2].substring(1):(result[2] || 'default'); // tag could be null
			return obj;
		}else{
			return null;
		}
	}else{
		return null;
	}
}

/**
 * for link decode
 * Directly return an config object
 */
export function linkDecode(s: string){
	//judge if supported link
	if(s.startsWith("vmess://")){
		return JSON.parse(b64Decode(s.substring(8)));
	}else if(s.startsWith("ssr://")){
		return b64Decode(s.substring(6));
	}else if(s.startsWith("ss://")){
		return ssDecode(s);
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
			configs.push(linkDecode(linksStr[i]));
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

export function clashFormat(inConf: vmessConf):vmessClashConf{
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
	let outConf:vmessClashConf = {
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

/*
 *
	let obj = {
		tag:"default",
		server:"0.0.0.0",
		server_port:1080,
		password:'xxxx',
		method:"chacha20"
	};
*/




interface ssConf{
	[index:string]:string|number;
	tag:string;
	server:string;
	server_port:number;
	password:string;
	method:string;
}

export function ssClashFormat(inConf:ssConf){
	let outConf:ssClashConf = {
		name:'default',
		type:'ss',
		server:'127.0.0.1',
		port:443,
		cipher:'chacha20',
		password:'xxxx'
	};
	//table have outConf must have
	let table = {
		tag:'name',
		server:'server',
		server_port:'port',
		password:'password',
		method:'cipher'
	};
	for(let key in inConf){
		if(table.hasOwnProperty(key)){
			outConf[(table as any)[key]] = inConf[key]; // I'm pretty sure key exits in table, because hasOwnProperty checked
		}
	}
	return outConf;
}
