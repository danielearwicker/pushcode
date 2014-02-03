var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');
var Q = require('q');

var child_process = require("child_process");

var config = require('./config.js');
var util = require('./util.js');

var app = express();

app.use(express.json());
app.use(express.urlencoded());

app.get('/version', util.callback(function() {
    // Clear out any old logs
    return Q.ninvoke(fs, 'readdir', config.loggingDir).then(function(files) {
        return util.forEach(files, function(fileName) {
            return Q.ninvoke(fs, 'unlink', config.loggingDir + '\\' + fileName);
        });
    }).catch(function() { return true; }).then(function() {
        return Q({ version: '0.1' });
    });
}));

app.post('/file/:name', util.callback(function(req) {
    return util.streamToBuffer(req).then(function(data) {
        return Q.ninvoke(fs, 'writeFile', 'uploads/' + req.params.name, data);
    }).then(function() { return true; });;
}));

app.get('/tail/:from', util.callback(function(req) {
    return Q.ninvoke(fs, 'readdir', config.loggingDir).then(function(files) {
        if (files.length == 0) {
            return { text: 'Waiting for log file to appear\n', next: 0 };
        }
        return Q.ninvoke(fs, 'open', config.loggingDir + '\\' + files[0], 'r').then(function(fd) {
            var b = new Buffer(1024);
            var pos = parseInt(req.params.from, 10);
            return Q.ninvoke(fs, 'read', fd, b, 0, b.length, pos).then(function(bytesRead) {
                return { text: b.toString('utf8', 0, bytesRead[0]), next: pos + bytesRead[0] };
            });
        });
    }).catch(function() {
        return { text: 'Waiting for logging directory to be created\n', next: 0 };
    });
}));

app.post('/exec', util.callback(function(req) {
    var cp = child_process.spawn(req.body.program, req.body.arguments, { cwd: 'uploads' });
    return Q({ pid: cp.pid });
}));

http.createServer(app).listen(config.port, function() {
    console.log('Express server listening on port ' + config.port);
});
