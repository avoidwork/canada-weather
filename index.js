'use strict';

const fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    haro = require('haro'),
    utility = require(path.join(__dirname, 'utility.js')),
    commandLineArgs = require('command-line-args');

let cli = commandLineArgs([{
        name: 'city',
        alias: 'c',
        type: String,
        defaultValue: 'on-118_e'
    },
    {
        name: 'directory',
        alias: 'd',
        type: String,
        defaultValue: path.join(__dirname, 'data')
    }]),
    options = cli.parse(),
    sites = haro(null, {id: 'sites', key: 'code', index:['nameEn'], versioning: false});

// Handling relative paths
options.directory = path.resolve(options.directory);

// Ensuring target directory exists
mkdirp.sync(options.directory);

// Loading sites, finding code & retrieving data
utility.sites().then(data => {
    return sites.batch(data, 'set');
}).then(() => {
    let regex = new RegExp('^' + options.city, 'i'),
        site = sites.search(regex)[0][1];

    return utility.retrieve(site.code, site.provinceCode, options.directory);
}).then(() => {
    process.exit(0);
}).catch(() => {
    process.exit(1);
});
