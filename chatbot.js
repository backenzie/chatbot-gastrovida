// leitor de qr code
const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js'); // Mudança Buttons
const client = new Client();

let lastQrTime = 0;
const qrInterval = 5 * 60 * 1000; // 5 minutos em milissegundos

client.on('qr', qr => {
  const currentTime = Date.now();
  if (currentTime - lastQrTime > qrInterval) {
    qrcode.generate(qr, {small: true});
    lastQrTime = currentTime;
  }
});

client.on('ready', () => {
  console.log('Tudo certo! WhatsApp conectado.');
});

client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms));

async function sendMainMenu(client, msg, userId) {
  const chat = await msg.getChat();
  if (!userState[userId]) {
    userState[userId] = {};
  }
  await delay(2000);
  await chat.sendStateTyping();
  await delay(2000);
  const contact = await msg.getContact();
  const name = contact.pushname;
  await client.sendMessage(msg.from,'Olá! '+ name.split(" ")[0] + ' Sou o assistente virtual da Gastrovida. Como posso ajudar você hoje? Por favor, digite uma das opções abaixo:\n\n1 - Horários de funcionamento.\n2 - Agendar uma consulta. \n3 - Agendar um exame.');     
}

async function resetState(userId) {
  userState[userId] = {};
}

const convenios = ['CASSI', 'IMPCG', 'CASSEMS', 'SERVIMED - IMPCG', 'TELOS', 'PAS-UFMS', 'FAMEH/MP',
'PAME', 'SÃO FRANCISCO', 'CAPESAÚDE', 'POSTAL SAÚDE', 'ASSEFAZ', 'SANTA CASA SAÚDE', 
'NIPOASSIST', 'PAX', 'LIFE', 'CORREIOS SAÚDE', 'CASEMBRAPA', 'UNISAÚDE', 'UNIMED', 
'AMS PETROBRAS', 'EMBRATEL', 'OESTE SAÚDE', 'AMIL', 'CABESP', 'EL KADRI', 'ELOSAÚDE', 'OUTRO - CONFIRMAR DISPONIBILIDADE']

const userState = {};

const isWithinWorkingHours = () => {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  if (
    (day >= 1 && day <= 5 && hour >= 7 && hour < 18) || 
    (day === 6 && hour >= 7 && hour < 12)
  ) {
    return true;
  }
  return false;
};

client.on('message', async msg => {
  const chat = await msg.getChat();
  const userId = msg.from;

  if (!userState[userId]) {
    userState[userId] = {};
  }

  if (!isWithinWorkingHours() && userState[userId].step === 'mainMenu') {
    await client.sendMessage(
      msg.from,
      'Nosso horário de atendimento é de segunda a sexta das 7h às 18h, e aos sábados das 7h às 12h. Em breve entraremos em contato com você. Obrigado!'
    );
    return;
  }

  const userStep = userState[userId].step || 'mainMenu';

  switch (userStep) {
    case 'mainMenu':
      if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola)/i)) {
        await sendMainMenu(client, msg, userId);
      } else if (msg.body === '1') {
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(
          msg.from,
          'Funcionamos de segunda a sexta das 7:00 ás 18:00, e aos sábados das 7:00 ás 12:00'
        );
        await sendMainMenu(client, msg, userId);
      } else if (msg.body === '2') {
        userState[userId].step = 'chooseDoctor';
        userState[userId].category = 'Consulta';
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(
          msg.from,
          '*Escolha o médico com quem deseja marcar sua consulta:*\n\n1 - Dr. Carlos\n2 - Dr. Jorge\n3 - Dra. Jessica\n4 - Voltar ao menu principal'
        );
      } else if (msg.body === '3') {
        userState[userId].step = 'chooseExamen';
        userState[userId].category = 'Examen';
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(
          msg.from,
          '*Escolha o exame que deseja realizar:*\n\n1 - Endoscopia Digestiva Alta\n2 - Colonoscopia\n3 - Teste de Hidrogênio Expirado\n4 - Voltar ao menu principal'
        );
      } else {
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(
          msg.from,
          'Não entendi sua solicitação. As opções disponíveis são:\n\n1 - Horários de funcionamento.\n2 - Agendar uma consulta.\n3 - Agendar um exame.'
        );
      }
    break;

    case 'chooseDoctor':
      switch (msg.body) {
        case '1':
          userState[userId].doctor = 'Dr. Carlos';
          break;
        case '2':
          userState[userId].doctor = 'Dr. Jorge';
          break;
        case '3':
          userState[userId].doctor = 'Dra. Jessica';
          break;
        case '4':
          await sendMainMenu(client, msg, userId);
          return;
        default:
          await client.sendMessage(
            msg.from,
            '*Escolha inválida. Por favor, escolha um médico:*\n\n1 - Dr. Carlos\n2 - Dr. Jorge\n3 - Dra. Jessica'
          );
          return;
      }
      userState[userId].step = 'chooseType';
      await delay(2000);
      await chat.sendStateTyping();
      await delay(2000);
      await client.sendMessage(
        msg.from,
        '*Qual é o seu tipo de atendimento?*\n\n1 - Convênio Médico\n2 - Particular'
      );
    break;

    case 'chooseExamen':
    switch (msg.body) {
      case '1':
        userState[userId].examen = 'Endoscopia Digestiva Alta';
        break;
      case '2':
        userState[userId].examen = 'Colonoscopia';
        break;
      case '3':
        userState[userId].examen = 'Teste de Hidrogênio Expirado';
        break;
      case '4':
        await sendMainMenu(client, msg, userId);
        return;
      default:
        await client.sendMessage(
          msg.from,
          '*Escolha inválida. Por favor, escolha um exame:*\n\n1 - Endoscopia Digestiva Alta\n2 - Colonoscopia\n3 - Teste de Hidrogênio Expirado'
        );
        return;
    }
    userState[userId].step = 'chooseType';
    await delay(2000);
    await chat.sendStateTyping();
    await delay(2000);
    await client.sendMessage(
      msg.from,
      '*Qual é o seu tipo de atendimento?*\n\n1 - Convênio Médico\n2 - Particular'
    );
    break;

    case 'chooseType':
      if (msg.body === '1') {
        userState[userId].type = 'Convênio Médico';
        userState[userId].step = 'chooseConvenio';
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(
          msg.from,
          'Escolha o seu convênio:\n\n' +
            convenios.map((convenio, index) => `*${index + 1} - ${convenio}*`).join('\n')
        );
      } else if (msg.body === '2') {
        userState[userId].type = 'Particular';
        userState[userId].step = 'completed';
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(
          msg.from,
          `Pronto! Sua solicitação foi registrada. Nossa equipe entrará em contato para confirmar os detalhes. Se precisar de algo mais, estou aqui para ajudar!\n\nDetalhes do seu agendamento - ${userState[user.id].category} - ${userState[userId].doctor || userState[userId].examen} - atendimento ${userState[userId].type}`
        );
      } else {
        await client.sendMessage(
          msg.from,
          '*Escolha inválida. Por favor, escolha o tipo de atendimento:*\n\n1 - Convênio Médico\n2 - Particular'
        );
      }
    break;

    case 'chooseConvenio':
      const convenioIndex = parseInt(msg.body) - 1;
      if (convenioIndex >= 0 && convenioIndex < convenios.length) {
        userState[userId].convenio = convenios[convenioIndex];
        userState[userId].step = 'completed';
        await delay(2000);
        await chat.sendStateTyping();
        await delay(2000);
        await client.sendMessage(
          msg.from,
          `Pronto! Sua solicitação foi registrada. Nossa equipe entrará em contato para confirmar os detalhes. Se precisar de algo mais, estou aqui para ajudar!\n\nDetalhes do seu agendamento - ${userState[user.id].category} - ${userState[userId].doctor || userState[userId].examen} - atendimento ${userState[userId].type}, convênio: ${userState[userId].convenio}`
        );
      } else {
        await client.sendMessage(
          msg.from,
          '*Escolha inválida. Por favor, escolha um convênio da lista acima:*'
        );
      }
      break;

      case 'completed':
        if (msg.body.match(/(ajuda|atendimento|olá|ola|oi|dia|tarde|noite|falar)/i)) {
          await client.sendMessage(
            msg.from,
            'Sua solicitação já foi registrada, um atendente irá auxiliá-lo. É só aguardar um pouco.\n\nCaso deseje excluir sua solicitação e começar novamente, digite *RECOMEÇAR*.'
          );
        } else if (msg.body.toLowerCase() === 'recomeçar') {
          await resetState(userId);
          await sendMainMenu(client, msg, userId);
        } else {
          await client.sendMessage(
            msg.from,
            'Não entendi sua mensagem. Se precisar de ajuda, digite *ajuda* ou *recomeçar*.'
          );
        }
      break;
  }
});