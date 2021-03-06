module.exports.run = async (bot, message, args, lang, logger, guildsettings, fn) => {
    try {
        let { body } = await require("superagent").get('https://nekobot.xyz/api/image?type=4k')

        message.channel.send({embed:{
            title: lang.general.imagehyperlink,
            url: body.message,
            image: {
                url: body.message },
            footer: {
                text: `${lang.general.poweredby} NekoBot API` },
            timestamp: message.createdAt,
            color: fn.randomhex() }})

    } catch (err) {
        logger("error", "4k.js", "API Error: " + err)
        message.channel.send(`nekobot.xyz 4k API ${lang.general.error}: ${err}`) }
}

module.exports.info = {
    names: ["4k"],
    description: "cmd.othernsfw.4kinfodescription",
    usage: "",
    accessableby: ['all'],
    allowedindm: true,
    nsfwonly: true
}