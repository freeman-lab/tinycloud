var async = require('async')
var aws = require('aws-sdk')
var child = require('child_process');
var fs = require('fs')
var _ = require('lodash')
var client = require('./lib/client.js')

var Cluster = function(opts) {
	var opts = opts || {}

	this.workers = opts.workers
	this.name = opts.name
  this.key = opts.key
	this.groups = [this.name + '-master', this.name + '-worker']
  this.ports = opts.ports
	this.image = opts.image
  this.instance = opts.instance
  this.dry = opts.dry
  self = this

  var master = {
    DryRun: self.dry,
    ImageId: self.image,
    InstanceType: self.instance,
    KeyName: self.key,
    MinCount: 1
  }
  var worker = _.clone(master)

  master.MaxCount = 1
  master.SecurityGroupIds = [opts.name + '-master']

  worker.MaxCount = opts.workers
  worker.SecurityGroupIds = [opts.name + '-worker']

  this.specs = [master, worker]
	this.client = client()

	return this

}

Cluster.prototype.launch = function(cb) {

	var self = this

  function check(flow) {

    console.log('checking whether instances exist...')

    self.list(function (err, data) {
      if (err) return cb(err)
      if (data.length > 0) return cb('instances already exist')
      flow(null)
    })

  }

  function secure(flow) {

    console.log('setting up security groups...')

    async.each(self.groups, 

      function (group, next) {
        var params = {
          Description: group, 
          GroupName: group
        }
        self.client.createSecurityGroup(params, function (err, data) {
          if (!err) return next()
          if (err.code === "InvalidGroup.Duplicate") {
            console.log('security group ' + group + ' already exists, proceeding...')
            next()
          } else {
            next(err)
          }
        })
      }, 

      function (err) {
        if (err) return cb(err)
        flow(null)
      }
    )
  }

  function authorize(flow) {

    console.log('setting authorization for security groups...')

    async.each(self.groups, 

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
          if (!err) return next()
          if (err.code == 'InvalidPermission.Duplicate') {
            console.log('authorization already set, proceeding...')
            next()
          } else {
            next(err)
          }
        })
      },

      function (err) {
        if (err) return cb(err)
        flow(null)
      }
    )
  }

  function create(flow) {

    console.log('creating instances...')

    var tasks = _.map(self.specs, function(spec) {
      return function(next) {
        self.client.runInstances(spec, function (err, data) {
          if (err) return next(err)
          console.log('created instances ' + _.map(data.Instances, function(i) {return i.InstanceId}))
          next(null, data)
        })
      }
    })

    async.parallel(tasks, function (err, reservations) {
      if (err) return cb(err)
      flow(null, reservations)
    })

  }

  function tag(reservations, flow) {
    
    console.log('tagging instances...')

    var instances = _.flatten(_.map(reservations, function (reservation) {
      return reservation.Instances
    }))

    async.each(instances, 

      function (instance, next) {
        var params = {
          Resources: [instance.InstanceId], 
          Tags: [{Key: 'Name', Value: instance.SecurityGroups[0].GroupName}]
        }
        self.client.createTags(params, function (err, data) {
          if (err) return next(err)
          next()
        })
      }, 

      function (err) {
        if (err) return cb(err)
        flow(null)
      }

    )

  }

  async.waterfall([
    check,
    secure,
    authorize,
    create,
    tag
  ], function (err) {
      if (err) return cb(err)
  })

}

Cluster.prototype.destroy = function(cb) {

  this.list( function(err, instances) {

    if (err) return cb(err)
    if (instances.length === 0) return cb('no instances to destroy')

    var ids = _.map(instances, function (instance) { return instance.InstanceId})
    self.client.terminateInstances({InstanceIds: ids}, function(err, data) {
      if (err) return cb(err)
      console.log('instances terminated')
      cb(null, instances)
    })
  })

}

Cluster.prototype.list = function(cb) {

  var self = this

  var filt = {Filters: [
    {Name: 'group-name', Values: self.groups}, 
    {Name: 'instance-state-name', Values: ['running', 'pending']}]
  }

  self.client.describeInstances(filt, function(err, data) {
    if (err) return cb(err)
    var instances = _.flatten(_.map(data.Reservations, function (reservation) {
      return reservation.Instances
    }))
    cb(null, instances)
  });

}

Cluster.prototype.status = function(cb) {

  this.list( function(err, instances) {

    if (err) return cb(err)
    var status = _.map(instances, function (instance) { 
      return instance.State.Name
    })
    cb(null, status)

  })

}

Cluster.prototype.login = function(cb) {

  this.list (function(err, instances) {

    if (err) return cb(err)
    var master = _.find(instances, function (instance) {
      return instance.SecurityGroups[0].GroupName === self.groups[0]
    })
    var opts = {
      host: master.PublicDnsName,
      username: 'ubuntu',
      privateKey: fs.readFileSync('/Users/freemanj11/Dropbox/tokens/voltron.pem')
    }

    console.log('opening connection to master...')

    var Client = require('ssh2').Client;

    var conn = new Client();
    conn.on('ready', function() {
      conn.shell(function(err, stream) {
        if (err) throw err;
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
    }).connect(opts);

  })


}

Cluster.prototype.execute = function(cb) {



}

module.exports = Cluster