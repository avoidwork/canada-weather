'use strict';

const fs = require('fs'),
    mkdirp = require('mkdirp'),
    path = require('path'),
    haro = require('haro'),
    defer = require('tiny-defer'),
    utility = require(path.join(__dirname, 'utility.js')),
    commandLineArgs = require('command-line-args');

let cli = commandLineArgs([{
        name: 'city',
        alias: 'c',
        type: String,
        defaultValue: 'Ottawa'
    },
    {
        name: 'directory',
        alias: 'd',
        type: String,
        defaultValue: path.join(__dirname, 'data')
    },
    {
        name: 'uid',
        alias: 'u',
        type: Number
    }]),
    options = cli.parse(),
    sites = haro(null, {id: 'sites', key: 'code', index:['nameEn'], versioning: false});

// Dropping process if a uid is specified
if (options.uid) {
    process.setuid(options.uid);
}

// Handling relative paths
options.directory = path.resolve(options.directory);

// Ensuring target directory exists
mkdirp.sync(options.directory);

// Loading sites, finding site & retrieving data
utility.sites().then(data => {
    return sites.batch(data, 'set');
}).then(() => {
    let regex = new RegExp('^' + options.city, 'i'),
        results = sites.search(regex),
        deferred, site, output;

    if (results.length > 0) {
        site = results[0][1];
        output = utility.retrieve(site.code, site.provinceCode, options.directory);
    } else {
        deferred = defer();
        output = deferred.promise;
        deferred.reject(new Error('City not found'));
    }

    return output;
}).then(() => {
    console.log('Saved weather data to ' + options.directory);
    process.exit(0);
}).catch(err => {
    console.error('Failed to retrieve weather data:\n' + err.stack);
    process.exit(1);
});
