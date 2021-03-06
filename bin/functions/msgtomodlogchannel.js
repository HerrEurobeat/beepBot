//This file contains code of the msgtomodlogchannel function and is called by bot.js
//I did this to reduce the amount of lines in bot.js to make finding stuff easier.

module.exports.run = (bot, logger, guild, action, author, reciever, details) => {
    bot.settings.findOne({ guildid: guild.id }, (err, guildsettings) => {
        if (guildsettings.modlogfeatures && !guildsettings.modlogfeatures.includes(action) && !action.includes("err")) return; //user turned off this modlogfeature and it isn't an err

        if (!guildsettings || !guildsettings.modlogchannel || action == "modlogmsgerr") { //if modlogchannel is undefined (turned off) or a previous modlogmsg failed
            if (action.includes("err")) { //if error, then find a channel to inform someone
                if (guildsettings.systemchannel) guildsettings.modlogchannel = guildsettings.systemchannel //if no modlogchannel set, try systemchannel
                    else if (guild.systemChannelID) guildsettings.modlogchannel = guild.systemChannelID //then check if guild has a systemChannel set
                    else {
                        //well then try and get the first channel (rawPosition) where the bot has permissions to send a message
                        guildsettings.modlogchannel = null //better set it to null to avoid potential problems

                        //get all text channels into array and sort them by ascending rawPositions
                        let textchannels = guild.channels.cache.filter(c => c.type == "text").sort((a, b) => a.rawPosition - b.rawPosition)
                        guildsettings.modlogchannel = textchannels.find(c => c.permissionsFor(bot.user).has("SEND_MESSAGES")).id //find the first channel with perms
                        if (!guildsettings.modlogchannel) return; } //if it couldn't find a channel then stop
                
                if (!guildsettings || !guildsettings.lang) guildsettings.lang = bot.constants.defaultguildsettings.lang //set default lang to suppress error from lang function
            } else { return; } } //yes well if it isn't an error then stop

        let guildlang = bot.fn.lang(guild.id, guildsettings)

        //Avoid errors from controller.js unban broadcastEval
        if (!author["username"]) author["username"] = "ID: " + author.userid //userid will always be defined (look at controller.js unban broadcastEval)
        if (!author["discriminator"]) author["discriminator"] = "????"
        if (!reciever["username"]) reciever["username"] = "ID: " + reciever.userid
        if (!reciever["discriminator"]) reciever["discriminator"] = "????"

        var msg = {embed:{
            title: "",
            color: null,
            fields: [],
            footer: { icon_url: bot.user.displayAvatarURL(), text: guildlang.general.modlogdeletewithreaction }
        }}

        switch (action) {
            case "clear":
                msg.embed.title = guildlang.general.modlogcleartitle.replace("author", `${author.username}#${author.discriminator}`).replace("clearamount", details[0]).replace("channelname", "#" + details[1].name)
                msg.embed.color = 16753920 //orange
                break;
            case "kick":
                msg.embed.title = guildlang.general.modlogkicktitle.replace("author", `${author.username}#${author.discriminator}`).replace("reciever", `${reciever.username}#${reciever.discriminator}`)
                msg.embed.color = 16753920 //orange
                msg.embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[0] })
                msg.embed.fields.push({ name: `${guildlang.general.details}:`, value: guildlang.general.modloguserwasnotified + String(details[1]).replace("true", "✅").replace("false", "❌") }) //details[1] is a boolean if the user was notified
                break;
            case "ban":
                msg.embed.title = guildlang.general.modlogbantitle.replace("author", `${author.username}#${author.discriminator}`).replace("reciever", `${reciever.username}#${reciever.discriminator}`)
                msg.embed.color = 16711680 //red
                msg.embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[0] })
                msg.embed.fields.push({ name: `${guildlang.general.details}:`, 
                                        value: `${guildlang.general.length}: ${details[1]}
                                                ${guildlang.general.modloguserwasnotified}${String(details[2]).replace("true", "✅").replace("false", "❌")}` 
                                    })
                break;
            case "unban":
                msg.embed.title = guildlang.general.modlogunbantitle.replace("reciever", `${reciever.username}#${reciever.discriminator}`)
                msg.embed.color = 65280 //green
                msg.embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[0] })
                break;
            case "unbanerr":
                msg.embed.title = guildlang.general.modlogunbanerrtitle.replace("reciever", `${reciever.username}#${reciever.discriminator}`)
                msg.embed.color = 14725921 //some orange mixture
                msg.embed.fields.push({ name: `${guildlang.general.error}:`, value: details[1] })
                msg.embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[0] })
                break;
            case "movemsg":
                if (details[0] == "convo") { //conversation got moved
                    msg.embed.title = guildlang.general.modlogmoveconvotitle.replace("author", `${author.username}#${author.discriminator}`).replace("amount", details[1])
                    msg.embed.color = 65280 //green
                    msg.embed.fields.push({ name: `${guildlang.general.channels}`, value: `<#${details[3]}> -> <#${details[4]}>` }) //originalchannel -> movechannel
                    msg.embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[2] })
                } else {
                    msg.embed.title = guildlang.general.modlogmovemsgtitle.replace("author", `${author.username}#${author.discriminator}`).replace("reciever", `${reciever.username}#${reciever.discriminator}`)
                    msg.embed.color = 65280 //green
                    msg.embed.fields.push({ name: `${guildlang.general.modlogmovemsgcontent}:`, value: details[1] }) //attachment is already in messagecontent
                    msg.embed.fields.push({ name: `${guildlang.general.channels}`, value: `<#${details[3]}> -> <#${details[4]}>` }) //originalchannel -> movechannel
                    msg.embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[2] })
                }
                break;
            case "mute":
                if (details[0] == "all") details[0] = "voice, chat" //change term to make it more understandable
 
                msg.embed.title = guildlang.general.modlogmutetitle.replace("author", `${author.username}#${author.discriminator}`).replace("reciever", `${reciever.username}#${reciever.discriminator}`)
                msg.embed.color = 16753920 //orange
                msg.embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[1] })
                msg.embed.fields.push({ name: `${guildlang.general.details}:`, 
                                        value: `${guildlang.general.where}: ${details[0]}
                                                ${guildlang.general.length}: ${details[2]}
                                                ${guildlang.general.modloguserwasnotified}${String(details[3]).replace("true", "✅").replace("false", "❌")}` 
                                    })
                break;
            case "unmute":
                msg.embed.title = guildlang.general.modlogunmutetitle.replace("reciever", `${reciever.username}#${reciever.discriminator}`)
                msg.embed.color = 65280 //green
                msg.embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[1] })
                if (details[0] == "manual") msg.embed.fields.push({ name: `${guildlang.general.modlogunmutedby}:`, value: `${author.username}#${author.discriminator}` }) //we only care about this information if the unmute was executed by the unmute cmd
                break;
            case "unmuteerr":
                msg.embed.title = guildlang.general.modlogunmuteerrtitle.replace("reciever", `${reciever.username}#${reciever.discriminator}`)
                msg.embed.color = 14725921 //some orange mixture
                msg.embed.fields.push({ name: `${guildlang.general.error}:`, value: details[1] })
                msg.embed.fields.push({ name: `${guildlang.general.reason}:`, value: details[0] })
                break;
            case "modlogmsgerr":
                msg.embed.title = guildlang.general.modlogmsgerrtitle
                msg.embed.color = 16711680 //red
                msg.embed.fields.push({ name: `${guildlang.general.error}:`, value: details[0] })
                msg.embed.fields.push({ name: `${guildlang.general.message}:`, value: details[1] })
                break;
            default:
                return logger("error", "msgtomodlogchannel.js", "Unsupported action: " + action);
        }

        var modlogchannel = guild.channels.cache.get(guildsettings.modlogchannel)
        if (!modlogchannel) { //Check if modlogchannel can't be found
            bot.fn.msgtomodlogchannel(guild, "modlogmsgerr", author, reciever, [guildlang.general.modlogchannelnotfound.replace("channelid", guildsettings.modlogchannel), msg.embed.title])
            bot.settings.update({ guildid: guild.id }, { $set: { modlogchannel: bot.constants.defaultguildsettings.modlogchannel }}, {}, () => { }) //reset setting
            return; }
        
        if (!modlogchannel.permissionsFor(bot.user).has("ADD_REACTIONS")) msg.embed.footer.text = guildlang.general.modlognoaddreactionsperm //change footer text

        guild.channels.cache.get(guildsettings.modlogchannel).send(msg)
            .then((msg) => { //don't need to ask shard manager
                msg.react("🗑️")
                    .then(res => { 
                        //add res to monitorreactions db
                        bot.monitorreactions.insert({ type: "modlog", msg: res.message.id, reaction: res._emoji.name, guildid: guild.id, allowedroles: guildsettings.adminroles, until: Date.now() + 31557600000 }, (err) => { if (err) logger("error", "msgtomodlogchannel.js", "Error inserting modlogmsg reaction to db: " + err) }) //message also contains guild and timestamp | 31557600000 ms = 12 months
                    })
                    .catch(() => {}) }) //reaction err catch -> ignore error
            .catch((err) => { //sendmsg error catch
                if (err) return bot.fn.msgtomodlogchannel(guild, "modlogmsgerr", author, reciever, [err, msg.embed.title]) }) //call this same function again to notify that modlogmsgs can't be sent (won't end in a loop because if no channel can be found on err then it will stop)
    })
}