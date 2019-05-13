import { config as globalConfig } from './config';
import  { Command } from 'commander';
import * as fs from 'fs';
import { updateAllSub, Subscribler} from './subscrible';
import * as inquirer  from 'inquirer';
import { runClash,proxySelect,killClash } from './controller';


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


