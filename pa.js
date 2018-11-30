var express = require('express');
var superagent = require('superagent');
require('superagent-charset')(superagent);
var mysql = require('mysql')
var cheerio = require('cheerio');
var async = require("async");

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'baidu',
    port: 3306
  })

var app = express();

//去除前后空格和&nbsp;转义字符
function trim(str) {
    return str.replace(/(^\s*)|(\s*$)/g, '').replace(/&nbsp;/g, '')
}

//将Unicode转汉字
function reconvert(str) {
    str = str.replace(/(&#x)(\w{1,4});/gi, function ($0) {
        return String.fromCharCode(parseInt(escape($0).replace(/(%26%23x)(\w{1,4})(%3B)/g, "$2"), 16));
    });
    return str
}

//保存到数据库
function saveToMysql(results) {
    results.forEach(function (result) {
      pool.query('insert into baidu set ?', result, function (err, result1) {
        if (err) throw err
        console.log(`insert ${result.num} success`)
      })
    })
  }
app.get('/', function (req, res, next) {
    superagent.get('http://top.baidu.com/buzz?b=1&fr=20810')
        .charset('gbk')
        .end(function (err, sres) {
            if (err) {
                return next(err);
            }
            var $ = cheerio.load(sres.text);
            var items = [];
            $('.mainBody tr').each(function (index, element) {
                var $element = $(element);
                if($element.find('td').hasClass('first')){
                    items.push({
                        num: $element.find('.first span').text(),
                        title: $element.find('.keyword .list-title').text()
                    });
                }
                
            });
            res.send(items);
            saveToMysql(items);
        });
});

app.listen(4000, function () {
    console.log('app is listenling at port 4000');
});