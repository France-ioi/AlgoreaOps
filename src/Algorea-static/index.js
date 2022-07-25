var AWS = require('aws-sdk');

exports.handler = async function(event, context, callback) {

	const debug = process.env.DEBUG && process.env.DEBUG !== '0';
	const region = process.env.S3_REGION;
	const bucket = process.env.S3_BUCKET;
	const prefix = process.env.S3_PREFIX || '';
	const path = decodeURI(event.path);

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
	const s3Key = prefix + (sufixMatch[1] || '') + sufixMatch[2]  + '/index.html';

	console.log('Getting file on S3 with path: '+s3Key);

	const s3 = new AWS.S3({ region: region });
	return s3
		.makeUnauthenticatedRequest('getObject', { Bucket: bucket, Key: s3Key })
		.promise()
		.then(successResponse)
		.catch(err => {
			console.error('Error from S3: '+JSON.stringify(err));
			console.error('Region:'+region+' Bucket:'+bucket+" Key:"+s3Key);
			return notFoundResponse();
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

function successResponse(s3Data) {
	return {
			statusCode: 200,
			multiValueHeaders: { // if multivalue headers are enabled for alb
				'Content-Type': [ s3Data.ContentType ]
			},
			headers: { // if multivalue headers are disabled for alb
				'Content-Type': s3Data.ContentType,
			},
			body: Buffer.from(s3Data.Body).toString(),
			isBase64Encoded: false
		};
}