var tinycloud = require('./index.js')
var _ = require('lodash')

var options = {
  dry: false,
  image: 'ami-d05e75b8',
  type: 'm3.medium',
  cluster: 'mycloud',
  ports: [22, 80],
  key: 'voltron'
}

var groups = [
  {tag: 'master', count: 1},
  {tag: 'worker', count: 1}
]

var cloud = new tinycloud(options, groups)

// cloud.on('progress', function(data) {
//   console.log(data)
// })

// cloud.on('success', function(data) {
//   console.log(data)
// })

// cloud.on('ready', function() {
//   console.log('Cluster ready')
// })

// cloud.destroy(function(err, data) {
//   if (err) console.log(err)
//   if (data) console.log(data)
// })


// cloud.list(function(err, data) {
//  console.log(data)
// })

// command line methods:

// launch -> setup, create
// destroy
// 