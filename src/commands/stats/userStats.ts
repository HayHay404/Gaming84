import {
  ChatInputCommandInteraction,
  CacheType,
  EmbedBuilder,
  AttachmentBuilder,
  time,
  TimestampStyles,
  User,
  CommandInteractionOptionResolver,
} from "discord.js";
import { client, db } from "../..";
import { generateDonut } from "../../charts/userCharts";
import { convertToReadableTime } from "./convertTime";

export async function statsHandler(
  interaction: ChatInputCommandInteraction<CacheType>
) {
  const userId =
    interaction.options
      .getMentionable("user")
      ?.toString()
      .replace(/[<@>]/g, "") || interaction.user.id;

  if (userId) {
    const { image, gameList, error } = await generateDonut(userId).catch(
      async (err) => {
        await interaction.reply(`Could not find <@${userId}> in our database.`);
        return { image: null, gameList: null, error: err };
      }
    );
    if (error != null || image == null) return;

    const file = new AttachmentBuilder(image, { name: `image.png` });

    const interactionUser = await client.users.fetch(userId);
    const user = await db.user.findFirst({where: {id: (interactionUser.id)}});
    if (!user) { await interaction.reply(`Could not find <@${userId}> in our database.`); }

    const embed = new EmbedBuilder()
      .setColor("Purple")
      .setThumbnail(interactionUser.displayAvatarURL())
      .setTitle(`Playtime breakdown`)
      .setDescription(
        `for <@${interactionUser.id}>, as of ${time(
          Math.floor(Date.now() / 1000),
          TimestampStyles.ShortDateTime
        )}`
      )
      .setDescription(`Last played ${user?.lastPlayedGame} for ${convertToReadableTime(user?.lastPlayedTime as string)}`)
      .setImage(`attachment://image.png`);

    gameList.forEach((val, idx) => {
      if (idx === 23) {
        embed.addFields({name: "And more...", value: "Page 2 coming soon."})
        return;
      }
      embed.addFields({
        name: val.game.name,
        value: convertToReadableTime(val.time),
      });
    });

    await interaction.reply({ embeds: [embed], files: [file] });
  }
}
