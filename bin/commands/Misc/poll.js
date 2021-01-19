module.exports.run = async (bot, message, args, lang, logger, guildsettings, fn) => { //eslint-disable-line
    await message.react("👍").catch(err => {
        message.channel.send("poll react error: " + err)
        return; })

    await message.react("👎").catch(err => {
        message.channel.send("poll react error: " + err)
        return; })

    await message.react("🤷").catch(err => {
        message.channel.send("poll react error: " + err)
        return; })
}

module.exports.info = {
    names: ["poll", "vote", "survey"],
    description: "cmd.othermisc.pollinfodescription",
    usage: "[poll description]",
    accessableby: ['all'],
    allowedindm: false,
    nsfwonly: false
}