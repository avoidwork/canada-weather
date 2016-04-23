# Canada Weather Scraper
Retrieves data from the Government of Canada Open Data Weather API & writes JSON data to disk, allowing for file watchers to pick up the data.

This scraper will create `alerts.json` & `weather.json` in a target directory asynchronously.

## Arguments
#### city / c (`Ottawa`)
Environment Canada city ID, defaults to `Ottawa`.

#### directory / d (`./data`)
Directory to write data to.

## Example
```console
$ node index.js -d ~/Desktop
```

## Requirements
Requires node.js with ES6 syntax support (^4.x.x).
