var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');
var Q = require('q');

var child_process = require("child_process");

var config = require('./config.js');
var util = require('./util.js');
var resetdb = require('./resetdb.js');

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

app.post('/tail', util.callback(function(req) {
    return Q.ninvoke(fs, 'readdir', config.loggingDir).then(function(files) {
        if (files.length == 0) {
            return { text: 'Waiting for log file to appear\n', next: null };
        }
        files = files.map(function(name) {
            return { name: name, stat: fs.statSync(config.loggingDir + '\\' + name) }; 
        });
        files.sort(function(a, b) { 
            return b.stat.mtime.getTime() - a.stat.mtime.getTime(); 
        });
        var newest = files[0].name;
        return Q.ninvoke(fs, 'open', config.loggingDir + '\\' + newest, 'r').then(function(fd) {
            var b = new Buffer(1024);
            var pos = (!req.body || req.body.file != newest) ? 0 
                        : parseInt(req.body.pos, 10);
            return Q.ninvoke(fs, 'read', fd, b, 0, b.length, pos).then(function(bytesRead) {
                return {
                    text: b.toString('utf8', 0, bytesRead[0]),
                    next: { file: newest, pos: pos + bytesRead[0] }
                };
            });
        });
    }).catch(function() {
        return { text: 'Waiting for logging directory to be created\n', next: null };
    });
}));

app.post('/exec', util.callback(function(req) {
	if (!req.body.wait) {
		var cp = child_process.spawn(req.body.program, req.body.arguments, { cwd: 'uploads' });
		return Q({ pid: cp.pid });
	}
	var d = Q.defer();
	child_process.exec(
        req.body.program + ' ' + req.body.arguments.join(' '), 
        { cwd: 'uploads' }, 
        function(er, stdout, stderr) {
            d.resolve({
                error: er && er.toString(),
                stdout: stdout.toString(), 
                stderr: stderr.toString()
            });
        }
    );
    return d.promise;
}));

app.post('/resetdb', util.callback(function(req) {
	return resetdb.withConfig(req.config);
}));

http.createServer(app).listen(config.port, function() {
    console.log('Express server listening on port ' + config.port);
});
