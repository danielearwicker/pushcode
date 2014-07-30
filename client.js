#!/usr/bin/node

var fs = require('fs');
var Q = require('q');

var config = require('./config.js');
var util = require('./util.js');

var targetUrl = 'http://' + config.targetMachine + ':' + config.port + '/';

var localBuildFile = process.argv[2], jenkinsKey = config.jenkins.defaultBuild;
if (localBuildFile && localBuildFile[0] === '-') {
    jenkinsKey = localBuildFile.substr(1);
    localBuildFile = null;
}

var bundleBuildFile = 'bundle/installer.exe';

(function() {

    if (localBuildFile) {
        var d = Q.defer();
        fs.createReadStream(localBuildFile)
            .pipe(fs.createWriteStream(bundleBuildFile))
            .on('finish', d.resolve);
        return d.promise;
    }

    var jenkinsUrl = config.jenkins.builds[jenkinsKey];
    if (!jenkinsUrl) {
        throw new Error('Invalid jenkins build: ' + jenkinsKey);
    }
    
    console.log('Logging into jenkins (' + jenkinsKey + ') at ' + jenkinsUrl);
    
    return util.request({ uri: jenkinsUrl, auth: config.jenkins.auth }).then(function(body) {

        var m = body.match(/\<a\s*href=\"(PRISYM%20360\-.+\.exe)\"\>/);
        if (!m || m.length < 2) {
            console.log(body);
        
            throw new Error('Could not find installer link on page');
        }
        return m[1];
            
    }).then(function(installerName) {

        console.log('Downloading ' + installerName);
        return util.request({ 
            uri: jenkinsUrl + installerName, 
            auth: config.jenkins.auth }, 
            fs.createWriteStream(bundleBuildFile)
        );
    });

})().then(function() {

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
            
            return util.until(function() {
                return Q.ninvoke(fs, 'readFile', 'bundle/' + fileName).then(function(fileData) {
                    return util.request({
                        method: 'POST',
                        uri: targetUrl + 'file/' + fileName,
                        body: fileData
                    });
                }).catch(function(err) {
                    console.log('Error: ' + err.message + ' - retrying...');
                    return Q(false);
                });
            });
        });
    });

}).then(function() {

    console.log('Killing chrome...');
    return util.request({
        uri: targetUrl + 'exec',
        method: 'POST',
        json: {
            wait: true,
            program: 'taskkill',
            arguments: ['/F', '/IM', 'chrome.exe']
        }
    });
    
}).then(function(chromeResults) {

    console.log(chromeResults);

    console.log('Attempting uninstall...');
    return util.request({
        uri: targetUrl + 'exec',
        method: 'POST',
        json: {
            wait: true,
            program: config.uninstall.program,
            arguments: config.uninstall.arguments
        }
    });

}).then(function(uninstallResults) {
    
    console.log(uninstallResults);
    
    return util.forEach(config.databases, function(database) {
        console.log('Cleaning database ' + JSON.stringify(database));
        return util.request({
            uri: targetUrl + 'resetdb', method: 'POST', json: database
        });
    });
    
}).then(function() {

    console.log('Launching installer...');
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

    var lineBuffer = (function() {
        var wholeLines = [], partialLine = null;
        return {
            ready: function() {
                return !!wholeLines.length;
            },
            read: function() {
                return wholeLines.shift();
            },
            fill: function(text) {
                var received = text.split('\n');
                wholeLines.push((partialLine || '') + received[0]);
                wholeLines = wholeLines.concat(received.slice(1, received.length - 1));
                partialLine = received[received.length - 1];
            }
        };
    })();
    
    var pos = null, started = false;

    return util.until(function() {
    
        return util.request({ 
            uri: targetUrl + 'tail',
            method: 'POST',
            json: pos
        }).then(function(tailResult) {
            if (!tailResult.text) {
                return Q(false).delay(1000);
            }

            lineBuffer.fill(tailResult.text);
            pos = tailResult.next;
           
            while (lineBuffer.ready()) {
                var line = lineBuffer.read().trim();
                console.log(line);
                
                if (line == config.startOfLog) {
                    started = true;
                } else if ((line == config.endOfLog) && started) {
                    return true;
                }
            }
            return false;

        }).catch(function(error) {
            console.error('Error when tailing', error);
            return Q(false).delay(2000);
        });
    });

}).catch(function(err) {
    console.error('Error', err);
});

