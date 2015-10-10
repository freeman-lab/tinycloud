# tinycloud

Minimal module for launching compute clusters with node.js. Lets you spin up a cluster on Amazon EC2, monitor its status, and login to its nodes. Use and extend as a module, or use as a CLI with the help of `clicloud`.

There are already a couple great modules for cloud deployments, like kirby and pkgcloud, but they tend to be either very specific (targeting single nodes) or very broad (supporting compute, storage, etc.). `tinycloud` is just enough to make and play with a cluster.

## install

Install as a command-line tool

```
npm install tinycloud -g
```

Or as a module in your project

```
npm install tinycloud --save
```

## basic usage

You can use as a CLI to launch and monitor your cluster. First make sure to set the environmental variables `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. To create a cluster you just need to give it a name and the name of key pair, and you can specify things like the number of worker nodes

```
tinycloud launch mycluster -k mykey -n 5
```

Once launched, you can list all instances

```
tinycloud list mycluster
```

And login to your nodes by specifying the group and optionally the number

```
tinycloud login mycluster master -i mykey.pem
```
```
tinycloud login mycluster worker 0 -i mykey.pem
```
```
tinycloud login mycluster worker 1 -i mykey.pem
```

Show down your cluster with

```
tinycloud destroy mycluster
```

If you want to test the launch procedure without actually creating instances use

```
tinycloud launch -d
```

See all options with

```
tinycloud --help
```


## advanced usage