module.exports = [
  {
    name: 'dry',
    abbr: 'd',
    boolean: true,
    help: 'Whether to execute a dry run'
  },
  {
    name: 'count',
    abbr: 'n',
    default: 1,
    help: 'Number of workers'
  },
  {
    name: 'key',
    abbr: 'k',
    help: 'Name of key pair'
  },
  {
    name: 'keyfile',
    abbr: 'f',
    help: 'Location of key pair .pem file'
  },
  {
    name: 'type',
    abbr: 't',
    default: 'm3.medium',
    help: 'Type of instance'
  },
  {
  	name: 'image',
  	abbr: 'i',
  	default: 'ami-d05e75b8',
  	help: 'Image type to use'
  },
  {
    name: 'ports',
    abbr: 'p',
    default: [22, 80],
    help: 'Ports to open'
  },
  {
    name: 'help',
    abbr: 'h',
    help: 'show help',
    boolean: true
  }
]