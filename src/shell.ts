import { config as globalConfig,updateGlobalConfig } from './config';
import  { Command } from 'commander';
import * as fs from 'fs';
import { updateAllSub, Subscribler} from './subscrible';
import * as inquirer  from 'inquirer';
import { runClash,proxySelect,killClash } from './controller';
import { fromYaml } from './decode'


export function setUpCommand(){
	let program = new Command();
	program
		.version('0.1.1')
		.description('Update start and stop command');

	//Only command can specify action, the option can't not specify action 
	program
		.command('start')
		.description('start clash process right now')
		.action(runClash);

	program
		.command('updateSub')
		.description('Update all subscribles')
		.action(updateAllSub);

	program
		.command('addSub')
		.description('Add a new subscrible')
		.action(addNewSub);

	program
		.command('stop')
		.description('Stop all opened clash')
		.action(killClash);

	program
		.command('selectProxy')
		.alias('sel')
		.description('Select a proxy to use now')
		.action(selectProxy);

	program.parse(process.argv);
}


interface answer {
	[index:string]:string;
	name:string;
	path:string;
	url:string;
}

async function addNewSub(){
	let pr = inquirer.createPromptModule();
	let answer:answer = await pr([
		{
			type:'input',
			name:'name',
			message:'Input name for this subscrible'
		},
		{
			type:'input',
			name:'path',
			message:"Input the path of the subscrible(eg:]'/home/user/clash/proxies'),use default path by skip this:",
			filter:function(input){
				if(input === ''){
					return globalConfig.proxiesPath;
				}
			},
			validate:function(input){
				if(fs.existsSync(input)){
					return true
				}else{
					return 'This path does not exits'
				}
			}
		},
		{
			type:'input',
			name:'url',
			message:'Input the url to update subscrible:',
			validate:function(input){
				let regex = /(http|ftp|https):\/\/[\w\-]+(\.[\w\-])+(\/[\w\u4e00-\u9fa5\-\.\/?\@\%\!\&=\+\~\:\#\;\,]*)?/i
				if(regex.test(input)){
					return true;
				}else{
					return 'Please input a valid url!';
				}
			}
		}
	]);
	console.log('Start updating...');
	console.log(answer);
	let sub = new Subscribler(answer.name,answer.path,answer.url);
	await sub.updateSub();
}

/**
 * command function for select proxy
 * TODO:Add support for default proxies--the proxy user added one by one
 */

export function selectProxy(){
	//add choices 
	let choices:any = {};
	globalConfig.subscribles.forEach((e)=>{
		let proxies = fromYaml(fs.readFileSync(`${e.path}/${e.name}.yml`,{encoding:'utf8'}));
		choices[e.name] = proxies;
	});

	// create inquirer prompt and declare its anwser
	let pr = inquirer.createPromptModule();
	let result:Promise<any>;
	// choices can empty or if only have one
	if(Object.keys(choices).length === 0){
		throw new Error('No proxy to be select');
	}else if(Object.keys(choices).length === 1){
		result = pr([
			{
				type:'list',
				name:'proxy',
				choices:Object.values(choices)[0] as string[],
				message:'Choose one proxy'
			}
		])
	}else{
		result = pr([
			{
				type:'list',
				name:'group',
				choices:function(){
					return Object.keys(choices);
				},
				message:'Choose a group:',
				default:choices[0]
			},
			{
				type:'list',
				name:'proxy',
				choices:function (anwser){
					return choices[anwser['group']];
				},
				message:'Choose one proxy'
			}
		]);
	}
	result.then((answer)=>{
		console.log(answer['proxy']);
		proxySelect(answer['proxy']).then(()=>{
			updateGlobalConfig("defaultProxy",answer['proxy']);
			console.log(`Select proxy successfully! Now using ${answer['proxy']}`);
		}).catch(console.log);
	});
}
