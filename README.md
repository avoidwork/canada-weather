# Canada Weather Scraper
Retrieves data from the Government of Canada Open Data Weather API & writes JSON data to disk, allowing for file watchers to pick up the data.

This scraper will create `warnings.json` & `weather.json` in a target directory asynchronously.

## Arguments
#### city / c (`Ottawa`)
Name of a Canadian city.

#### directory / d (`./data`)
Directory to write data to.

#### uid / u
UID to run process as.

## Example
```console
$ node index.js -d ~/Desktop
```

## Requirements
Requires node.js with ES6 syntax support (^5.5.x).
