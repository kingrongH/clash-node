Clash-node is a node.js project, you can use this clash-node subscrible the proxies from the vendor's url, and run clash in the terminal. 
Clash-node is based on [Dreamacro/clash](https://github.com/Dreamacro/clash), aimed at making it convenient for linux user's using vmess and shadowsocks.

Clash-node now is fully open source, anyone has any ideas with this repo can contact me.

## Current version

Current version is 0.1

## Features

* It runs clash in terminal
* Support subscrible proxies from url(Now only support vmess)
* Fully configured, use by only download it

## Requirements 

### Node

Clash-node uses nodejs as runtime environment, install [node](https://nodejs.org/en/) first.

It is recommended that use [nvm](https://github.com/nvm-sh/nvm) as Node version manager.

It is needed install node with `npm`.

In China `npm` maybe slow, you can choose [cnpm](https://npm.taobao.org/).

## Install

Now can only install from source 

```shell
git clone https://github.com/kingrongH/clash-node
cd clash-node
npm install
npm build
```

## Usage

In this repo dir you can 

### For subscrible 

Run the command below, and then follow the instructions to add a subscrible url and the proxies from the subscrible

```shell
cd bin
node index.js addSub
```
It looks like this:
![subscrible](https://i.loli.net/2019/04/29/5cc700a248f36.png)

Update the subscrible you have added before by ruuning command below:

```shell
cd bin
node index.js updateSub
```

### For run clash

After update the subscrible from the url, you may want to start using this proxies now.

```shell
cd bin
node index.js start
```

## Config

config some the config except Proxy, Proxy Group and Rule in `./config/config.yml`

Which is the same as clash's config, see [Dreamacro/clashh](https://github.com/Dreamacro/clash) for more infomation.


## Thanks

[Dreamacro/clash](https://github.com/Dreamacro/clash)


## TODO

* [x] Add ss proxies support
* [ ] Add proxy control
* [ ] Add single proxy add function
