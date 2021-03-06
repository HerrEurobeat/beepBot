module.exports.run = (bot, message, args, lang, logger, guildsettings, fn) => { //eslint-disable-line
    const Discord = require("discord.js")
    var guildid   = message.guild.id
    var none      = "**/**"
    let lf        = lang.cmd.settings

    function logDbErr(err) { //Avoids having to copy paste the same msg and makes changing it easier
        logger("error", "settings.js", `Error updating db of guild ${guildid}. Error: ${err}`) }

    /* --------------- Read settings for this guild --------------- */

    //adminroles, moderatorroles & memberaddroles
    if (guildsettings.adminroles && guildsettings.adminroles.length > 0) {
        var adminroles = ""
        for(let i = 0; i < guildsettings.adminroles.length; i++) { //< and not <= because i is one lower than length
            if (i < 1) adminroles += `<@&${message.guild.roles.cache.get(guildsettings.adminroles[i]).id}>`
                else adminroles += `, <@&${message.guild.roles.cache.get(guildsettings.adminroles[i]).id}>` }
    } else { var adminroles = none }

    if (guildsettings.moderatorroles && guildsettings.moderatorroles.length > 0) {
        var moderatorroles = ""
        for(let i = 0; i < guildsettings.moderatorroles.length; i++) { //< and not <= because i is one lower than length
            if (i < 1) moderatorroles += `<@&${message.guild.roles.cache.get(guildsettings.moderatorroles[i]).id}>`
                else moderatorroles += `, <@&${message.guild.roles.cache.get(guildsettings.moderatorroles[i]).id}>` }  
    } else { var moderatorroles = none }

    if (guildsettings.memberaddroles && guildsettings.memberaddroles.length > 0) {
        var memberaddroles = ""
        for(let i = 0; i < guildsettings.memberaddroles.length; i++) { //< and not <= because i is one lower than length
            if (i < 1) memberaddroles += `<@&${message.guild.roles.cache.get(guildsettings.memberaddroles[i]).id}>`
                else memberaddroles += `, <@&${message.guild.roles.cache.get(guildsettings.memberaddroles[i]).id}>` }  
    } else { var memberaddroles = none }

    //systemchannel
    if (guildsettings.systemchannel) { //channel set
        var systemchannel = message.guild.channels.cache.get(guildsettings.systemchannel)

        if (!systemchannel) { //check if channel doesn't exist
            bot.settings.update({ guildid: guildid }, { $set: { systemchannel: bot.constants.defaultguildsettings.systemchannel }}, {}, (err) => { if (err) logDbErr(err) }) //reset setting
            systemchannel = none
        } else var systemchannel = `<#${systemchannel.id}>`
    } else { //no channel set
        if (message.guild.systemChannel !== null) { //display recommendation
            var systemchannel = `${none} - ${lf.recommendation}: \`#${message.guild.systemChannel.name}\``
        } else {
            var systemchannel = none } }

    //modlogchannel
    if (guildsettings.modlogchannel) { //channel set
        var modlogchannel = message.guild.channels.cache.get(guildsettings.modlogchannel) //try to get channel

        if (!modlogchannel) { //check if channel doesn't exist
            bot.settings.update({ guildid: guildid }, { $set: { modlogchannel: bot.constants.defaultguildsettings.modlogchannel }}, {}, (err) => { if (err) logDbErr(err) }) //reset setting
            modlogchannel = none
        } else var modlogchannel = `<#${modlogchannel.id}>`
    } else { var modlogchannel = none } //no channel set

    //modlogfeatures
    if (guildsettings.modlogchannel && guildsettings.modlogfeatures && guildsettings.modlogfeatures.length > 0) { //also show none if modlogchannel is not set
        var modlogfeatures = ""
        for(let i = 0; i < guildsettings.modlogfeatures.length; i++) { //< and not <= because i is one lower than length
            if (i < 1) modlogfeatures += guildsettings.modlogfeatures[i]
                else modlogfeatures += `, ${guildsettings.modlogfeatures[i]}` }  
    } else { var modlogfeatures = none }
    
    //greetmsg & byemsg
    if (!guildsettings.greetmsg) var greetmsg = none
        else var greetmsg = guildsettings.greetmsg

    if (!guildsettings.byemsg) var byemsg = none
        else var byemsg = guildsettings.byemsg



    /* --------------- Code to customize settings --------------- */
        
    function roleid() {
        try { //get and set roleid once to make code cleaner
            if (!args[2]) { return message.channel.send(lf.adminmodmemberaddroleusage) }
            if (args[2].length === 18 && /^\d+$/.test(args[2])) { //Check if the arg is 18 chars long and if it is a number
                return args[2].toString() 
            } else { return message.guild.roles.cache.find(role => role.name.toLowerCase() === args.slice(2).join(" ").toLowerCase()).id } //not a roleid so try and find by name
        } catch (err) { 
            message.channel.send(`${lf.roleerror}.\n||\`${err}\`||`)
            return
        }}

    if (!args[0]) { args[0] = "" }
    const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, {time: 10000});

    switch(args[0].toLowerCase()) {
        case "-h":
        case "-help":
        case "h":
        case "help":
            var PREFIX = guildsettings.prefix

            // \` is to apply markdown to message without using some kind of string feature (like ending the ` String message)
            message.channel.send({embed: {
                title: `${lf.settings} - ${lang.cmd.help.help}`,
                fields: [{
                        name: `\`${PREFIX}settings prefix (new prefix)\``,
                        value: lf.helpprefixset },
                    {
                        name: `\`${PREFIX}settings lang [${lang.general.language}]\``,
                        value: lf.helplangset },
                    {
                        name: `\`${PREFIX}settings adminroles [add/remove/removeall] [${lf.rolename}/${lf.roleid}]\``,
                        value: lf.helpadminrolesset },
                    {
                        name: `\`${PREFIX}settings modroles [add/remove/removeall] [${lf.rolename}/${lf.roleid}]\``,
                        value: lf.helpmodrolesset },
                    {
                        name: `\`${PREFIX}settings systemchannel [set/remove] [${lf.channelname}/${lf.channelid}]\``,
                        value: lf.helpsystemchannelset },
                    {
                        name: `\`${PREFIX}settings modlogchannel [set/remove] [${lf.channelname}/${lf.channelid}]\``,
                        value: lf.helpmodlogchannelset },
                    {
                        name: `\`${PREFIX}settings modlogfeatures [enable/disable/enableall/disableall] [${lf.featurename}]\``,
                        value: lf.helpmodlogfeaturesset },
                    {
                        name: `\`${PREFIX}settings greetmsg [set/remove] [${lang.general.message}]\``,
                        value: lf.helpgreetmsgset},
                    {
                        name: `\`${PREFIX}settings byemsg [set/remove] [${lang.general.message}]\``,
                        value: lf.helpbyemsgset },
                    {
                        name: `\`${PREFIX}settings joinroles [add/remove/removeall] [${lf.rolename}/${lf.roleid}]\``,
                        value: lf.helpjoinrolesset},
                    {
                        name: `\`${PREFIX}settings reset\``,
                        value: lf.helpsettingsreset },
                    {
                        name: `** **`,
                        value: lf.helpadvice.replace("prefix", PREFIX) }
                    ]}
            })

            break;
        case "prefix":
            if (!args[1]) { args[1] = "" }

            if (message.guild.members.cache.get(bot.user.id).nickname === null) var nickname = bot.user.username 
                else var nickname = message.guild.members.cache.get(bot.user.id).nickname.replace(` [${guildsettings.prefix}]`, "")

            switch(args[1].toLowerCase()) {
                case "set":
                    if (!args[2] || args[2].length < 1) return message.channel.send(lf.prefixmissingargs)

                    bot.settings.update({ guildid: guildid }, { $set: { prefix: args[2] }}, {}, (err) => { if (err) logDbErr(err) })
                    message.guild.members.cache.get(bot.user.id).setNickname(`${nickname} [${args[2]}]`).catch(err => { message.channel.send("I couldn't add my new Prefix to my nickname. Tip: You can also mention me instead of using a prefix if you should forget it.\nError: " + err) })
                    message.channel.send(`${lf.newprefixset}: ${args[2]}`)
                    break;
                case "remove":
                    if (bot.config.loginmode == "normal") var prefix = bot.constants.DEFAULTPREFIX
                        else var prefix = bot.constants.DEFAULTTESTPREFIX

                    bot.settings.update({ guildid: guildid }, { $set: { prefix: prefix }}, {}, (err) => { if (err) logDbErr(err) })
                    message.guild.members.cache.get(bot.user.id).setNickname(`${nickname} [${prefix}]`).catch(err => { message.channel.send("I couldn't add my new Prefix to my nickname. Tip: You can also mention me instead of using a prefix if you should forget it.\nError: " + err) })
                    message.channel.send(`${lf.newprefixset}: ${prefix}`)
                    break;
                default:
                    message.channel.send(lf.prefixmissingargs)
                    return; }            
            break;
        case "language":
        case "lang":
            if (!args[1]) { args[1] = "" }
            if (!Object.keys(bot.langObj).includes(args[1].toLowerCase())) {
                message.channel.send(`${lf.supportedlang}: \n${Object.keys(bot.langObj).join("\n").split(".json").join("") }`)
            } else {
                bot.settings.update({ guildid: guildid }, { $set: { lang: args[1].toLowerCase() }}, {}, (err) => { if (err) logDbErr(err) })

                //modify all createGuild lang reactions in db to not be able to change the guild language anymore by setting enablesettingslangchange to false for *all* createGuildlang documents of that guild
                bot.monitorreactions.update({$and: [{type: "createGuildlang"}, {guildid: message.guild.id}] }, { $set: { enablesettingslangchange: false }}, {multi: true}, (err) => {
                    if (err) logDbErr(err) }) 
                message.channel.send(`${bot.langObj[args[1].toLowerCase()].cmd.settings.newlangsaved}.`) }
            break;
        case "adminroles":
        case "adminrole":
            if (!args[1]) { args[1] = "" }
            switch(args[1].toLowerCase()) {
                case "add":
                    var roleid = roleid();
                    if (guildsettings.adminroles.includes(roleid)) return message.channel.send(lf.rolealreadyadded)
                    bot.settings.update({ guildid: guildid }, { $push: { adminroles: roleid }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(`${lf.roleadded}: ${message.guild.roles.cache.get(roleid).name} (${roleid})`)
                    break;
                case "remove":
                    var roleid = roleid();
                    if (!guildsettings.adminroles.includes(roleid)) return message.channel.send(lf.rolenotincluded)
                    bot.settings.update({ guildid: guildid }, { $pull: { adminroles: roleid }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(`${lf.roleremoved}: ${message.guild.roles.cache.get(roleid).name} (${roleid})`)
                    break;
                case "removeall":
                    message.channel.send(lang.general.areyousure)
                    collector.on('collect', msg => {
                        if (message.author.id !== msg.author.id) return; //only the original author is allowed to answer
                        if (msg.content == "y") {
                            bot.settings.update({ guildid: guildid }, { $set: { adminroles: [] }}, {}, (err) => { if (err) logDbErr(err) })
                            message.channel.send(lf.rolearraycleared) }
                        
                        collector.stop() });
                    break;
                default:
                    message.channel.send(lf.adminmodmemberaddroleusage)
                    return; }
            break;
        case "moderatorroles":
        case "moderatorrole":
        case "modroles":
        case "modrole":
            if (!args[1]) { args[1] = "" }
            switch(args[1].toLowerCase()) {
                case "add":
                    var roleid = roleid();
                    if (guildsettings.moderatorroles.includes(roleid)) return message.channel.send(lf.rolealreadyadded)
                    bot.settings.update({ guildid: guildid }, { $push: { moderatorroles: roleid }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(`${lf.roleadded}: ${message.guild.roles.cache.get(roleid).name} (${roleid})`)
                    break;
                case "remove":
                    var roleid = roleid();
                    if (!guildsettings.moderatorroles.includes(roleid)) return message.channel.send(lf.rolenotincluded)
                    bot.settings.update({ guildid: guildid }, { $pull: { moderatorroles: roleid }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(`${lf.roleremoved}: ${message.guild.roles.cache.get(roleid).name} (${roleid})`)
                    break;
                case "removeall":
                    message.channel.send(lang.general.areyousure)
                    collector.on('collect', msg => {
                        if (message.author.id !== msg.author.id) return; //only the original author is allowed to answer
                        if (msg.content == "y") {
                            bot.settings.update({ guildid: guildid }, { $set: { moderatorroles: [] }}, {}, (err) => { if (err) logDbErr(err) })
                            message.channel.send(lf.rolearraycleared) }
                        
                        collector.stop() });
                    break;
                default:
                    message.channel.send(lf.adminmodmemberaddroleusage)
                    return; }
            break;
        case "systemchannel":
            if (!args[1]) { args[1] = "" }
            switch(args[1].toLowerCase()) {
                case "set":
                    try {
                        if (!args[2]) { return message.channel.send(lf.systemchannelusage) }
                        if (args[2].length === 18 && /^\d+$/.test(args[2])) { //Check if the arg is 18 chars long and if it is a number
                            var channelid = args[2].toString()
                        } else if (args[2].match(/(?<=<#)[0-9]{18}?(?=>)/g)) { // <#18numbers>
                            var channelid = args[2].toString().replace(/[<#>]/g, "")
                        } else { var channelid = message.guild.channels.cache.find(channel => channel.name.toLowerCase() === args[2].toLowerCase()).id } //not a channelid so try and find by name (channelnames can't have spaces so no need to join array)
                    } catch (err) { return message.channel.send(`${lf.channelerror}.\n||\`${err}\`||`) }

                    //check if the bot has permissions to send messages to that channel
                    if (!message.guild.channels.cache.get(channelid).permissionsFor(bot.user).has("SEND_MESSAGES")) return message.channel.send(lf.channelnoperm)

                    bot.settings.update({ guildid: guildid }, { $set: { systemchannel: channelid }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(`${lf.channelset}: ${message.guild.channels.cache.get(channelid).name} (${channelid})`)
                    break;
                case "remove":
                    bot.settings.update({ guildid: guildid }, { $set: { systemchannel: null }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(lf.channelremoved)
                    break;
                default:
                    message.channel.send(lf.systemchannelusage)
                    return; }
            break;
        case "modlogchannel":
            if (!args[1]) { args[1] = "" }
            switch(args[1].toLowerCase()) {
                case "set":
                    try {
                        if (!args[2]) { return message.channel.send(lf.modlogchannelusage) }
                        if (args[2].length === 18 && /^\d+$/.test(args[2])) { //Check if the arg is 18 chars long and if it is a number
                            var channelid = args[2].toString()
                        } else if (args[2].match(/(?<=<#)[0-9]{18}?(?=>)/g)) { // <#18numbers>
                            var channelid = args[2].toString().replace(/[<#>]/g, "")
                        } else { var channelid = message.guild.channels.cache.find(channel => channel.name.toLowerCase() === args[2].toLowerCase()).id } //not a channelid so try and find by name (channelnames can't have spaces so no need to join array)
                    } catch (err) { return message.channel.send(`${lf.channelerror}.\n||\`${err}\`||`) }

                    //check if the bot has permissions to send messages to that channel
                    if (!message.guild.channels.cache.get(channelid).permissionsFor(bot.user).has("SEND_MESSAGES")) return message.channel.send(lf.channelnoperm)

                    bot.settings.update({ guildid: guildid }, { $set: { modlogchannel: channelid }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(`${lf.channelset}: ${message.guild.channels.cache.get(channelid).name} (${channelid})`)
                    break;
                case "remove":
                    bot.settings.update({ guildid: guildid }, { $set: { modlogchannel: null }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(lf.channelremoved)
                    break;
                default:
                    message.channel.send(lf.modlogchannelusage)
                    return; }
            break;
        case "modlogfeatures":
            if (!args[1]) { args[1] = "" }
            switch(args[1].toLowerCase()) {
                case "enable":
                    if (!bot.constants.defaultguildsettings.modlogfeatures.includes(args[2])) return message.channel.send(`${lf.featurenotfound}\`${bot.constants.defaultguildsettings.modlogfeatures.join(", ")}\``)
                    bot.settings.update({ guildid: guildid }, { $push: { modlogfeatures: args[2] }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(`${lf.featureenabled}${args[2]}`)
                    break;
                case "disable":
                    if (!bot.constants.defaultguildsettings.modlogfeatures.includes(args[2])) return message.channel.send(`${lf.featurenotfound}\`${bot.constants.defaultguildsettings.modlogfeatures.join(", ")}\``)
                    bot.settings.update({ guildid: guildid }, { $pull: { modlogfeatures: args[2] }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(`${lf.featuredisabled}${args[2]}`)
                    break;
                case "enableall":
                    bot.settings.update({ guildid: guildid }, { $set: { modlogfeatures: bot.constants.defaultguildsettings.modlogfeatures }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(lf.featuresallenabled)
                    break;
                case "disableall":
                    bot.settings.update({ guildid: guildid }, { $set: { modlogfeatures: [] }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(lf.featuresalldisabled)
                    break;
                default:
                    message.channel.send(`${lf.modlogfeatureusage}\`${bot.constants.defaultguildsettings.modlogfeatures.join(", ")}\``)
                    return; }
            break;
        case "greetmessage":
        case "greetmsg":
            if (!guildsettings.systemchannel) return message.channel.send(lf.greetmsgsystemchannelnotset)

            if (!args[1]) { args[1] = "" }
            switch(args[1].toLowerCase()) {
                case "set":
                    if (!args[2]) return message.channel.send(lf.greetmsgusage)
                    if (message.content.length > 150) return message.channel.send(lf.argtoolong)

                    args.splice(0, 2) //remove "greetmsg" and "set" from array

                    bot.settings.update({ guildid: guildid }, { $set: { greetmsg: String(args.join(" ")) }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(lf.msgset)
                    break;
                case "remove":
                    bot.settings.update({ guildid: guildid }, { $set: { greetmsg: null }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(lf.msgremoved)
                    break;
                default:
                    message.channel.send(lf.greetmsgusage)
                    return; }
            break;
        case "byemessage":
        case "byemsg":
            if (!guildsettings.systemchannel) return message.channel.send(lf.greetmsgsystemchannelnotset)

            if (!args[1]) { args[1] = "" }
            switch(args[1].toLowerCase()) {
                case "set":
                    if (!args[2]) return message.channel.send(lf.byemsgusage)
                    if (message.content.length > 150) return message.channel.send(lf.argtoolong)

                    args.splice(0, 2) //remove "byemsg" and "set" from array

                    bot.settings.update({ guildid: guildid }, { $set: { byemsg: String(args.join(" ")) }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(lf.msgset)
                    break;
                case "remove":
                    bot.settings.update({ guildid: guildid }, { $set: { byemsg: null }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(lf.msgremoved)
                    break;
                default:
                    message.channel.send(lf.byemsgusage)
                    return; }
            break;
        case "memberaddroles":
        case "joinroles":
            if (!args[1]) { args[1] = "" }
            switch(args[1].toLowerCase()) {
                case "add":
                    var roleid = roleid();
                    if (guildsettings.memberaddroles.includes(roleid)) return message.channel.send(lf.rolealreadyadded)
                    bot.settings.update({ guildid: guildid }, { $push: { memberaddroles: roleid }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(`${lf.roleadded}: ${message.guild.roles.cache.get(roleid).name} (${roleid})`)
                    break;
                case "remove":
                    var roleid = roleid();
                    if (!guildsettings.memberaddroles.includes(roleid)) return message.channel.send(lf.rolenotincluded)
                    bot.settings.update({ guildid: guildid }, { $pull: { memberaddroles: roleid }}, {}, (err) => { if (err) logDbErr(err) })
                    message.channel.send(`${lf.roleremoved}: ${message.guild.roles.cache.get(roleid).name} (${roleid})`)
                    break;
                case "removeall":
                    message.channel.send(lang.general.areyousure)
                    collector.on('collect', msg => {
                        if (message.author.id !== msg.author.id) return; //only the original author is allowed to answer
                        if (msg.content == "y") {
                            bot.settings.update({ guildid: guildid }, { $set: { memberaddroles: [] }}, {}, (err) => { if (err) logDbErr(err) }) 
                            message.channel.send(lf.rolearraycleared) } 
                        
                        collector.stop() });
                    break;
                default:
                    message.channel.send(lf.memberaddroleusage)
                    return; }
            break;
        case "reset":
            message.channel.send(lang.general.areyousure)
            collector.on('collect', msg => {
                if (message.author.id !== msg.author.id) return; //only the original author is allowed to answer
                if (msg.content == "y") {
                    fn.servertosettings(message.guild)
                    message.channel.send(lf.settingsreset) } 
                
                collector.stop() });
            break;


        /* --------------- Display current settings --------------- */
        default:
            if (guildsettings.adminroles.length == 0 && guildsettings.moderatorroles.length == 0 && !guildsettings.systemchannel && 
                !guildsettings.modlogchannel && !guildsettings.greetmsg && !guildsettings.byemsg && guildsettings.memberaddroles.length == 0) { //only display this message if the user hasn't set anything yet
                var embeddescription = lf.embeddescription.replace("prefix", guildsettings.prefix)
            } else {
                var embeddescription = undefined }

            message.channel.send({embed:{
                title: `${lf.settingsfor} '${message.guild.name}'`,
                color: fn.randomhex(),
                description: embeddescription,
                thumbnail: { url: message.guild.iconURL },
                fields: [{ 
                        name: "Prefix:", 
                        value: `\`${guildsettings.prefix}\``, 
                        inline: true }, 
                    { 
                        name: `${lang.general.language}:`, 
                        value: lang.general.thislang, 
                        inline: true },
                    { 
                        name: `${lf.adminroles}:`, 
                        value: adminroles },
                    { 
                        name: `${lf.moderatorroles}:`, 
                        value: moderatorroles },
                    { 
                        name: `${lf.systemchannel}:`,
                        value: systemchannel },
                    {
                        name: `${lf.modlogchannel}:`,
                        value: modlogchannel,
                        inline: true },
                    {
                        name: `${lf.modlogfeatures}:`,
                        value: modlogfeatures,
                        inline: true },
                    {
                        name: `${lf.greetmsg}:`,
                        value: greetmsg },
                    {
                        name: `${lf.byemsg}:`,
                        value: byemsg },
                    {
                        name: `${lf.addroleonjoin}:`,
                        value: memberaddroles }],
                footer: { icon_url: message.author.displayAvatarURL(), text: `${lang.general.requestedby} ${message.author.username} • ${lang.cmd.help.help}: ${guildsettings.prefix}settings help` }
            } })
            return; }
}

module.exports.info = {
    names: ["settings", "set"],
    description: "cmd.settings.infodescription",
    usage: "['help']",
    accessableby: ['admins'],
    allowedindm: false,
    nsfwonly: false
}