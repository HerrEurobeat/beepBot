module.exports.run = async (bot, message, args, lang, logger, guildsettings, fn) => { //eslint-disable-line
    const clean = text => {
        if (typeof(text) === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
            else return text; }
      
    try {
        const code = args.join(" ");
        let evaled = eval(code);

        if (typeof evaled !== "string")
        evaled = require("util").inspect(evaled);

        message.channel.send(clean(evaled), {code:"xl"}).catch(err => {
            message.channel.send("Error: " + err) })
    } catch (err) {
        message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
        message.react("❌")
        return; }
    message.react("✅")
}

module.exports.info = {
    names: ["eval"],
    description: "Bot owner can execute code through the discord chat.",
    accessableby: ['botowner'],
    allowedindm: true,
    nsfwonly: false
}