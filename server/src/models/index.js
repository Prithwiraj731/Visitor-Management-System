import { sequelize } from '../config/database.js';
import { User } from './User.js';
import { Department } from './Department.js';
import { Visitor } from './Visitor.js';
import { Visit } from './Visit.js';
import { Notification } from './Notification.js';
import { AuditLog } from './AuditLog.js';
import { SystemSetting } from './SystemSetting.js';

// Department & User (Head)
Department.belongsTo(User, { as: 'head', foreignKey: 'headId' });
User.belongsTo(Department, { as: 'department', foreignKey: 'departmentId' });
Department.hasMany(User, { as: 'members', foreignKey: 'departmentId' });

// Visit & Visitor
Visit.belongsTo(Visitor, { as: 'visitor', foreignKey: 'visitorId' });
Visitor.hasMany(Visit, { as: 'visits', foreignKey: 'visitorId' });

// Visit & Host
Visit.belongsTo(User, { as: 'host', foreignKey: 'hostId' });
User.hasMany(Visit, { as: 'hostedVisits', foreignKey: 'hostId' });

// Visit & Guard
Visit.belongsTo(User, { as: 'guard', foreignKey: 'guardId' });

// Visit & Department
Visit.belongsTo(Department, { as: 'department', foreignKey: 'departmentId' });
Department.hasMany(Visit, { as: 'visits', foreignKey: 'departmentId' });

// Notification & User
Notification.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Notification.belongsTo(Visit, { as: 'visit', foreignKey: 'visitId' });
User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId' });

// AuditLog & User
AuditLog.belongsTo(User, { as: 'user', foreignKey: 'userId' });

export {
  sequelize,
  User,
  Department,
  Visitor,
  Visit,
  Notification,
  AuditLog,
  SystemSetting
};

