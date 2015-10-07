var aws = require('aws-sdk');

module.exports = function() {

	aws.config.update({
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		region: 'us-east-1'
	});

	return new aws.EC2();

}