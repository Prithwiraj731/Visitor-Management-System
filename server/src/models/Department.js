import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  floor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  building: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Main Tower'
  },
  headId: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'departments',
  timestamps: true
});

