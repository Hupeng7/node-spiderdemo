"use strict";

var superagent = require('superagent');
var cheerio = require('cheerio');
var async = require('async');
var fs = require('fs');
var request = require('request');

console.log('let us start,spider... ');

//第一步， 发起getData 请求 获取所有4星角色的列表
superagent
    .post('http://wcatproject.com/charSearch/function/getData.php')
    .send({
        // 请求表单信息 form data
        info: 'isempty',
        star: [0, 0, 0, 1, 0],
        job: [0, 0, 0, 0, 0, 0, 0, 0],
        type: [0, 0, 0, 0, 0, 0, 0],
        phase: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        cate: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        phases: ['初代', '第一期', '第二期', '第三期', '第四期', '第五期', '第六期', '第七期', '第八期', '第九期', '第十期', '第十一期', '第十二期', '第十三期', '第十四期', '第十五期', '第十六期'],
        cates: ['活動限定', '限定角色', '聖誕限定', '正月限定', '黑貓限定', '中川限定', '茶熊限定', '夏日限定']
    })
    //http 请求的header信息
    .set('Accept', 'application/json,text/javascript,*/*;q=0.01')
    .set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8')
    .end(function (err, res) {
        //请求返回后的处理
        //将response中返回的结果 转换成JSON 对象
        var heroes = JSON.parse(res.text);
        //并发遍历heroes对象
        async.mapLimit(heroes, 5,
            function (hero, callback) {
                //对每个角色对象的处理逻辑
                var heroId = hero[0];
                fetchInfo(heroId, callback);
            },
            function (err, result) {
                console.log('抓取的角色数: ', heroes.length);
            });
    })

//获取角色信息
var concurrencyCount = 0; //当前并发数记录
var as2Url = "http://wcatproject.com/img/as2/";
var fetchInfo = function (heroId, callback) {
    //下载连接
    var url = as2Url + heroId + '.gif';
    //本地保存路径
    var filepath = 'img/' + heroId + '.gif';
    //判断文件是否存在
    fs.exists(filepath, function (exists) {
        if (exists) {
            //文件已经存在不下载
            console.log(filepath + ' is exists');
            callback(null, 'exists');
        } else {
            //文件不存在 开始下载文件
            concurrencyCount++;
            console.log('并发数: ', concurrencyCount, ', 正在抓取的是:' + url);
            request.head(url, function (err, res, body) {
                if (err) {
                    console.log('err: ' + err);
                    callback(null, err);
                }
                request(url)
                    .pipe(fs.createWriteStream(filepath))
                    .on('close', function () {
                        console.log('Done: ' + url);
                        concurrencyCount--;
                        callback(null, url);
                    });
            });
        }
    });
};





















































