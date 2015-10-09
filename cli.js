#! /usr/bin/env node

var minimist = require('minimist')
var cliclopts = require('cliclopts')
var chalk = require('chalk')
var allowed = require('lib/options.js')
var tinycloud = require('./index.js')
var _ = require('lodash')

var opts = cliclopts(allowed)
var args = minimist(process.argv.slice(2), opts.options())
var action = args._[0]
var cluster = args._[1]

if (args.help || !action || !cluster) {
  console.log('Usage: tinycloud <action> <cluster> [options]')
  opts.print()
  process.exit()
}

args.cluster = cluster

var groups = [
  {tag: 'master', count: 1},
  {tag: 'worker', count: args.count}
]

var prefix = chalk.gray('[' + action + '] ')
var tab = '-- '
var cloud = new tinycloud(args, groups)

cloud.on('progress', function(data) {
  console.log(prefix + data)
})

cloud.on('success', function(data) {
  console.log(prefix + chalk.green(data))
})

cloud.on('error', function(data) {
  console.log(prefix + chalk.red(data))
})

var actions = ['launch', 'destroy', 'login', 'list']
if (_.indexOf(actions, action) < 0) {
  console.log(prefix + chalk.red('Error: action not recognized'))
  console.log(prefix + 'Options are: ' + _.map(
    actions.toString().split(','), function(s) {return chalk.blue(s)}).join(', '))
}

if (action == 'launch') {
  if (!args.key) {
    console.log(prefix + chalk.red('Error: must provide key for launch'))
    process.exit()
  }
  cloud.launch(function(err, data) {
    if (err) console.log(prefix + chalk.red(err))
  })
}

if (action == 'destroy') {
  cloud.destroy(function(err, data) {
    if (err) console.log(prefix + chalk.red(err))
  })
}

if (action == 'login') {
  var tag = args._[2]
  var id = args._[3]
  cloud.login(tag, id, function(err, data) {
    if (err) console.log(prefix + chalk.red(err))
  })
}

if (action == 'list') {
  var tag = args._[2]
  cloud.list(tag, function(err, data) {
    if (err) return console.log(prefix + chalk.red(err))
    if (data.length === 0) return console.log(prefix + chalk.red('No instances found'))
    console.log(prefix + 'Found ' + data.length + ' instances')
    _.forEach(data, function (instance) {
      console.log(prefix + chalk.blue(instance.id))
      console.log(prefix + tab + instance.group.replace(args.cluster + '-', ''))
      if (instance.state === 'running') {
        console.log(prefix + tab + chalk.green(instance.state))
      } else {
        console.log(prefix + tab + chalk.yellow(instance.state))
      }
      
    })
  })
}
