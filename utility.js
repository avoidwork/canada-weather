'use strict';

const fs = require('fs'),
    path = require('path'),
    defer = require('tiny-defer'),
    xml = require('nodexml'),
    request = require('request'),
    urls = {
        sites: 'http://dd.weather.gc.ca/citypage_weather/xml/siteList.xml',
        weather: 'http://dd.weather.gc.ca/citypage_weather/xml/{{province}}/{{code}}_e.xml'
    };

function write (file, data) {
    let deferred = defer();

    fs.writeFile(file, JSON.stringify(data, null, 0), 'utf8', err => {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

function sites () {
    const fpPath = path.join(__dirname, 'sites.json');
    let deferred = defer(),
        data;

    try {
        data = require(fpPath);
        deferred.resolve(data);
        console.log('Loaded site data \'' + fpPath + '\'');
    } catch (err) {
        console.warn(err.message);
        request(urls.sites, (err, res, body) => {
            let data;

            if (err) {
                deferred.reject(err);
            } else {
                data = xml.xml2obj(body).siteList.site.filter(i => {
                    let o = i;

                    delete o['@'];

                    return o;
                });

                write(fpPath, data).then(() => {
                    deferred.resolve(data);
                    console.log('Saved site data \'' + fpPath + '\'');
                }).catch(err => {
                    deferred.reject(err);
                    console.error('Failed to save site data:\n' + err.stack);
                });
            }
        });
    }

    return deferred.promise;
}

function retrieve (code, province, directory) {
    let deferred = defer(),
        url = urls.weather.replace("{{code}}", code).replace("{{province}}", province);

    request(url, (err, res, body) => {
        let alerts = {},
            weather = {},
            data, deferreds;

        if (err) {
            deferred.reject(err);
        } else {
            deferreds = [];
            data = xml.xml2obj(body).siteData;

            alerts.datetime = data.dateTime[0].textSummary;
            alerts.timestamp = data.dateTime[0].timeStamp;
            alerts.data = data.warnings || null;

            weather.datetime = data.dateTime[0].textSummary;
            weather.timestamp = data.dateTime[0].timeStamp;
            weather.data = {
                location: {
                    continent: data.location.continent,
                    country: data.location.country['@text'],
                    countryCode: data.location.country.code,
                    name: data.location.name['@text'],
                    lat: data.location.name.lat,
                    lon: data.location.name.lon,
                    province: data.location.province['@text'],
                    provinceCode: data.location.province.code,
                    region: data.location.region
                },
                currentConditions: {
                    condition: data.currentConditions.condition,
                    datetime: data.currentConditions.dateTime[0].textSummary,
                    timestamp: data.currentConditions.dateTime[0].timeStamp,
                    dewpoint: {
                        value: data.currentConditions.dewpoint['@text'],
                        unitType: data.currentConditions.dewpoint.unitType,
                        units: data.currentConditions.dewpoint.units
                    },
                    pressure: {
                        value: data.currentConditions.pressure['@text'],
                        change: data.currentConditions.pressure.change,
                        tendency: data.currentConditions.pressure.tendency,
                        unitType: data.currentConditions.pressure.unitType,
                        units: data.currentConditions.pressure.units
                    },
                    relativeHumidity: {
                        value: data.currentConditions.relativeHumidity['@text'],
                        units: data.currentConditions.relativeHumidity.units
                    },
                    station: {
                        value: data.currentConditions.station['@text'],
                        code: data.currentConditions.station.code,
                        lat: data.currentConditions.station.lat,
                        lon: data.currentConditions.station.lon
                    },
                    temperature: {
                        value: data.currentConditions.temperature['@text'],
                        unitType: data.currentConditions.temperature.unitType,
                        units: data.currentConditions.temperature.units
                    },
                    visibility: {
                        value: data.currentConditions.visibility['@text'],
                        unitType: data.currentConditions.visibility.unitType,
                        units: data.currentConditions.visibility.units
                    },
                    wind: {
                        bearing: {
                            value: data.currentConditions.wind.bearing['@text'],
                            units: data.currentConditions.wind.bearing.units
                        },
                        direction: data.currentConditions.wind.direction,
                        gust: {
                            value: data.currentConditions.wind.gust['@text'],
                            unitType: data.currentConditions.wind.gust.unitType,
                            units: data.currentConditions.wind.gust.units
                        },
                        speed: {
                            value: data.currentConditions.wind.speed['@text'],
                            unitType: data.currentConditions.wind.speed.unitType,
                            units: data.currentConditions.wind.speed.units
                        }
                    }
                },
                forecastGroup: {
                    datetime: data.forecastGroup.dateTime[0].textSummary,
                    timestamp: data.forecastGroup.dateTime[0].timeStamp,
                    forecast: [],
                    regionalNormals: {
                        temperature: [],
                        textSummary: data.forecastGroup.regionalNormals.textSummary
                    }
                }
            };

            data.forecastGroup.regionalNormals.temperature.forEach(i => {
                weather.data.forecastGroup.regionalNormals.temperature.push({
                    value: i['@text'],
                    'class': i['class'],
                    unitType: i.unitType,
                    units: i.units
                });
            });

            deferreds.push(write(path.join(directory, 'alerts.json'), alerts));
            deferreds.push(write(path.join(directory, 'weather.json'), weather));

            Promise.all(deferreds).then(deferred.resolve).catch(deferred.reject);
        }
    });

    return deferred.promise;
}

module.exports = {
    retrieve: retrieve,
    sites: sites
};
