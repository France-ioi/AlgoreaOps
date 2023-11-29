const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

var cachedResponseS3Key = undefined;
var cachedResponse = undefined;

exports.handler = async function(event, context) {

	const debug = process.env.DEBUG && process.env.DEBUG !== '0';
	const noCache = process.env.NO_CACHE && process.env.NO_CACHE !== '0';
	const region = process.env.S3_REGION;
	const bucket = process.env.S3_BUCKET;
	const prefix = process.env.S3_PREFIX || '';
	const path = decodeURI(event.path);

	if (debug) console.debug('event: '+JSON.stringify(event));

	if (noCache) {
		console.log('Clearing cache...')
		cachedResponse = undefined;
		cachedResponseS3Key = undefined;
	}

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
		return notFoundResponse();
	}
	const s3Key = prefix + (sufixMatch[1] || '') + sufixMatch[2] + '/index.html';

	if (cachedResponse && cachedResponseS3Key === s3Key) {
		console.log('Returning cached response');
		return successResponse(cachedResponse);
	}

	console.log('Getting file on S3 with path: '+s3Key);

	const s3Client = new S3Client({ region: region });
	try {
		const command = new GetObjectCommand({ Bucket: bucket, Key: s3Key });
		const data = await s3Client.send(command);
		const resp = await data.Body.transformToString();
		cachedResponse = resp;
		cachedResponseS3Key = s3Key;
		return successResponse(resp);
	} catch(err) {
		console.error('Error while fetching from S3: '+ JSON.stringify(err)+'  ['+ err.message +'] (Region:'+region+' Bucket:'+bucket+' Key:'+s3Key+')');
		return notFoundResponse();
	}
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

function successResponse(resp) {
	return {
			statusCode: 200,
			multiValueHeaders: { // if multivalue headers are enabled for alb
				'Content-Type': [ 'text/html' ]
			},
			headers: { // if multivalue headers are disabled for alb
				'Content-Type': 'text/html',
			},
			body: resp,
			isBase64Encoded: false
		};
}
