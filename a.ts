import { Bot, InlineKeyboard } from "grammy";

// 存储机器人“喊叫”状态
let screaming = false;

// 创建一个新的机器人
const bot = new Bot("<YOUR_BOT_TOKEN_HERE>");

// 处理 /scream 命令
bot.command("scream", () => {
  screaming = true;
});

// 处理 /whisper 命令
bot.command("whisper", () => {
  screaming = false;
});

// 预设菜单文案
const firstMenu =
  "<b>Menu 1</b>\n\nA beautiful menu with a shiny inline button.";
const secondMenu =
  "<b>Menu 2</b>\n\nA better menu with even more shiny inline buttons.";

// 预设按钮文案
const nextButton = "Next";
const backButton = "Back";
const tutorialButton = "Tutorial";

// 构建内联键盘
const firstMenuMarkup = new InlineKeyboard().text(nextButton, nextButton);

const secondMenuMarkup = new InlineKeyboard()
  .text(backButton, backButton)
  .text(tutorialButton, "https://core.telegram.org/bots/tutorial");

// 发送包含上面预设内联按钮的菜单
bot.command("menu", async (ctx) => {
  await ctx.reply(firstMenu, {
    parse_mode: "HTML",
    reply_markup: firstMenuMarkup,
  });
});

// 处理菜单上的“返回”按钮
bot.callbackQuery(backButton, async (ctx) => {
  // 用对应的菜单内容更新消息
  await ctx.editMessageText(firstMenu, {
    reply_markup: firstMenuMarkup,
    parse_mode: "HTML",
  });
});

// 处理菜单上的“下一步”按钮
bot.callbackQuery(nextButton, async (ctx) => {
  // 用对应的菜单内容更新消息
  await ctx.editMessageText(secondMenu, {
    reply_markup: secondMenuMarkup,
    parse_mode: "HTML",
  });
});

// 将其添加为来自 Bot API 消息的处理器
bot.on("message", async (ctx) => {
  // 打印到控制台
  console.log(
    `${ctx.from.first_name} wrote ${
      "text" in ctx.message ? ctx.message.text : ""
    }`
  );

  if (screaming && ctx.message.text) {
    // 以“喊叫”形式回复消息
    await ctx.reply(ctx.message.text.toUpperCase(), {
      entities: ctx.message.entities,
    });
  } else {
    // 等同于转发，但不会带上发送者名称
    await ctx.copyMessage(ctx.message.chat.id);
  }
});

// 启动机器人
bot.start();
