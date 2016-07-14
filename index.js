#!/usr/bin/env node

'use strict';

const mkdirp = require('mkdirp'),
    path = require('path'),
    haro = require('haro'),
    defer = require('tiny-defer'),
    utility = require(path.resolve(__dirname, 'lib', 'utility.js'));

let sites = haro(null, {id: 'sites', key: 'code', index:['nameEn'], versioning: false}),
    site;

// Ensuring target directory exists
mkdirp.sync(path.join(__dirname, 'data'));

// Loading sites, finding site & retrieving data
utility.sites().then(data => {
    return sites.batch(data, 'set');
}).then(() => {
    let regex = new RegExp('^' + options.city.replace(/[\-\[\]{}()*+?.,\\\/\^\$|#\s]/g, "\\$&"), 'i'),
        results = sites.toArray(sites.search(regex), false),
        deferred, output;

    if (results.length > 0) {
        site = results.shift();

        if (results.length > 0) {
            console.log('Multiple cities found, using: ' + site.nameEn);
            console.log('Other potential cities:');

            results.forEach(s => {
                console.log('- ' + s.nameEn);
            });
        }

        output = utility.retrieve(site.code, site.provinceCode, options.directory);
    } else {
        deferred = defer();
        output = deferred.promise;
        deferred.reject(new Error('City not found'));
    }

    return output;
}).then(() => {
    console.log('Saved weather data for ' + site.nameEn + ' \'' + options.directory + '\'');
    process.exit(0);
}).catch(err => {
    console.error('Failed to retrieve weather data:\n' + err.stack);
    process.exit(1);
});
