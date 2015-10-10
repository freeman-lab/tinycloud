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

You can use as a CLI to launch and monitor your cluster. First make sure to set the environmental variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. To create a cluster you just need to give it a name and the name of key pair, and you can specify things like the number of worker nodes

```
tinycloud launch voltron -k mykey -n 5
```

Once launched, you can list all instances

```
tinycloud list voltron
```

And login to your nodes by specifying the group and optionally the number

```
tinycloud login voltron voltron.pem
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