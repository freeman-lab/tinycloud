# tinycloud

[![Build Status](https://travis-ci.org/freeman-lab/tinycloud.svg?branch=master)](https://travis-ci.org/freeman-lab/tinycloud)
[![NPM](https://nodei.co/npm/tinycloud.png)](https://npmjs.org/package/tinycloud?compact=true)

Minimal module for launching compute clusters with `node.js`. Lets you spin up a cluster on Amazon EC2, monitor its status, and login to its nodes. Use and extend as a module, or use as a CLI with the help of [`clicloud`](https://github.com/freeman-lab/clicloud).

There are already a couple great modules for cloud deployments, like [`kirby`](https://github.com/mafintosh/kirby) and [`pkgcloud`](https://github.com/pkgcloud/pkgcloud), but they are either very specific (targeting single nodes) or very broad (supporting compute, storage, etc.). `tinycloud` is just enough to make and play with a cluster!

*Note*: This module launches clusters, which can cost real money. It is also still under development. Carefully monitor your usage!

[mascot](http://warriors.wikia.com/wiki/Tinycloud)

## install

Install as a command-line tool

```
npm install tinycloud -g
```

Or as a module in your project

```
npm install tinycloud --save
```

## use as a cli

You can use as a CLI to launch and monitor your cluster. First make sure to set the environmental variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. To create a cluster you just need to give it a name (we'll call it `voltron`) and the name of key pair (we'll call it `mykey`)

```
tinycloud launch voltron -k mykey
```

To make a bigger cluster, just add more workers

```
tinycloud launch voltron -k mykey -n 5
```

Once launched, you can list all instances

```
tinycloud list voltron
```

And login to your nodes with the help of [`ssh2`](https://github.com/mscdex/ssh2) by providing a identity key file

```
tinycloud login voltron -i mykey.pem
```

By default you'll log into the master. You can also specify a group and/or instance number

```
tinycloud login voltron master -i mykey.pem
```
```
tinycloud login voltron worker 4 -i mykey.pem
```

Shut down your cluster with

```
tinycloud destroy voltron
```

If you want to test the launch process without creating instances use a dry run

```
tinycloud launch -d
```


See all options with

```
tinycloud --help
```

## use as a module

Example launching a cluster with 1 master and 1 worker

``` js
var Tinycloud = require('tinycloud')
var AWS = require('tinycloud-aws')

var awsMedium = new AWS({
  dry: false, // do a dry run
  image: 'ami-d05e75b8', // amazon image
  type: 'm3.medium', // machine instance type
  cluster: 'voltron', // name of cluster
  ports: [22, 80], // ports to open
  key: 'mykey' // aws keypair keyname
})

var groups = [
  {tag: 'primary', count: 1, driver: awsMedium},
  {tag: 'worker', count: 1, driver: awsMedium}
]

var cloud = new Tinycloud(groups)

cloud.launch(function (err, data) {
  if (err) console.log(err)
  if (data) console.log(data)
})
```

## API

#### `cloud = tinycloud(groups)`

Create a new `cloud` controller instance based on your cluster group configuration.

`groups` should be an array of objects, one for each group type you want to define.

for example: `cloud = tinycloud([groupA, groupB, groupC])`

Each group should have these keys:

- **tag** - name of the group
- **count** - how many instances of this group should be launched
- **driver** - a tinycloud driver to use for instances in this group

#### `cloud.launch([cb])`

Launch a cluster. 

`cb` if provided will be called with `cb(error, data)`. If succesful, `data` will be a list of instance reservations (one per requested group). 

#### `cloud.destroy([cb])`

Terminate a cluster. All instances will be shut down and terminated (what 'terminated' actually means depends on your cloud provider).

`cb` if provided will be called with `cb(error, results)`. `results` will be an array with the status of each instance (whether it passed or failed)

TODO document `results` exactly

#### `cloud.list([tag], cb)`

List instances associated with a cluster. 

`tag` is optional and restricts the list to only those instances belonging to the group with that tag, e.g. `master` or `worker`. Default is to list all instances.

`cb` if provided will be called with `cb(error, data)`. If successful, `data` will be an array of instances.

#### `cloud.login([tag], [ind], keyfile, [cb])`

Login to a single instance associated with a cluster. 

`tag` specifies instances belonging to the specified group. If not provided, will use the first group. 

`ind` specifies `ind`th instance belonging to the specified group. If not provided, will use the first instance.

`keyfile` required for authentication.

`cb` if provided will be called with `cb(error)`.

#### `cloud.execute([tag], [ind], keyfile, cmd, [cb])`

Execute a command on one or more instances associated with a cluster.

`tag` specifies instances belonging to the specified group. If not provided, will use all groups.

`ind` specifies the `ind`th instance belonging to the specified group. If not provided, will use all instances.

`keyfile` required for authentication.

`cmd` is the string to execute on the instances.

`cb` if provided will be called with `cb(error)`.
