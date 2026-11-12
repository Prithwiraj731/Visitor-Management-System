import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const SystemSetting = sequelize.define('SystemSetting', {
  key: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  value: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  }
}, {
  tableName: 'system_settings',
  timestamps: true
});
