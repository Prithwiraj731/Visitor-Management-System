import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

export const Visit = sequelize.define('Visit', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  visitorId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  hostId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  departmentId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  guardId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  purpose: {
    type: DataTypes.STRING,
    allowNull: false
  },
  visitType: {
    type: DataTypes.ENUM('walk_in', 'pre_registered', 'recurring'),
    defaultValue: 'walk_in'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'checked_in', 'checked_out', 'rejected', 'cancelled'),
    defaultValue: 'checked_in'
  },
  badgeNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  qrCode: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  checkOutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expectedCheckIn: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'visits',
  timestamps: true
});

