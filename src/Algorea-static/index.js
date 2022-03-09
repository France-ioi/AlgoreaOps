var AWS = require('aws-sdk');

exports.handler = function(event, context, callback) {

	if (process.env.DEBUG) console.log('(debug) event: '+JSON.stringify(event));

	var region = process.env.S3_REGION;
	var bucket = process.env.S3_BUCKET;
	var prefix = process.env.S3_PREFIX || '';
	var key = decodeURI(event.path);

	// direct bypass for the root index -- disabled as done directly by ALB
	/*if (key.slice(-1) === '/' && !['/en/', '/fr/'].includes(key.slice(-4))) {
		callback(null, {
					statusCode: 200,
					isBase64Encoded: false,
						headers: {
							'Content-Type': "text/html"
						},
						body: '<html><head><script>window.location.replace("en/");</script></head></html>'
			});
			return;
	}*/

	// if the last part of the path does have dots (we assume it is a "directory"), redirect to the slash path
	// (cannot just serve the content as the browser would be in the "wrong" level of the path)
	const matchMissingSlash = key.match(/^.*\/([\w\d_\-]+)$/i);
	if (matchMissingSlash != null) {
		callback(null, {
			statusCode: 302,
			isBase64Encoded: false,
			multiValueHeaders: {
				'location': [ matchMissingSlash[1]+'/' ]
			},
			headers: {
				'location': matchMissingSlash[1]+'/',
			},
		});
		return;
	}

	if (key.slice(-1) === '/') key += 'index.html'; // if ending with a slash, get the index file
	key = key.substring(1); // remove heading slash for S3
	key = prefix + key; // if there is a prefix configured, prepend the path with the prefix

	console.log('Getting file on S3 with path: '+key);

	var s3 = new AWS.S3({ region: region });
	return s3.makeUnauthenticatedRequest('getObject', { Bucket: bucket, Key: key },	function(err, data) {
		if (err) {
			console.log('Error from S3: '+JSON.stringify(err));
			console.log('Region:'+region+' Bucket:'+bucket+" Key:"+key);
			callback(null, {
				statusCode: 404,
				isBase64Encoded: false,
				multiValueHeaders: { // if multivalue headers are enabled for alb
					'Content-Type': [ 'text/html' ]
				},
				headers: {
					'Content-Type': 'text/html'
				},
				body: "<html><body><h1>Not found.</h1><p>If the problem persists, please contact us.</p></body></html>"
			});
			return;
		}
		callback(null, {
			statusCode: 200,
			multiValueHeaders: { // if multivalue headers are enabled for alb
				'Content-Type': [ data.ContentType ]
			},
			headers: { // if multivalue headers are disabled for alb
				'Content-Type': data.ContentType,
			},
			body: Buffer.from(data.Body).toString(),
			isBase64Encoded: false
		});
	});
};
