const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
module.exports = {
  // /quran command
  data: new SlashCommandBuilder()
    .setName("quran")
    .setDescription("find an ayah of the Qur'an")
    // this is to select the surah number
    .addIntegerOption((option) =>
      option
        .setName("surah")
        .setDescription("select number of the verse")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(114)
    )
    // this one the ayah number
    .addIntegerOption((option) =>
      option
        .setName("ayah")
        .setDescription("the wanted ayah")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(286)
    )
    // the to is the ending ayah if it exists
    .addIntegerOption((option) =>
      option
        .setName("to")
        .setDescription("ending ayah if searching for more than one")
        .setMaxValue(286)
    )
    // the language, english or whatever
    .addStringOption((option) =>
      option.setName("language").setDescription("selected language")
    )
    // the translation (ex. Sahih)
    .addStringOption((option) =>
      option.setName("translation").setDescription("selected translation")
    )
    .setDMPermission(true),
  // the function
  async execute(interaction) {
    // some simple while it is processing(copied from ping.js lol)
    await interaction.deferReply({ ephemeral: false });
    //   save the surah
    const surah = interaction.options.getInteger("surah");
    //   save the ayah
    const ayah = interaction.options.getInteger("ayah");
    //   save the ending ayah, if there isnt any then just leave it as an empty string
    const to = interaction.options.getInteger("to") ?? "";
    // the language, if not specified, just leave it as english
    const language =
      interaction.options.getString("language")?.slice(0, 2) ?? "en";
    // the translation, if not specified, leave it as sahih (BTW in the json these two are one value, so en.sahih )
    const translation = interaction.options.getString("translation") ?? "sahih";
    // create an object that will have these datas, but start as undefined
    let surahData = {
      englishName: undefined,
      arabicName: undefined,
      ayahs: undefined,
      revelationType: undefined,
      translation: undefined,
    };
    // if the ending ayah was never given
    if (to === "") {
      try {
        const ayahResult = await axios.get(
          `https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/${language}.${translation}`
        );
        const data = await ayahResult.data.data[0];
        surahData = {
          englishName: data.surah.englishName,
          arabicName: data.surah.name,
          ayahs: [{ number: data.numberInSurah, text: data.text }],
          revelationType: data.surah.revelationType,
          translation: data.edition.englishName,
        };
      } catch (e) {
        await interaction.editReply(
          "Error: Couldn't find specific ayah. Please check your inputs and try again."
        );
        return;
      }
    }
    // if however ending ayah has a value and it is a number, and it is bigger than the starting ayah, then fetch through a loop
    else if (to > 0 && !isNaN(to) && to > ayah) {
      // here the ayahs will be stored
      const ayahArray = [];
      for (let i = ayah; i <= to; i++) {
        try {
          // this request is from some unknown fetching module that discord.js seems to use in its website
          const ayahResult = await axios(
            `https://api.alquran.cloud/v1/ayah/${surah}:${i}/editions/${language}.${translation}`
          );
          const data = await ayahResult.data.data[0];
          // save number of the ayah and the ayah text
          const ayaObj = { number: data.numberInSurah, text: data.text };
          // push it inside the empty arr
          ayahArray.push(ayaObj);
          // we get the additional surahData values only once, so if all of these arent undefined, it means they are already assigned, so just continue
          if (
            surahData["englishName"] !== undefined &&
            surahData["arabicName"] !== undefined &&
            surahData["revelationType"] !== undefined &&
            surahData["translation"] !== undefined
          ) {
            continue;
          }
          surahData = {
            englishName: data.surah.englishName,
            arabicName: data.surah.name,
            ayahs: undefined,
            revelationType: data.surah.revelationType,
            translation: data.edition.englishName,
          };
        } catch (e) {
          await interaction.editReply(
            "Error: Couldn't find specific ayah. Please check your inputs and try again."
          );
          return;
        }
      }
      // after the end of the loop and the array to the ayahs property of the surahData
      surahData.ayahs = ayahArray;
    } else {
      await interaction.editReply(
        "Error: Invalid Inputs. Please check your inputs and try again."
      );
      return;
    }
    // create the embed that shows the result
    const durkaEmbed = new EmbedBuilder()
      // color is white
      .setColor(0xfff)
      // we set the title for ex: Al-Fatihah | (Al fatihah in arabic alphabet)
      .setTitle(`${surahData.englishName} | ${surahData.arabicName}`)
      // the image of the durkastan logo on the side
      .setThumbnail(
        "https://images-ext-1.discordapp.net/external/8hghyHBK3QK9VP0K89AJ8tCUREWGdlD9_bJ9Y3B_3dk/https/i.imgur.com/BOJeLJF.png"
      );
    // for each ayah on the object, add a Field of text that has the number at the top and below the text
    await surahData?.ayahs?.forEach((aya) => {
      durkaEmbed.addFields({ name: `${aya.number}`, value: `${aya.text}` });
    });
    // then in the end, the revelation and translation, for ex: Meccan | Saheeh International
    durkaEmbed.addFields({
      name: "Revelation | Translation",
      value: `${surahData.revelationType} | ${surahData.translation}`,
    });
    // reply with the embed
    await interaction.editReply({ embeds: [durkaEmbed] });
  },
};
