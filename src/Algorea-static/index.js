var AWS = require('aws-sdk');

exports.handler = function(event, context, callback) {

	var debug = process.env.DEBUG && process.env.DEBUG !== '0';
	var region = process.env.S3_REGION;
	var bucket = process.env.S3_BUCKET;
	var prefix = process.env.S3_PREFIX || '';
	var path = decodeURI(event.path);

	if (debug) console.log('[DEBUG] event: '+JSON.stringify(event));

	/* Compute the s3 path mid-fix (to be prepended with `prefix` and appended with `index.html`)
	 * /branch/anything/even/with/slashes/en/anything/afterwards -> branch/anything/even/with/slashes/en/
	 * /en/ -> en/
	 * /fr/ -> fr/
	 * /en/something/file -> en/
	 * anything else -> error
	 */
	const sufixMatch = path.match(/^\/(branch\/.*\/)?(en|fr)\//i);
	console.log(JSON.stringify(sufixMatch));
	if (sufixMatch === null) {
		console.error('Unable to deduce the s3 path prefix from path: '+path);
		callback(null, notFoundResponse());
		return;
	}
	var s3Key = prefix + (sufixMatch[1] || '') + sufixMatch[2]  + '/index.html';

	console.log('Getting file on S3 with path: '+s3Key);

	var s3 = new AWS.S3({ region: region });
	return s3.makeUnauthenticatedRequest('getObject', { Bucket: bucket, Key: s3Key }, function(err, data) {
		if (err) {
			console.error('Error from S3: '+JSON.stringify(err));
			console.error('Region:'+region+' Bucket:'+bucket+" Key:"+s3Key);
			callback(null, notFoundResponse());
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

function notFoundResponse() {
	return {
		statusCode: 404,
		isBase64Encoded: false,
		multiValueHeaders: { // if multivalue headers are enabled for alb
			'Content-Type': [ 'text/html' ]
		},
		headers: {
			'Content-Type': 'text/html'
		},
		body: "<html><body><h1>Not found.</h1><p>If the problem persists, please contact us.</p></body></html>"
	};
}
