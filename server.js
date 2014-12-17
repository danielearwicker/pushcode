var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');
var Q = require('q');

var child_process = require("child_process");

var util = require('./util.js');
var resetdb = require('./resetdb.js');

var port = parseInt(process.argv[2], 10) || 81;

var app = express();

app.use(express.json());
app.use(express.urlencoded());

app.post('/version', util.callback(function(req) {
    // Clear out any old logs
    return Q.ninvoke(fs, 'readdir', req.body.loggingDir).then(function(files) {
        return util.forEach(files, function(fileName) {
            return Q.ninvoke(fs, 'unlink', req.body.loggingDir + '\\' + fileName);
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
    return Q.ninvoke(fs, 'readdir', req.body.loggingDir).then(function(files) {
        if (files.length == 0) {
            return { text: 'Waiting for log file to appear\n', next: null };
        }
        files = files.map(function(name) {
            return { name: name, stat: fs.statSync(req.body.loggingDir + '\\' + name) }; 
        });
        files.sort(function(a, b) { 
            return b.stat.mtime.getTime() - a.stat.mtime.getTime(); 
        });
        var newest = files[0].name;
        return Q.ninvoke(fs, 'open', req.body.loggingDir + '\\' + newest, 'r').then(function(fd) {
            var b = new Buffer(1024);
            var pos = (!req.body.pos || req.body.pos.file != newest) ? 0 
                        : parseInt(req.body.pos.pos, 10);
            return Q.ninvoke(fs, 'read', fd, b, 0, b.length, pos).then(function(bytesRead) {
                fs.closeSync(fd);
                return {
                    text: b.toString('utf8', 0, bytesRead[0]),
                    next: { file: newest, pos: pos + bytesRead[0] }
                };
            });
        });
    }).catch(function(x) {
        console.log('Error in tail', x);
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
	return resetdb.withConfig(req.body);
}));

http.createServer(app).listen(port, function() {
    console.log('Express server listening on port ' + port);
});
