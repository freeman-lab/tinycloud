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
var tag = args._[2]
var id = args._[3]

if (args.help || !action || !cluster) {
  console.log('Usage: tinycloud <action> <cluster> [options]')
  opts.print()
  process.exit()
}

var actions = ['launch', 'destroy', 'login', 'list']
if (_.indexOf(actions, action) < 0) {
  console.log(prefix + chalk.red('Action not recognized'))
  console.log(prefix + 'Options are: ' + _.map(
    actions.toString().split(','), function(s) {return chalk.blue(s)}).join(', '))
}

args.cluster = cluster

var groups = [
  {tag: 'master', count: 1},
  {tag: 'worker', count: args.count}
]

var prefix = chalk.gray('[' + action + '] ')
var showerror = function(err, data) {if (err) console.log(prefix + chalk.red(err))}
var tab = '-- '

var cloud = new tinycloud(args, groups)

cloud.on('progress', function(data) {
  console.log(prefix + data)
})

cloud.on('success', function(data) {
  console.log(prefix + chalk.green(data))
})

if (action == 'launch') {
  if (!args.key) {
    console.log(prefix + chalk.red('Error: must provide key for launch'))
    process.exit()
  }
  cloud.launch(showerror)
}

if (action == 'destroy') {
  cloud.destroy(showerror)
}

if (action == 'login') {
  cloud.login(tag, id, args.keyfile, showerror)
}

if (action == 'list') {
  cloud.summarize(tag, function(err, data) {
    if (err) return console.log(prefix + chalk.red(err))
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
