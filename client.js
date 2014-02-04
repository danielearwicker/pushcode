#!/usr/bin/node

var fs = require('fs');
var Q = require('q');

var config = require('./config.js');
var util = require('./util.js');

var targetUrl = 'http://' + config.targetMachine + ':' + config.port + '/';

util.request({ uri: config.jenkinsUrl, auth: config.jenkinsAuth }).then(function(body) {
        
    var m = body.match(/\<a\s*href=\"(PRISYM%20360\-.+\.exe)\"\>/);
    if (!m || m.length < 2) {
        throw new Error('Could not find installer link on page');
    }
    return m[1];
        
}).then(function(installerName) {

    console.log('Downloading ' + installerName);
    return util.request({ uri: config.jenkinsUrl + installerName, auth: config.jenkinsAuth }, fs.createWriteStream('bundle/installer.exe'));

}).then(function() {

    return util.until(function() {
        return util.request(targetUrl + 'version').then(function(result) {
            return typeof result.version === 'string';
        }).catch(function() {
            console.log('Waiting for server...');
            return Q(false).delay(1000);
        });
    });

}).then(function() {
        
    return Q.ninvoke(fs, 'readdir', 'bundle').then(function(files) {
        return util.forEach(files, function(fileName) {
            console.log('Uploading ' + fileName);
            return Q.ninvoke(fs, 'readFile', 'bundle/' + fileName).then(function(fileData) {
                return util.request({
                    method: 'POST',
                    uri: targetUrl + 'file/' + fileName,
                    body: fileData
                });
            });
        });
    });

}).then(function() {

    console.log('All uploads done, launching installer...');
    return util.request({
        uri: targetUrl + 'exec',
        method: 'POST',
        json: {
            program: 'installer.exe',
            arguments: ['autoinst.txt']
        }
    });

}).then(function() {

    console.log('Waiting for installer to start...');

    var pos = 0, lastChunk = '';

    return util.until(function() {
        return util.request(targetUrl + 'tail/' + pos).then(function(tailResult) {
            if (tailResult.next == pos) {
                return Q(false).delay(1000);
            }

            process.stdout.write(tailResult.text);
            pos = tailResult.next;

            var lastTwoChunks = lastChunk + tailResult.text;
            lastChunk = tailResult.text;
            return lastTwoChunks.indexOf(config.endOfLog) != -1;

        }).catch(function(error) {
            console.error('Error when tailing', error);
            return Q(false).delay(2000);
        });
    });
        
}).catch(function(err) {
    console.error('Error', err);
});

