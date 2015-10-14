#! /usr/bin/env node

var Clicloud = require('clicloud')
var Tinycloud = require('./index.js')

var opts = {
  name: 'tinycloud'
}

var cli = new Clicloud(opts)

var args = cli.parse(process.argv)

var groups = [
  {tag: 'master', count: 1},
  {tag: 'worker', count: args.count}
]

var cloud = new Tinycloud(args, groups)

cli.init(args, cloud)
