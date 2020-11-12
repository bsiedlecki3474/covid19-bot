## COVID-19 BOT

Another COVID-19 BOT, yet simple to use.

Shows global & country specific data.

## Configuration
Edit `config.json` file
```json
{
    "version": "1.0",
    "dataSrc": "https://opendata.ecdc.europa.eu/covid19/casedistribution/json/",
    "token": "insert your token",
    "adminRoleId": "insert default admin role id",
    "prefix": "covid",
    "cc": "POL",
    "refreshTime": 30,
    "messageTime": "12:00",
    "messageChannelId": "insert default message channel id",
    "botStatus": {
        "type": "idle",
        "name":"world collapse :(",
        "activity": "WATCHING"
    },

    "debug": false
}
```

## Installation
```bash
git clone https://github.com/bsiedlecki3474/covid19-bot.git
cd covid19-bot
npm install

node index.js
```

# Usage
`covid` | `covid.help` list of all commands

`covid.prefix` | `covid.prefix.show` show current prefix.

`covid.prefix.change(newprefix)` change current prefix to newprefix. [Admin role]

`covid.access` show additional priviledges role. [Admin role]

`covid.access.change(newrole)` change current additional priviledges role to newrole. [Admin role]

`covid.cc` show current country code.

`covid.cc.list` | `covid.ccs` | `covid.countrycodes` list of country codes.

`covid.cc.change` change country code. [Admin role]

`covid.messagetime` | `covid.messagetime.show` show current message time.

`covid.messagetime.change(newtime)` change message time to newtime. [Admin role]

`covid.today(countryCode = selected country)` today\'s statistics (optionally in selected country).

`covid.on(\"yyyy-mm-dd\", countryCode = selected country)` statistics for \"yyyy-mm-dd\" (optionally in selected country).

`covid.in(countryCode = selected country)` overall statistics for selected country.

`covid.all` overall statistics.

`covid.reload` reloads api data [Admin role]


## License
[MIT](https://choosealicense.com/licenses/mit/)
