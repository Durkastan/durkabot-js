// welcome
module.exports = {
  name: "guildMemberUpdate",
  async execute(oldMember, newMember) {
    const welcome_message =
      "Welcome -- please make sure to read <#458932170267033603>  <#458500334973616129> ... If you have any questions please ask in one of the free discussion channels, someone will see to your question soon, feel free to look around and engage in the various channels here to learn or contribute. ";
    // const welcome_channel_id = 458493647609004035n
    console.log("event fired");
    if (
      (!oldMember.roles.cache.has("1071166930913869924") &&
        newMember.roles.cache.has("1071166683579957400")) ||
      (!oldMember.roles.cache.has("1071166930913869924") &&
        newMember.roles.cache.has("1071173289499709692"))
    ) {
      newMember.client.channels.cache
        .find((i) => i.name == "lounge")
        .send(welcome_message + "<@" + newMember + ">");
    }
  },
};
