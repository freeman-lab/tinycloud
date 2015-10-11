#! /usr/bin/env node

var clicloud = require('clicloud')
var tinycloud = require('./index.js')

var opts = {
  name: 'tinycloud'
}

var cli = new clicloud(opts)

var args = cli.parse(process.argv)

var groups = [
  {tag: 'master', count: 1},
  {tag: 'worker', count: args.count}
]

var cloud = new tinycloud(args, groups)

cli.init(args, cloud)
