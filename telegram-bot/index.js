const { Telegraf } = require('telegraf');

// Создаем бота с токеном
const bot = new Telegraf('8218093650:AAFYQVpXavlm6JuPPumx95IZhilQr1ZuoPw');

// Команда /start
bot.start((ctx) => {
  ctx.reply(
    '👋 Добро пожаловать в Customer Analyzer Bot!\n\n' +
    'Доступные команды:\n' +
    '/help - Показать справку\n' +
    '/status - Проверить статус системы\n' +
    '/users - Показать количество пользователей'
  );
});

// Команда /help
bot.help((ctx) => {
  ctx.reply(
    '🤖 Customer Analyzer Bot - Справка\n\n' +
    'Этот бот помогает анализировать поведение пользователей.\n\n' +
    'Доступные команды:\n' +
    '/start - Начать работу с ботом\n' +
    '/status - Проверить статус системы\n' +
    '/users - Показать статистику пользователей'
  );
});

// Команда /status
bot.command('status', async (ctx) => {
  try {
    // Проверяем статус Backend API
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    
    ctx.reply(
      `📊 Статус системы:\n\n` +
      `🟢 Backend API: Работает\n` +
      `📈 Версия: ${data.version}\n` +
      `⏱️ Время работы: ${Math.floor(data.uptime / 60)} минут\n` +
      `💾 Память: ${Math.floor(data.memory.heapUsed / 1024 / 1024)} MB\n` +
      `🆔 PID: ${data.pid}`
    );
  } catch (error) {
    ctx.reply('❌ Ошибка при проверке статуса системы');
  }
});

// Команда /users
bot.command('users', async (ctx) => {
  try {
    // Здесь можно добавить запрос к API для получения статистики
    ctx.reply(
      `👥 Статистика пользователей:\n\n` +
      `📊 Всего пользователей: 1,234\n` +
      `🟢 Активных: 856\n` +
      `🛒 Совершили покупки: 342\n` +
      `📱 Новых сегодня: 23`
    );
  } catch (error) {
    ctx.reply('❌ Ошибка при получении статистики');
  }
});

// Обработка текстовых сообщений
bot.on('text', (ctx) => {
  ctx.reply(
    '🤔 Не понимаю эту команду.\n\n' +
    'Используйте /help для просмотра доступных команд.'
  );
});

// Запуск бота
bot.launch().then(() => {
  console.log('🤖 Telegram Bot запущен успешно!');
  console.log('📱 Токен: 8218093650:AAFYQVpXavlm6JuPPumx95IZhilQr1ZuoPw');
  console.log('🔗 Ссылка на бота: https://t.me/customer_analyzer_bot');
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
