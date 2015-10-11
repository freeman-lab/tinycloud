# tinycloud

Minimal module for launching compute clusters with `node.js`. Lets you spin up a cluster on Amazon EC2, monitor its status, and login to its nodes. Use and extend as a module, or use as a CLI with the help of [`clicloud`](https://github.com/freeman-lab/clicloud).

There are already a couple great modules for cloud deployments, like [`kirby`](https://github.com/mafintosh/kirby) and [`pkgcloud`](https://github.com/pkgcloud/pkgcloud), but they are either very specific (targeting single nodes) or very broad (supporting compute, storage, etc.). `tinycloud` is just enough to make and play with a cluster!

NOTE: This module launches clusters, which can cost real money. It is also still under development. Carefully monitor your AWS usage!

BONUS: `tinycloud` is a [cat](http://warriors.wikia.com/wiki/Tinycloud) from the Warriors series

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
var tinycloud = require('tiny-cloud')

var options = {
  dry: false, // do a dry run
  image: 'ami-d05e75b8', // amazon image
  type: 'm3.medium', // machine instance type
  cluster: 'voltron', // name of cluster
  ports: [22, 80], // ports to open
  key: 'mykey' // name of
}

var groups = [
  {tag: 'master', count: 1},
  {tag: 'worker', count: 1}
]

var cloud = new tinycloud(options, groups)

cloud.launch( function(err, data) {
  if (err) console.log(err)
  if (data) console.log(data)
})
```

## API

#### `cloud = tinycloud(options, groups)`

Create a new `cloud`

**options**

- `dry` do a dry run
- `image` amazon image
- `type` machine instance type
- `cluster` name of cluster
- `ports` ports to open
- `key` name of key file

**groups**

each corresponds to one or more tagged collections of instances
```
[
  {tag: 'master', count: 1},
  {tag: 'scheduler', count: 1},
  {tag: 'worker', count: 10}
]
```

#### `cloud.launch([cb])`

Launch a cluster. 

If provided, `cb` will be called with `cb(error, data)`. If succesful, `data` will be a list of instance reservations (one per requested group). 

#### `cloud.destroy([cb])`

Terminate a cluster. 

If provided, `cb` will be called with `cb(error, data)`. If successful, `data` will be a list of terminated instances.

#### `cloud.list([tag], cb)`

List instances associated with a cluster. 

If provided, `tag` will restrict the list to only those instances belonging to the group with that tag, e.g. `master` or `worker`. 

`cb` will be called with `cb(error, data)`. If successful, `data` will be a list of instances.

#### `cloud.login([tag], [ind], keyfile, cmd, [cb])`

Login to a single instance associated with a cluster. 

If provided, `tag` will specify instances belonging to the specified group. If not provided, will use the first group. 

If provided, `ind` will specify the `ind`th instance belonging to the specified group. If not provided, will use the first instance.

Must provide a `keyfile` for authentication.

`cb` will be called with `cb(error)`.

#### `cloud.execute([tag], [ind], keyfile, [cb])`

Execute a command on one or more instances assocaited with a cluster.

If provided, `tag` will specify instances belonging to the specified group. If not provided, will use all groups.

If provided, `ind` will specify the `ind`th instance belonging to the specified group. If not provided, will use all instances.

Must provide a `cmd` with the string to execute on the instances.

Must provide a `keyfile` for authentication.

`cb` will be called with `cb(error)`.
