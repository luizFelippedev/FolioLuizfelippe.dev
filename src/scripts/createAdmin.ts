import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import connectDatabase, { disconnectDatabase } from '@database/connection';
import UserModel from '@models/User.model';
import logger from '@utils/logger/logger';

const parseArgs = () => {
  const argv = yargs(hideBin(process.argv))
    .option('email', {
      type: 'string',
      demandOption: true,
      describe: 'Email do usuário admin'
    })
    .option('password', {
      type: 'string',
      demandOption: true,
      describe: 'Senha em texto puro para o admin'
    })
    .option('name', {
      type: 'string',
      default: 'Admin User',
      describe: 'Nome completo do admin'
    })
    .help()
    .example(
      'npm run create-admin -- --email admin@example.com --password 123456 --name "Luiz"',
      'Cria ou atualiza um administrador'
    )
    .parseSync();

  return {
    email: argv.email as string,
    password: argv.password as string,
    name: argv.name as string
  };
};

const main = async () => {
  const { email, password, name } = parseArgs();
  logger.info(`Criando administrador para ${email}`);

  await connectDatabase();

  try {
    const existing = await UserModel.findOne({ email });

    if (existing) {
      existing.name = name;
      existing.password = password;
      existing.role = 'admin';
      await existing.save();
      logger.info(`Usuário admin atualizado: ${email}`);
    } else {
      await UserModel.create({
        name,
        email,
        password,
        role: 'admin',
        isActive: true
      });
      logger.info(`Usuário admin criado: ${email}`);
    }
  } catch (error) {
    logger.error('Erro ao criar admin', { error });
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
};

void main();
