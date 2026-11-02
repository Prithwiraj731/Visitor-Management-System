import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Visitor = sequelize.define('Visitor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  company: {
    type: DataTypes.STRING,
    allowNull: true
  },
  photoUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  idProofType: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'National ID / Driving License'
  },
  idProofNumber: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'visitors',
  timestamps: true
});

