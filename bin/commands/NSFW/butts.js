module.exports.run = async (bot, message, args, lang, v, logger) => { 
    try {
        let { body } = await v.superagent.get('http://api.obutts.ru/butts/0/1/random')

        let imageurl = "http://media.obutts.ru/" + body[0].preview
        message.channel.send({embed:{
            title: lang.general.imagehyperlink,
            url: imageurl,
            image: {
                url: imageurl },
            footer: {
                icon_url: message.author.displayAvatarURL,
                text: "Requestet by " + message.author.username },
            timestamp: message.createdAt,
            color: v.randomhex() } })

    } catch (err) {
        logger("butts API Error: " + err)
        message.channel.send("butts API Error: " + err) }
}

module.exports.info = {
    names: ["butts"],
    description: "Posts porn pictures of butts. (NSFW)",
    usage: "",
    accessableby: ['all'],
    allowedindm: true,
    nsfwonly: true
}