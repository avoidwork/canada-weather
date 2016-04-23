'use strict';

const fs = require('fs'),
    mkdirp = require('mkdirp'),
    defer = require('tiny-defer'),
    path = require('path'),
    xml = require('nodexml'),
    commandLineArgs = require('command-line-args'),
    request = require('request'),
    urls = [
        ['alerts', 'https://weather.gc.ca/rss/warning/{{city}}.xml'],
        ['weather', 'https://weather.gc.ca/rss/city/{{city}}.xml']
    ];

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
    options = cli.parse();

function filename (arg) {
    return path.join(options.directory, arg);
}

// Handling relative paths
options.directory = path.resolve(options.directory);

// Ensuring target directory exists
mkdirp.sync(options.directory);

// Getting the data, parsing & saving
Promise.all(urls.map((items, idx) => {
    let deferred = defer();

    request(items[1].replace('{{city}}', options.city), (err, res, body) => {
        let data;

        if (err) {
            deferred.reject(err);
        } else {
            data = xml.xml2obj(body).feed;

            // Filtering alerts out of conditions
            if (idx > 0) {
                data.entry = data.entry.filter(entry => {
                    return entry.category.term !== 'Warnings and Watches';
                });
            }

            deferred.resolve({
                title: data.title,
                updated: data.updated,
                data: data.entry
            });
        }
    });

    return deferred.promise;
})).then(args => {
    let deferred = defer(),
        deferreds = [];

    args.forEach((arg, idx) => {
        let deferred2 = defer();

        deferreds.push(deferred2);
        fs.writeFile(filename(urls[idx][0] + '.json'), JSON.stringify(arg, null, 0), 'utf8', err => {
            if (err) {
                deferred2.reject(err);
            } else {
                deferred2.resolve(arg);
            }
        });
    });

    Promise.all(deferreds).then(deferred.resolve).catch(deferred.reject);

    return deferred.promise;
}).then(() => {
    console.log('Saved weather data to ' + options.directory);
}).catch(e => {
    console.error('Failed to retrieve weather data:\n' + e.stack);
});
