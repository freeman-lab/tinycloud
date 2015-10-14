var aws = require('aws-sdk')

module.exports = function () {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Must set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY')
  }

  aws.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1'
  })

  return new aws.EC2()
}
