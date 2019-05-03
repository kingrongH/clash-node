import { subDecode, clashFormat,ssClashFormat, toYaml, vmessClashConf,ssClashConf, fromYaml } from './decode';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import { config as globalConfig, updateGlobalConfig }from './config';


async function getRes(url: string):Promise<string>{
	if(!(url.startsWith("http://") || url.startsWith("https://"))){
		throw new Error("Only can handle url format!");
	}
	return new Promise((resolve, reject)=>{
		let strings:string[] = [];
		let req:any;
		if(url.startsWith("http://")){
			req = http.get(url,(res)=>{
				if(res.statusCode !== 200){
					reject(new Error("Request failed please check your url or Internet connection!\n " + `statusCode: ${res.statusCode}`));
				}
				res.on("data",(chunk)=>{
					strings.push(chunk);
				});
			});
		}else if(url.startsWith("https://")){
			req = https.get(url,(res)=>{
				if(res.statusCode !== 200){
					reject(new Error("Request failed please check your url Internet connection!\n" + `statusCode: ${res.statusCode}`));
				}
				res.setEncoding("utf8");
				res.on("data",(chunk)=>{
					if(chunk){
						strings.push(chunk);
					}
				});
			});
		}
		// once the request done, join the chunks together, and resolve it
		req.on('close',()=>{
			resolve(strings.join(""));
		});
	});
}


// not include proxy config because only when subscribler is created there should be proxy config
export interface subscribler {
	[index:string]:any;
	name:string;
	path:string;
	url:string;
	lastUpdateDate:Date;
}

/**
 * a class for a subscrible
 * @param {string} name of the subscrible
 * @param {string} save path for this subscrible
 * @param {string} subscrible from the url 
 * @param {vmessClashConf[]} the all configs of this subscribler which initially empty array, 
 * 							after updateSub() method executed, the configs will be in here
 */

export class Subscribler implements subscribler{

	name:string;
	path:string;
	url:string;
	configs:vmessClashConf[];
	lastUpdateDate:Date;

	constructor (name:string,path:string,url:string){
		this.name = name;
		this.path = path;
		this.url = url;
		this.configs = [];
		this.lastUpdateDate = new Date();
	}

	private async getData(url:string):Promise<vmessClashConf[]>{
		return new Promise(async (resolve, reject)=>{
			//let data:string = await getRes(url);
			getRes(url).then((data)=>{
				let vmessConfigs = subDecode(data);
				let result:vmessClashConf[]=[];
				for(let i=0;i<vmessConfigs.length;i++){
					result.push(clashFormat(vmessConfigs[i]));
				}
				resolve(result);
			}).catch((err)=>{
				reject(new Error(`Error occured at getData():\n ${err.message}`));
			});
		});
	}

	/*
	 * save data to file 
	 * @return {boolean} true for success, or error for failure
	 */
	private async saveFile(data:string):Promise<void>{
		return new Promise((resolve,reject)=>{
			fs.writeFile(`${this.path}/${this.name}.yml`, data, {encoding:'utf8'},(err)=>{
				if(err) reject(Error(`Error, ${this.name} subscribler: `+ err.message));
				resolve();
			});
		});
	}

	//for global subscribles config the signature of subscrible should be name, so we change its value by recogonize its name
	private async updateGlobalSubConfig(name:string, value:subscribler){
		let hasSub = false;
		for(let x of globalConfig.subscribles){
			//if has this subscrible
			if(x.name === name){
				hasSub = true;
				for(let y in value){
					x[y] = value[y];
				}
			}
		}
		if(hasSub === false){
			globalConfig.subscribles.push(value);
		}
		let str:string = toYaml(globalConfig);
		//becaue this is important and it'll be fast, so we use sync method here
		fs.writeFileSync(__dirname+'/../config/config.yml', str);
	}

	public async updateSub():Promise<boolean>{
		return new Promise(async (resolve,reject)=>{
			let configs = await this.getData(this.url);
			this.configs = configs;
			let configsStr:string = toYaml(configs);
			this.saveFile(configsStr).then(()=>{
				this.lastUpdateDate = new Date();
				//update global config
				this.updateGlobalSubConfig(this.name,{name:this.name, path:this.path, url:this.url, lastUpdateDate:this.lastUpdateDate});
				resolve(true);
			}).catch((err)=>{
				reject(new Error(`Error occured when update ${this.name} subscrible \n ${err.message}`));
			})
		});
	}
}

export async function updateAllSub():Promise<void>{
	let subPromises:Promise<boolean>[] = []
	for(let sub of globalConfig.subscribles){
		subPromises.push((new Subscribler(sub.name,sub.path,sub.url)).updateSub());
	}
	await Promise.all(subPromises);
}



