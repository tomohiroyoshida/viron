import { Model, Sequelize, DataTypes, ModelCtor } from 'sequelize';
import { AuditLog, AuditLogCreateAttributes } from '../../../domains/auditlog';

export const name = 'auditlogs';

export class AuditLogModel extends Model<AuditLog, AuditLogCreateAttributes> {
  id!: number;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export type AuditLogModelCtor = ModelCtor<AuditLogModel>;

export const createModel = (s: Sequelize): ModelCtor<AuditLogModel> => {
  const Model = s.define<AuditLogModel>(
    name,
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      requestMethod: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      requestUri: {
        type: DataTypes.STRING(2048),
        allowNull: true,
      },
      sourceIp: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      requestBody: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      statusCode: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      timestamps: true,
      deletedAt: false,
      charset: 'utf8',
      indexes: [],
    }
  );

  return Model;
};