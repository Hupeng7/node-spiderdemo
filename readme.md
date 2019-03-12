使用Node.js制作爬虫教程 
原创 2016-01-31  翟永超  Node.js 被围观 11079 次
号外： 最近整理了之前编写的一系列内容做成了PDF，关注我的公众号"程序猿DD"来领取吧！
应邀写一点使用Node.js爬点资料的实例，对于大家建站爬一些初始资料或者做分析研究的小伙伴们应该有些帮助。

目标分析
目标地址：http://wcatproject.com/charSearch/

抓取内容：抓取所有4星角色的数值数据。如果我们采用手工采集的步骤，需要先进入目标地址，然后选择4星角色的选项，页面下方出现所有4星角色的头像，依次点击每个4星角色头像后会出现角色的详细页面，记录下详细页面中数据。显然这样的做法如果角色一多，手工处理是非常吃力的，所以我们就需要一个自动的脚本去完成这样的动作。大家不妨先手工试试这样的访问步骤，有助于后面的分析和实践。

页面分析：

进入http://wcatproject.com/charSearch/
打开Chrome的“开发者工具”，选择“Network”标签。点亮“Record Network Log”按钮
第一步页面操作：在页面中“星数”选择“4”，查询出所有4星角色，观察Network中记录的请求信息。可以看到一个名为“getData.php”的请求，如图所示：alt=
alt=
getData.php中的重要信息记录（通过nodejs发起请求时候需要）
4.1 Request URL我们需要调用的请求地址:http://wcatproject.com/charSearch/function/getData.php
4.2 Request Method该请求的类型:POST
4.3 Request Header请求的头信息
4.4 Form Data请求的表单信息
4.5 Response和Preview中可以看到返回的内容和格式化内容，可以看到返回的是一个角色ID和角色名称的数组内容alt=
alt=

4.6 在“开发者工具”中选择“Elements”标签，点击左上角的放大镜，将鼠标移到下方伙伴的头像部分点击鼠标左键，可以看到这块的HTML结构。可以看到每个角色的链接的规则为char/角色idalt=
alt=
第二部页面操作：点击页面下面查询出的4星角色的头像，进入到角色详细页面，观察Network中记录的请求信息。可以找到一个名为“SS0441”的请求，如上步骤，记录下相关信息，由于这个请求的Request Method为GET，因此没有Form Data信息。
最后在理一下思路，我们的脚本过程如下：

发起getData.php请求，获得所有4星角色的ID
依次循环根据char/角色id规则访问各个角色的详细页面，并解析其中需要的数据并按我们想要的方式存储起来
##准备工作

Node.js环境搭建
一款具有代码高亮功能文本编辑器，如Sublime Text等
使用nvm工具将Node.js版本设置为5.0.0
##创建工程

选择一个目录，新建一个准备存放工程内容的文件夹demo。
打开终端（windows机器打开CMD命令行），输入npm init，根据提示，逐步输入工程信息，具体示例如下

$ npm init
This utility will walk you through creating a package.json file.
It only covers the most common items, and tries to guess sensible defaults.

See `npm help json` for definitive documentation on these fields
and exactly what they do.

Use `npm install <pkg> --save` afterwards to install a package and
save it as a dependency in the package.json file.

Press ^C at any time to quit.
name: (workspace) demo
version: (1.0.0)
description: 爬虫案例
entry point: (index.js)
test command:
git repository:
keywords:
author: 程序猿DD
license: (ISC)
About to write to /Users/diyongchao/Documents/workspace/package.json:

{
  "name": "demo",
  "version": "1.0.0",
  "description": "爬虫案例",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "程序猿DD",
  "license": "ISC"
}


Is this ok? (yes) yes
$
此时文件夹下生成了一个package.json文件，其中包含了工程的基本信息以及引用的框架等信息

框架引入
superagent：发起http请求
cheerio：解析http返回的html内容
async：多线程并发控制
安装命令 npm install --save PACKAGE_NAME，执行以下三条命令后，工程目录下多了一个node_modules目录，该目录就是引入的框架内容。

$npm install --save superagent
$npm install --save cheerio
$npm install --save async
编码过程
工程目录下，创建index.js

var superagent = require('superagent'); 
var cheerio = require('cheerio');
var async = require('async');

console.log('爬虫程序开始运行......');

// 第一步，发起getData请求，获取所有4星角色的列表
superagent
	.post('http://wcatproject.com/charSearch/function/getData.php')
	.send({ 
		// 请求的表单信息Form data
		info: 'isempty', 
		star : [0,0,0,1,0], 
		job : [0,0,0,0,0,0,0,0], 
		type : [0,0,0,0,0,0,0], 
		phase : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		cate : [0,0,0,0,0,0,0,0,0,0], 
		phases : ['初代', '第一期','第二期','第三期','第四期','第五期','第六期', '第七期','第八期','第九期','第十期','第十一期','第十二期','第十三期','第十四期', '第十五期', '第十六期'],
		cates : ['活動限定','限定角色','聖誕限定','正月限定','黑貓限定','中川限定','茶熊限定','夏日限定'] })
   	// Http请求的Header信息
   .set('Accept', 'application/json, text/javascript, */*; q=0.01')
   .set('Content-Type','application/x-www-form-urlencoded; charset=UTF-8')
   .end(function(err, res){      	
    	// 请求返回后的处理
    	// 将response中返回的结果转换成JSON对象
        var heroes = JSON.parse(res.text);    
        // 并发遍历heroes对象
		async.mapLimit(heroes, 1, 
			function (hero, callback) {
			// 对每个角色对象的处理逻辑
		 		var heroId = hero[0];	// 获取角色数据第一位的数据，即：角色id
		    	fetchInfo(heroId, callback);
			}, 
			function (err, result) {
				console.log('抓取的角色数：' + heroes.length);
			}
		);

    }); 

// 获取角色信息
var concurrencyCount = 0; // 当前并发数记录
var fetchInfo = function(heroId, callback){
	concurrencyCount++;
	// console.log("...正在抓取"+ heroId + "...当前并发数记录：" + concurrencyCount);

    // 根据角色ID，进行详细页面的爬取和解析
	superagent
    	.get('http://wcatproject.com/char/' + heroId)
    	.end(function(err, res){  
    		// 获取爬到的角色详细页面内容
    		var $ = cheerio.load(res.text,{decodeEntities: false});       			

    		// 对页面内容进行解析，以收集队长技能为例
    		console.log(heroId + '\t' + $('.leader-skill span').last().text())

	     	concurrencyCount--;
	    	callback(null, heroId);
    	});
	
};
工程目录下执行命令，node index.js，抓取程序开始执行

$ node index.js
爬虫程序开始运行......
SS0441	平衡型傷害增加 (20%)
NS1641	防禦型的移速增加 (20%)
SS1141	技術型的技能傷害增加 (20%)
SS1041	攻擊型的SP增加 (15%)
SS0941	攻擊型傷害增加 (20%)
SS0841	劍士減傷 (10%) / 技術型減傷 (15%)
LS0941	全員傷害增加 (15%)
LS1441	劍士傷害增加 (10%)  /  技術型傷害增加 (15%)
SS0741	劍士雷屬性傷害增加 (50%)
SS0641	攻擊型傷害增加 (20%)
NS1741	技能型的SP消費減少 (15%)
NS1141	全員傷害增加 (15%)
NS0031-A	獲得的魂增加 (20%)
SS0501	技術型傷害增加 (20%)
SS0141	劍士傷害增加 (20%)
SS0241	全員傷害增加 (15%)
后记
如果觉得爬的慢，可以通过修改下面代码中的1来调整并发数量

async.mapLimit(heroes, 1, function (hero, callback)
同时也可以放开下面的注释，来观察执行过程中并发数

console.log("...正在抓取"+ heroId + "...当前并发数记录：" + concurrencyCount);



*******************************************************************************************8
二 使用Node.js制作爬虫教程（续：爬图）
原创 2016-02-01  翟永超  Node.js 被围观 3912 次
号外： 最近整理了之前编写的一系列内容做成了PDF，关注我的公众号"程序猿DD"来领取吧！
前几天发了《使用Node.js制作爬虫教程》之后，有朋友问如果要爬文件怎么办，正好之前也写过类似的，那就直接拿过来写个续篇吧，有需要的可以借鉴，觉得不好的可以留言交流。

案例回顾
上一篇中，主要利用nodejs发起一个getData请求来得到4星角色的id列表。通过chrome开发者工具来查看页面结构，分析得出角色详细页面的URL规则和详细页面中想要抓取内容的位置。再循环遍历4星角色id列表去发起角色详细页面的请求并解析出想要收集的内容。

具体内容可再参考原文：使用Node.js制作爬虫教程

目标分析
案例回顾中提到的角色详细页面（参考样例），有不少图片内容，本文就以抓取“主动技能”的GIF图片为例，来改造一下前文的代码以完成定向抓取图片的效果。

alt=
alt=

通过Chrome查看图片对象的URL规则为：/img/as2/角色id.gif



编码过程
构建工程和引入框架

$npm init
$npm install --save superagent
$npm install --save cheerio
$npm install --save async
上篇代码逻辑

发起getData.php请求，获得所有4星角色的ID
依次循环根据char/角色id规则访问各个角色的详细页面，并解析其中需要的数据并按我们想要的方式存储起来
本篇代码逻辑：

发起getData.php请求，获得所有4星角色的ID
依次循环根据/img/as2/角色id.gif规则下载gif文件到本地
所以，只要修改上篇代码中对每个角色对象的处理逻辑部分的内容为下载文件即可。

具体代码如下：

var superagent = require('superagent'); 
var cheerio = require('cheerio');
var async = require('async');

var fs = require('fs');
var request = require("request");

console.log('爬虫程序开始运行......');

// 第一步，发起getData请求，获取所有4星角色的列表
superagent
	.post('http://wcatproject.com/charSearch/function/getData.php')
	.send({ 
		// 请求的表单信息Form data
		info: 'isempty', 
		star : [0,0,0,1,0], 
		job : [0,0,0,0,0,0,0,0], 
		type : [0,0,0,0,0,0,0], 
		phase : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		cate : [0,0,0,0,0,0,0,0,0,0], 
		phases : ['初代', '第一期','第二期','第三期','第四期','第五期','第六期', '第七期','第八期','第九期','第十期','第十一期','第十二期','第十三期','第十四期', '第十五期', '第十六期'],
		cates : ['活動限定','限定角色','聖誕限定','正月限定','黑貓限定','中川限定','茶熊限定','夏日限定'] })
   	// Http请求的Header信息
   	.set('Accept', 'application/json, text/javascript, */*; q=0.01')
   	.set('Content-Type','application/x-www-form-urlencoded; charset=UTF-8')
    .end(function(err, res){  
    	
    	// 请求返回后的处理
    	// 将response中返回的结果转换成JSON对象
       	var heroes = JSON.parse(res.text);    
       	// 并发遍历heroes对象
		async.mapLimit(heroes, 5,
			function (hero, callback) {
				// 对每个角色对象的处理逻辑
		 		var heroId = hero[0];	// 获取角色数据第一位的数据，即：角色id
		    	fetchInfo(heroId, callback);
			}, 
			function (err, result) {
				console.log('抓取的角色数：' + heroes.length);
			}
		);

    }); 

// 获取角色信息
var concurrencyCount = 0; // 当前并发数记录
var as2Url = 'http://wcatproject.com/img/as2/';
var fetchInfo = function(heroId, callback){

	// 下载链接
	var url = as2Url + heroId + '.gif';
	// 本地保存路径
	var filepath = 'img/' + heroId + '.gif';

	// 判断文件是否存在
	fs.exists(filepath, function(exists) {
		if (exists) {
			// 文件已经存在不下载
			console.log(filepath + ' is exists');
			callback(null, 'exists');
		} else {
			// 文件不存在，开始下载文件
			concurrencyCount++;
			console.log('并发数：', concurrencyCount, '，正在抓取的是', url);

			request.head(url, function(err, res, body){
				if (err) {
					console.log('err: '+ err);
					callback(null, err);
				}
				request(url)
					.pipe(fs.createWriteStream(filepath))
					.on('close', function(){
						console.log('Done : ', url);
						concurrencyCount --;
						callback(null, url);
					});
			});
		}
	});



};
主要修改内容：

对fs模块和request模块的引用，前者用来读写文件，后者用来通过http请求获取文件。

var fs = require('fs');
var request = require("request");
fetchInfo函数修改成拼接url和本地保存路径，并通过request进行下载。

由于图片下载较慢修改并发数，async.mapLimit(heroes, 5, function (hero, callback)

执行情况如下，根据配置的并发数5，可以看到如下输出

$ node index.js
爬虫程序开始运行......
并发数： 1 ，正在抓取的是 http://wcatproject.com/img/as2/SS0441.gif
并发数： 2 ，正在抓取的是 http://wcatproject.com/img/as2/NS1641.gif
并发数： 3 ，正在抓取的是 http://wcatproject.com/img/as2/SS1141.gif
并发数： 4 ，正在抓取的是 http://wcatproject.com/img/as2/SS1041.gif
并发数： 5 ，正在抓取的是 http://wcatproject.com/img/as2/SS0941.gif
Done :  http://wcatproject.com/img/as2/SS1141.gif
并发数： 5 ，正在抓取的是 http://wcatproject.com/img/as2/SS0841.gif
Done :  http://wcatproject.com/img/as2/SS0841.gif
并发数： 5 ，正在抓取的是 http://wcatproject.com/img/as2/LS0941.gif
Done :  http://wcatproject.com/img/as2/SS1041.gif
并发数： 5 ，正在抓取的是 http://wcatproject.com/img/as2/LS1441.gif
Done :  http://wcatproject.com/img/as2/NS1641.gif
并发数： 5 ，正在抓取的是 http://wcatproject.com/img/as2/SS0741.gif
Done :  http://wcatproject.com/img/as2/LS0941.gif
并发数： 5 ，正在抓取的是 http://wcatproject.com/img/as2/SS0641.gif
示例到此结束，有需要的去爬爬爬，至于爬什么我就不负责啦，^_^

代码参考：http://git.oschina.net/didispace/nodejs-learning
