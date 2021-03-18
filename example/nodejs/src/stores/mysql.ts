import { modeMysql, storeType } from '../constant';
import { MysqlConfigure } from '../configure';
import { createConnection } from './connection/mysql';
import {
  MysqlDefinitions,
  definitions,
  MysqlModels,
  models,
} from './definitions/mysql';
import { Sequelize } from 'sequelize';

export interface MysqlStore {
  type: storeType;
  definitions: MysqlDefinitions;
  models: MysqlModels;
  instance: Sequelize;
}
export const preflight = async (
  config: MysqlConfigure
): Promise<MysqlStore> => {
  const s = await createConnection(config.connectOptions);

  const ms = await models(s);

  // create tables
  await s.drop({ cascade: true });
  await s.sync({ alter: true });

  return {
    type: modeMysql,
    definitions: definitions,
    models: ms,
    instance: s,
  };
};
