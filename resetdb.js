var sql = require('mssql'); 
var fs = require('fs');
var Q = require('q');

exports.withConfig = function(config) {
	var d = Q.defer();

	var connection = new sql.Connection(config, function(err) {

		var script = fs.readFileSync('resetdb.sql', 'utf8');
		script = script.split(/[^A-Z0-9]GO[^A-Z0-9]/gi);

		if (err) {
			d.reject(err);

		} else {
			var request = connection.request();

			var step = function() {
				var part = script.shift();
				if (!part) {
					connection.close();
					d.resolve();
				} else {
					request.query(part, function(err, recordset) {
						if (err) {
							d.reject();
						} else {
							step();
						}
					});
				}
			};
			step();
		}
	});

	return d.promise;
};
