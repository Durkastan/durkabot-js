const { SlashCommandBuilder,EmbedBuilder } = require('discord.js');
const axios = require('axios')
module.exports = {
    // /quran command
	data: new SlashCommandBuilder()
		.setName('quran')
		.setDescription('find an ayah of the Qur\'an')
        // this is to select the surah number
		.addStringOption(option =>
			option
				.setName('surah')
				.setDescription('select number of the verse'))
                // this one the ayah number
		.addStringOption(option =>
			option
				.setName('ayah')
				.setDescription('the wanted ayah'))
                // the to is the ending ayah if it exists
		.addStringOption(option =>
			option
				.setName('to')
				.setDescription('ending ayah if searching for more than one'))
                // the language, english or whatever
		.addStringOption(option =>
			option
				.setName('language')
				.setDescription('selected language'))
                // the translation (ex. Sahih)
		.addStringOption(option =>
			option
				.setName('translation')
				.setDescription('selected translation'))
		.setDMPermission(true),
        //the function
    async execute(interaction){
        // some simple while it is processing(copied from ping.js lol)  
          await interaction.deferReply({ ephemeral: false });
          //   save the surah
          const surah = interaction.options.getString('surah');
          //   save the ayah
          const ayah = interaction.options.getString('ayah');
        //   save the ending ayah, if there isnt any then just leave it as an empty string
        const to = interaction.options.getString('to') ?? "";
        // the language, if not specified, just leave it as english
        const language = interaction.options.getString('language').slice(0,2) ?? "en";
        // the translation, if not specified, leave it as sahih (BTW in the json these two are one value, so en.sahih )
        const translation = interaction.options.getString('translation') ?? "sahih";
        // create an object that will have these datas, but start as undefined
        let surahData = {
            englishName:undefined,
            arabicName:undefined,
            ayahs:undefined,
            revelationType:undefined,
            translation:undefined
        };
        // if the ending ayah was never given
        if(to === ""){
            const ayahResult = await axios.get(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/editions/${language}.${translation}`);
            const data = await ayahResult.data.data[0];
            console.log(data.surah)
            surahData = {
                englishName:data.surah.englishName,
                arabicName:data.surah.name,
                ayahs:[{number:data.numberInSurah,text:data.text}],
                revelationType:data.surah.revelationType,
                translation:data.edition.englishName
            }
        }
        // if however ending ayah has a value and it is a number, and it is bigger than the starting ayah, then fetch through a loop
        else if((to > 0 && !isNaN(to))&& parseInt(to) > parseInt(ayah)){
            console.log(parseInt(ayah),parseInt(to))
            // here the ayahs will be stored
            let ayahArray = [];
            for(let i =parseInt(ayah);i<=parseInt(to);i++){
                // this request is from some unknown fetching module that discord.js seems to use in its website
                const ayahResult = await axios(`https://api.alquran.cloud/v1/ayah/${surah}:${i}/editions/${language}.${translation}`);
                const data = await ayahResult.data.data[0];
                console.log(data)
                // save number of the ayah and the ayah text
                let ayaObj = {number:data.numberInSurah,text:data.text};
                //push it inside the empty arr
                ayahArray.push(ayaObj)
                //we get the additional surahData values only once, so if all of these arent undefined, it means they are already assigned, so just continue
                if(surahData["englishName"] !== undefined && surahData["arabicName"] !== undefined && surahData["revelationType"] !== undefined && surahData["translation"] !== undefined){
                    continue;
                }
                surahData = {
                    englishName:data.surah.englishName,
                    arabicName:data.surah.name,
                    ayahs:undefined,
                    revelationType:data.surah.revelationType,
                    translation:data.edition.englishName
                }
            }
            // after the end of the loop and the array to the ayahs property of the surahData
            surahData.ayahs = ayahArray;
        }
        // create the embed that shows the result
        const durkaEmbed=  new EmbedBuilder()
        // color is white
        .setColor(0xfff)
        // we set the title for ex: Al-Fatihah | (Al fatihah in arabic alphabet)
        .setTitle(`${surahData.englishName} | ${surahData.arabicName}`)
        // the image of the durkastan logo on the side
        .setThumbnail('https://images-ext-1.discordapp.net/external/8hghyHBK3QK9VP0K89AJ8tCUREWGdlD9_bJ9Y3B_3dk/https/i.imgur.com/BOJeLJF.png');
        // for each ayah on the object, add a Field of text that has the number at the top and below the text
        await surahData?.ayahs?.forEach(aya=>{
            durkaEmbed.addFields({"name":`${aya.number}`,"value":`${aya.text}`})
        });
        // then in the end, the revelation and translation, for ex: Meccan | Saheeh International
        durkaEmbed.addFields({name:"Revelation | Translation",value:`${surahData.revelationType} | ${surahData.translation}`});
        // reply with the embed
        await interaction.editReply({embeds:[durkaEmbed]});
        
    }
};