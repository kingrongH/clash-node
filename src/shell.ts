import { config as globalConfig } from './config';
import  { Command } from 'commander';
import { spawn } from 'child_process';
import * as fs from 'fs';
import { updateAllSub, Subscribler} from './subscrible';
import * as inquirer  from 'inquirer';


export function setUpCommand(){
	let program = new Command();
	program
		.version('0.1.0')

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

	program.parse(process.argv);
}



//return a clash child_process
function runClash(){
	console.log('starting clash');
	let log = fs.openSync(__dirname+'/../logs/clashLog.log','w');
	spawn(__dirname+'/../source/clash-linux-amd64',['-d',globalConfig.clashConfigPath],{
		stdio:['ignore',log,log]
	});
	console.log(`clash started at dir ${globalConfig.clashConfigPath}`);
	console.log(`see the log ${globalConfig.clashConfigPath}`);
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


