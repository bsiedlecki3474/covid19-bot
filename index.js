const Discord = require('discord.js')
const client = new Discord.Client()
const fetch = require('node-fetch')
const cfg = require('./config.json');

let cases = [];

getJson = async (url, callback = '') => {
    let response = await fetch(url);
    let json = response.json()

    let data = callback && typeof callback == "function"
        ? await json.then(res => callback(res))
        : json;

    return data
}

today = (channel, cc = '') => {
    let date = new Date()
    let day = String(date.getDate()).padStart(2, '0')
    let month = date.getMonth() + 1
    let year = date.getFullYear()
    let parsedDate = `${day}/${month}/${year}`
    let country = cc ? cc : cfg.cc

    let data = cases.filter(el => { return el.countryterritoryCode === country && el.dateRep === parsedDate; }).shift()

    let msg = data
        ? `**Today, ${data.dateRep} in ${data.countriesAndTerritories}:**\n\n*Cases:* ${data.cases}\n*Deaths:* ${data.deaths}`
        : `No data found for **${country}** in **${parsedDate}**.`

    return channel.send(msg)
}

all = channel => {
    const sumOfCases = cases.reduce((a, b) => a + (b.cases || 0), 0);
    const sumOfDeaths = cases.reduce((a, b) => a + (b.deaths || 0), 0);

    if (cfg.debug) console.log(cases);

    const msg = cases && sumOfCases && sumOfDeaths
        ? `**Stats worldwide:**\n\n*Cases:* ${sumOfCases}\n*Deaths:* ${sumOfDeaths}`
        : `Worldwide data couldn't have been retrieved.`

    return channel.send(msg)
}

client.on('ready', async () => {
    if (cfg.debug) console.log("Successfully logged: " + client.user.tag)
    client.user.setStatus(cfg.botStatus.type)
    client.user.setActivity(cfg.botStatus.name, { type: cfg.botStatus.activity })

    cases = await getJson(cfg.dataSrc, data => data.records)

    setInterval(() => {
        if (cfg.debug) {
            let date = new Date()
            let hour = String(date.getUTCHours()).padStart(2, '0')
            let minute = String(date.getUTCMinutes()).padStart(2, '0')
            let second = String(date.getUTCSeconds()).padStart(2, '0')
            let currentTime = `${hour}:${minute}:${second}`
            console.log(`Updated: ${currentTime} UTC`);
        }

        getJson(cfg.dataSrc);
    }, 1000 * 60 * cfg.refreshTime) // every cfg.refreshTime minutes

    setInterval(() => {
        let date = new Date()
        let hour = String(date.getUTCHours()).padStart(2, '0')
        let minute = String(date.getUTCMinutes()).padStart(2, '0')

        let currentTime = `${hour}:${minute}`

        if (currentTime === cfg.messageTime) {
            let channel = client.channels.cache.get(cfg.messageChannelId)
            today(channel).then(all(channel))
        }
    }, 1000 * 60) // every minute
})

client.on('message', message => {
    help = () => {
        let rolename = message.guild.roles.cache.get(cfg.adminRoleId).name

        let welcomeMessage = `Version: **${cfg.version}**\nAuthor: **emKay#9189**\n\nList of commands:\n\`\`\`ldif`
        welcomeMessage += `\n${cfg.prefix}.prefix | ${cfg.prefix}.prefix.show: show current prefix.`
        if (message.member.roles.cache.has(cfg.adminRoleId)) {
            welcomeMessage += `\n${cfg.prefix}.prefix.change(newprefix): change current prefix to newprefix. [${rolename}]`
            welcomeMessage += `\n${cfg.prefix}.access: show additional priviledges role. [${rolename}]`
            welcomeMessage += `\n${cfg.prefix}.access.change(newrole): change current additional priviledges role to newrole. [${rolename}]`
        }

        welcomeMessage += `\n${cfg.prefix}.cc: show current country code.`
        welcomeMessage += `\n${cfg.prefix}.cc.list | ${cfg.prefix}.ccs | ${cfg.prefix}.countrycodes: list of country codes.`
        if (message.member.roles.cache.has(cfg.adminRoleId))
            welcomeMessage += `\n${cfg.prefix}.cc.change: change country code. [${rolename}]`

        welcomeMessage += `\n${cfg.prefix}.messagetime | ${cfg.prefix}.messagetime.show: show current message time.`
        if (message.member.roles.cache.has(cfg.adminRoleId))
            welcomeMessage += `\n${cfg.prefix}.messagetime.change(newtime): change message time to newtime. [${rolename}]`

        welcomeMessage += `\n${cfg.prefix}.today(countryCode = ${cfg.cc}): today\'s statistics (optionally in ${cfg.cc}).`
        welcomeMessage += `\n${cfg.prefix}.on(\"yyyy-mm-dd\", countryCode = ${cfg.cc}): statistics for \"yyyy-mm-dd\" (optionally in ${cfg.cc}).`
        welcomeMessage += `\n${cfg.prefix}.in(countryCode = ${cfg.cc}): overall statistics for ${cfg.cc}.`
        welcomeMessage += `\n${cfg.prefix}.all: overall statistics.`
        if (message.member.roles.cache.has(cfg.adminRoleId))
            welcomeMessage += `\n${cfg.prefix}.reload: reloads api data. [${rolename}]\`\`\``
    
        message.channel.send(welcomeMessage)
    }

    ccList = () => {
        if (cases) {
            const codes = [...new Set(cases.map(el => `${el.countriesAndTerritories}: ${el.countryterritoryCode}`))].join('\n')

            if (codes.length) {
                message.author.send('**List of country codes:**\n\n')
    
                let offset = 0
                let endOffset = 0
                let limit = 2000 // discord limit
    
                for (let p = 0; p < Math.ceil(codes.length / limit); p++) {
                    let msgParts = codes.slice(p * limit - offset, (p + 1) * limit).split('\n')
                    let msg;
    
                    offset = msgParts.pop().length;
                    endOffset = msgParts.join('\n').length - offset;
                    msg = msgParts.join('\n').substring(-endOffset)
    
                    message.author.send(msg)
                }
            }
        }
    }

    if (!message.content.startsWith(cfg.prefix) || message.author.bot)
        return;

    if (message.content === cfg.prefix) help()

    const cmd = message.content.slice(cfg.prefix.length+1).trim().toLowerCase().split(/\.+/g)

    const getFunc = (cmd, method = '') => {
        const rgxp = new RegExp(`${method}(.*)?\\((.*)?\\)`, "g")
        const matches = rgxp.exec(cmd)

        return {
            ...{name: matches ? matches[1] : cmd},
            ...matches && {args: matches[2] ? matches[2].replace(/['"\s]+/g, '').split(',') : []}
        };
    }

    const fn = getFunc(cmd[0]);
    const method = cmd[1] ? getFunc(cmd[1]) : null;

    switch (fn.name) {
        case 'clear':
            if (message.member.roles.cache.has(cfg.adminRoleId)) {
                async function clear() {
                    message.delete()
                    const limit = fn.args && fn.args.length === 1 && parseInt(fn.args[0]) < 99 ? parseInt(fn.args[0]) : 99;
                    const fetched = await message.channel.messages.fetch({ limit })
                    message.channel.bulkDelete(fetched)
                }
                clear();  
            } break;
        case 'access':
            if (message.member.roles.cache.has(cfg.adminRoleId)) {
                let rolename = message.guild.roles.cache.get(cfg.adminRoleId).name
                if (!method || !method.name || method.name === 'show') {
                    message.channel.send(`Additional priviledges role: *${rolename}*`)
                } else if (method.name === 'change' && method.args && method.args.length === 1) {
                    let newAdminRole = message.guild.roles.cache.get(method.args[0])
                    if (newAdminRole) {
                        let previousRolename = rolename
                        cfg.adminRoleId = method.args[0]
                        message.channel.send(`Additional priviledges role changed: ${previousRolename} -> ${newAdminRole}.`)
                    } else message.channel.send('Invalid role ID.')
                }
            } break;
        case 'reload':
            if (message.member.roles.cache.has(cfg.adminRoleId)) {
                cases = getJson(cfg.dataSrc, data => {
                    if (debug) console.log('Data reloaded.')
                    return data.records; 
                })
                
            } break;
        case 'help': help(); break;
        case 'prefix':
            if (!method || !method.name || method.name === 'show')
                message.channel.send(`Current cfg.prefix: **${cfg.prefix}**\nChange cfg.prefix: \`${cfg.prefix}.cfg.prefix.change(newcfg.prefix)\``)

            else if (method.name === 'change' && method.args && method.args.length === 1)  {
                let oldprefix = cfg.prefix
                cfg.prefix = method.args[0]
                message.channel.send(`cfg.prefix changed: **${oldprefix}** -> **${cfg.prefix} GMT**`)
            } break;
        case 'cc': 
            if (!method || !method.name) {
                message.channel.send(`Current country code: **${cfg.cc}**\nChange country code: \`${cfg.prefix}.cc.change(newcountrycode)\`\nList of country codes: \`covid.cc.list\``)
            } else if (method.name === 'list')
                ccList()
            else if (method.name === 'change' && message.member.roles.cache.has(cfg.adminRoleId)) {
                let oldcc = cfg.cc
                cfg.cc = String(method.args[0]).toUpperCase()
                message.channel.send(`Country code changed: **${oldcc}** -> **${cfg.cc}**`)
            } break;
        case 'messagetime':
            if (!method || !method.name || method.name === 'show') {
                message.channel.send(`Current message time: **${cfg.messageTime} GMT**.\nChange message time: \`${cfg.prefix}.messagetime.change(newmessagetime)\``)
            } else if (method.name === 'change' && method.args[0].match(/^(2[0-3]|[0-1]?[\d])(:[0-5][\d])?$/gm)) {
                let oldmessageTime = cfg.messageTime
                cfg.messageTime = method.args[0].length === 2
                    ? method.args[0] + ':00'
                    : method.args[0]

                message.channel.send(`Message time changed: **${oldmessageTime} GMT** -> **${cfg.messageTime} GMT**`)
            } break;
        case 'today':
            if (cases) {
                const country = fn.args && fn.args[0] ? fn.args[0].toUpperCase() : cfg.cc;
                today(message.channel, country)
            } break;
        case 'on':
            if (cases && fn.args && fn.args[0]) {
                const [ year, month, day ] = fn.args[0].split('-')
                const parsedDate = `${day}/${month}/${year}`;
                const country = fn.args[1] ? fn.args[1].toUpperCase() : cfg.cc;

                const data = cases.filter(el => { return el.countryterritoryCode === country && el.dateRep === parsedDate; }).shift()

                const msg = data
                    ? `**Stats for ${data.dateRep}, ${data.countriesAndTerritories}:**\n\n*Cases:* ${data.cases}\n*Deaths:* ${data.deaths}`
                    : `No data found for **${country}** in **${parsedDate}**.`

                message.channel.send(msg)
            } break;
        case 'in':
            if (cases && fn.args && fn.args[0]) {
                const country = fn.args[0].toUpperCase();

                const data = cases.filter(el => { return el.countryterritoryCode === country; });
                
                const sumOfCases = data.reduce((a, b) => a + (b.cases || 0), 0);
                const sumOfDeaths = data.reduce((a, b) => a + (b.deaths || 0), 0);

                const msg = data && sumOfCases && sumOfDeaths
                    ? `**Stats for ${data[0].countriesAndTerritories}:**\n\n*Cases:* ${sumOfCases}\n*Deaths:* ${sumOfDeaths}\n*Population (2019):* ${data[0].popData2019}`
                    : `No data found for **${country}**.`

                message.channel.send(msg)
            } break;
        case 'all': if (cases) all(message.channel); break; 
        case 'countrycodes': case 'ccs': ccList(); break;
    }
});

client.login(cfg.token)