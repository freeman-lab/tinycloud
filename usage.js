var tinycloud = require('./index.js')
var _ = require('lodash')

options = {
	'dry': false,
	'workers': 1,
	'image': 'ami-d05e75b8',
	'instance': 'm3.medium',
	'name': 'mycloud',
	'ports': [22, 80],
	'key': 'voltron'
}

var cloud = new tinycloud(options)

cloud.login( function(err, data) {
	if (err) {
		console.log(err)
	} else {
		console.log(data)
	}
})

// cloud.list(function(err, data) {
// 	console.log(data)
// })

// command line methods:

// launch -> setup, create
// destroy
// 