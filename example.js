var tinycloud = require('./index.js')

var options = {
  dry: false,
  image: 'ami-d05e75b8',
  type: 'm3.medium',
  cluster: 'voltron',
  ports: [22, 80],
  size: 8,
  key: 'mykey'
}

var groups = [
  {tag: 'master', count: 1},
  {tag: 'worker', count: 1}
]

var cloud = new tinycloud(options, groups)

cloud.launch(function (err, data) {
  if (err) console.log(err)
  if (data) console.log(data)
})
