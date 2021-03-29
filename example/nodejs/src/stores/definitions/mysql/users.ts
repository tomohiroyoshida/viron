import { Model, Sequelize, DataTypes, ModelCtor } from 'sequelize';
import { User, UserCreationAttributes } from '../../../domains/models/user';

export const name = 'users';

export class UserModel extends Model<User, UserCreationAttributes> {
  id!: number;
  name!: string;
  nickName!: string;
  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export type UserModelCtor = ModelCtor<UserModel>;

export const createModel = (s: Sequelize): UserModelCtor => {
  const Model = s.define<UserModel>(
    name,
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nickName: {
        type: DataTypes.STRING,
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
