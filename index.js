const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const schedule = require("node-schedule");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let prefix = "t";
const reminders = new Map();
let reminderCounter = 0;

client.once("ready", () => {
  console.log("Ready!");
  client.user.setActivity("reminders | !help", { type: ActivityType.Watching });
});

client.on("messageCreate", async (message) => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(" ");
  const command = args.shift().toLowerCase();

  if (command === "remind") {
    const timeArg = args.shift();
    let repeat = false;
    if (args[args.length - 1] === "repeat") {
      repeat = true;
      args.pop();
    }
    const reminderMsg = args.join(" ");

    if (!timeArg || !reminderMsg) {
      return message.channel.send(
        "```Please provide the time and the reminder message.```"
      );
    }

    const time = parseTime(timeArg);
    if (!time) {
      return message.channel.send(
        "```Invalid time format. Use 1s, 1m, 1h, 1d, 1mm, 1y, etc.```"
      );
    }

    reminderCounter += 1;

    const scheduleReminder = () => {
      const reminderTime = new Date(Date.now() + time);
      const job = schedule.scheduleJob(reminderTime, function () {
        message.channel.send(`<@${message.author.id}> ${reminderMsg}`);
        if (repeat) {
          scheduleReminder();
        } else {
          reminders.delete(reminderCounter);
        }
      });
      reminders.set(reminderCounter, {
        job,
        reminderMsg,
        timeArg,
        repeat,
        userId: message.author.id,
      });
    };

    scheduleReminder();
    message.channel.send(
      `\`\`\`Reminder set for ${timeArg} from now. Reminder ID: ${reminderCounter}\`\`\``
    );
  } else if (command === "prefix") {
    if (args.length > 0) {
      prefix = args[0];
      message.channel.send(`\`\`\`Prefix set to: ${prefix}\`\`\``);
    } else {
      message.channel.send("```Please provide a new prefix.```");
    }
  } else if (command === "ping") {
    const ping = Date.now() - message.createdTimestamp;
    message.channel.send(`\`\`\`Pong! Your ping is ${ping}ms\`\`\``);
  } else if (command === "reminders") {
    if (reminders.size === 0) {
      message.channel.send("```No active reminders.```");
    } else {
      let reminderList = "```Active reminders:\n";
      reminders.forEach((value, key) => {
        reminderList += `ID: ${key} - Message: "${value.reminderMsg}" - Time: ${value.timeArg} - Repeat: ${value.repeat}\n`;
      });
      reminderList += "```";
      message.channel.send(reminderList);
    }
  } else if (command === "deremind") {
    const reminderId = parseInt(args[0]);
    if (reminders.has(reminderId)) {
      reminders.get(reminderId).job.cancel();
      reminders.delete(reminderId);
      message.channel.send(
        `\`\`\`Reminder ID ${reminderId} has been deleted.\`\`\``
      );
    } else {
      message.channel.send("```Invalid reminder ID.```");
    }
  } else if (command === "help") {
    const helpMessage = `\`\`\`
---------------------------------

Set a reminder    - ${prefix} remind <time><parameter> <message> [<repeat> for repetition] 

Change prefix     - ${prefix} prefix <new_prefix>

Check ping!       - ${prefix} ping 

Active reminders  - ${prefix} reminders

Delete reminder   - ${prefix} deremind <reminder_id>

help              - ${prefix} help

---------------------------------

time <parameter> -
s = second
m = minute
h = hour
d = day
mm = month (30d)
y = year  (365d)

---------------------------------

NOTE: Using the bot for continuous repetition with intervals of less than 10 minutes violates Discord's moderation policy.

---------------------------------

\`\`\``;
    message.channel.send(helpMessage);
  }
});

function parseTime(timeStr) {
  const match = timeStr.match(/^(\d+)([smhdmmy])$/);
  if (!match) return null;

  const num = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return num * 1000;
    case "m":
      return num * 60 * 1000;
    case "h":
      return num * 60 * 60 * 1000;
    case "d":
      return num * 24 * 60 * 60 * 1000;
    case "mm":
      return num * 30 * 24 * 60 * 60 * 1000;
    case "y":
      return num * 365 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

client.login("YOUR_BOT_TOKEN");
