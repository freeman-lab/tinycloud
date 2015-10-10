var async = require('async')
var aws = require('aws-sdk')
var child = require('child_process');
var fs = require('fs')
var _ = require('lodash')
var util = require('util')
var events = require('events')
var client = require('./lib/client.js')
var noop = function () {}

util.inherits(Cluster, events.EventEmitter)

function Cluster(options, groups) {
	var options = options || {}
  var self = this
  events.EventEmitter.call(self)

	this.count = options.count
	this.cluster = options.cluster
  this.ports = options.ports
  this.tags = _.map(groups, function(g) {return g.tag})
  this.groupnames = _.map(groups, function(g) {return options.cluster + '-' + g.tag})

  var specs = _.map(groups, function (group) {
    return {
      DryRun: options.dry,
      ImageId: options.image,
      InstanceType: options.type,
      KeyName: options.key,
      MinCount: group.count,
      MaxCount: group.count,
      SecurityGroupIds: [options.cluster + '-' + group.tag]
    }
  })

  this.specs = specs
	this.client = client()

	return this
}

// launch a cluster

Cluster.prototype.launch = function(cb) {
  if (!cb) cb = noop

  var self = this

  async.series([
    this.check.bind(this),
    this.configure.bind(this),
    this.authorize.bind(this),
    this.create.bind(this)
  ], function (err, data) {
      if (err) return cb(err)
      self.emit('ready')
      cb(null, data[data.length-1])
  })

}

// create cluster instances

Cluster.prototype.create = function(cb) {

	var self = this
  self.emit('progress', 'Creating cluster instances')

  var tasks = _.map(self.specs, function(spec) {

    return function (next) {

      async.waterfall([

        function (flow) {
          self.client.runInstances(spec, function (err, reserved) {
            if (err) return flow(err)
            flow(null, reserved)
          })
        },

        function (reserved, flow) {
          var params = {
            Resources: _.map(reserved.Instances, function(i) {return i.InstanceId}), 
            Tags: [{Key: 'Name', Value: reserved.Instances[0].SecurityGroups[0].GroupName}]
          }
          self.client.createTags(params, function (err, data) {
            if (err) return flow(err)
            flow(null, reserved)
          })
        }

      ], function (err, reserved) {
        if (err) return next(err)
        next(null, reserved)
      })
    }

  })

  async.parallel(tasks, function(err, data) {
    if (err) return cb(err)
    self.emit('success', 'Instances created')
    cb(null, data)  
  })

}

// configure security groups

Cluster.prototype.configure = function(cb) {

  var self = this
  self.emit('progress', 'Creating security groups')

  async.each(self.groupnames, 

    function (group, next) {
      var params = {
        Description: group, 
        GroupName: group
      }
      self.client.createSecurityGroup(params, function (err, data) {
        if (!err || err.code === "InvalidGroup.Duplicate") return next()
        next(err)
      })
    }, 

    function (err) {
      if (err) {
        return cb(err)
      }
      self.emit('success', 'Security groups created')
      cb(null, self.groupnames)
    }
  )

}

// authorize security groups

Cluster.prototype.authorize = function(cb) {

  var self = this
  self.emit('progress', 'Setting authorization on security groups')

  async.each(self.groupnames, 

    function (group, next) {
      var params = {
        GroupName: group,
        IpPermissions: _.map(self.ports, function(port) {
          return {
            IpProtocol: 'tcp',
            FromPort: port,
            ToPort: port,
            IpRanges: [{CidrIp: '0.0.0.0/0'}]
          }
        })
      }
      self.client.authorizeSecurityGroupIngress(params, function (err, data) {
        if (!err || err.code === 'InvalidPermission.Duplicate') return next()
        next(err)
      })
    },

    function (err) {
      if (err) return cb(err)
      self.emit('success', 'Authorization set')
      cb(null, self.groupnames)
    }
  )

}

// destroy cluster

Cluster.prototype.destroy = function(cb) {
  if (!cb) cb = noop

  var self = this
  self.emit('progress', 'Shutting down cluster')
  this.list(null, function(err, instances) {

    if (err) return cb(err)
    if (instances.length === 0) return cb(new Error('no instances to destroy'))

    var ids = _.map(instances, function (instance) { return instance.id})
    self.client.terminateInstances({InstanceIds: ids}, function(err, data) {
      if (err) return cb(err)
      self.emit('success', 'Terminated ' + ids.length + ' instances')
      cb(null, instances)
    })
  })

}

// list instances associated with tags

Cluster.prototype.list = function(tag, cb) {

  var self = this

  if (tag && _.indexOf(self.tags, tag) < 0) return cb(new Error('No instances found for ' + tag))
  var target = tag ? [self.cluster + '-' + tag] : self.groupnames

  var filt = {Filters: [
    {Name: 'group-name', Values: target}, 
    {Name: 'instance-state-name', Values: ['running', 'pending']}]
  }

  this.client.describeInstances(filt, function(err, data) {
    if (err) return cb(err)
    var instances = _.flatten(_.map(data.Reservations, function (reservation) {
      return _.map(reservation.Instances, function(instance) {
        return {
          id: instance.InstanceId,
          group: instance.SecurityGroups[0].GroupName, 
          privateip: instance.PrivateIpAddress, 
          publicip: instance.PublicIpAddress, 
          publicdns: instance.PublicDnsName,
          state: instance.State.Name
        }
      })
    }))
    cb(null, instances)
  });

}

// summarize a cluster (error if no instances found)

Cluster.prototype.summarize = function(tag, cb) {
  if (!cb) cb = noop

  var self = this
  self.emit('progress', 'Retrieving cluster info')

  this.list(tag, function(err, data) {
    if (err) return cb(err)
    if (data.length == 0) return cb(new Error('No instances found'))
    self.emit('progress', 'Found ' + data.length + ' instances')
    cb(null, data)
  })

}

// login to an instance associated with a tag

Cluster.prototype.login = function(tag, ind, keyfile, cb) {
  if (!cb) cb = noop

  var self = this
  var tag = tag || self.tags[0]
  var ind = ind || 0
  if (!keyfile) return cb(new Error('No identity keyfile provided'))
  self.emit('progress', 'Logging into cluster')

  this.list(tag, function(err, instances) {

    if (err) return cb(err)
    if (instances.length === 0) return cb(new Error('No instances found'))
    if (!instances[ind]) return cb(new Error('Cannot find instance'))
    var target = instances[ind]
    var opts = {
      host: target.publicdns,
      username: 'ubuntu',
      privateKey: fs.readFileSync(keyfile)
    }

    self.emit('progress', 'Opening connection to ' + target.id + ' (' + tag + ')')

    var Client = require('ssh2').Client

    var conn = new Client();
    conn.on('error', function(err) {
      return cb(err)
    })
    conn.on('ready', function() {
      conn.shell(function(err, stream) {
        if (err) return cb(err)
        process.stdin.setRawMode(true)
        process.stdin.resume()
        process.stdin.pipe(stream.stdin)
        stream.pipe(process.stdout)
        stream.on('close', function(code, signal) {
          console.log('farewell...')
          conn.end()
          process.exit()
        })
      });
    }).connect(opts, function(err) {
      if (err) return cb(err)
    });

  })

}

// check if instances for a cluster already exist

Cluster.prototype.check = function(cb) {

  var self = this
  self.emit('progress', 'Checking for existing instances')

  this.list(null, function (err, data) {
    var n = data.length
    if (err) return cb(err)
    if (n > 0) {
      return cb(new Error('Instances already exist'))
    }
    self.emit('success', 'No existing instances found')
    cb(null)
  })

}

module.exports = Cluster