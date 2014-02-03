var Q = require('q');
var request = require('request');

exports.callback = function(promiser) {
    return function(req, res) {
        promiser(req).then(function(result) {
            res.send(result);
        }, function(error) {
            console.error('Error', error.stack);
            res.send(500, error.toString());
        }).done();
    };
};

exports.forEach = function(ar, promiseEach) {
    var results = [];
    var pos = 0;
    return exports.until(function() {
        if (pos === ar.length) {
            return true;
        }
        var p = pos++;
        return promiseEach(ar[p], p).then(function(result) {
            results[p] = result;
            return false;
        });
    });
};

exports.until = function(promiseTruthy) {
    var d = Q.defer();
    var step = function() {
        Q(promiseTruthy()).done(function(result) {
            if (result) {
                d.resolve(result);
            } else {
                step();
            }
        }, function(error) {
            d.reject(error);
        });
    };
    step();
    return d.promise;
};

exports.streamToBuffer = function(stream) {
    var d = Q.defer(), bufs = [];
    stream.on('data', function(d) { bufs.push(d); });
    stream.on('end', function() {
        d.resolve(Buffer.concat(bufs));
    });
    stream.on('error', function(error) {
        d.reject(error);
    });
    return d.promise;
};

exports.request = function(opts, saveTo) {
    var d = Q.defer();
    if (saveTo) {
        var saved = request(opts).pipe(saveTo);
        saved.on('finish', function() {
            d.resolve();
        });
        saved.on('error', function(error) {
            d.reject(error);
        });
    } else {
        request(opts, function(err, result, body) {
            if (err) {
                d.reject(err);
            } else {
                if (result.headers['content-type'].indexOf('/json') != -1) {
                    body = typeof body === 'string' ? JSON.parse(body) : body;
                }
                d.resolve(body);
            }
        });
    }
    return d.promise;
};
