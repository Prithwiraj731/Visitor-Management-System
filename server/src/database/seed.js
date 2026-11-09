import { sequelize, User, Department, Visitor, Visit, Notification } from '../models/index.js';
import QRCode from 'qrcode';
import { logger } from '../utils/logger.js';

export const seedDatabase = async () => {
  try {
    logger.info('Syncing database schema...');
    await sequelize.sync({ force: true });

    logger.info('Creating departments...');
    const depts = await Department.bulkCreate([
      { name: 'Engineering & Technology', floor: '4th Floor', building: 'Tech Tower' },
      { name: 'Human Resources & Talent', floor: '2nd Floor', building: 'Main Building' },
      { name: 'Corporate Sales & Alliances', floor: '3rd Floor', building: 'Commercial Center' },
      { name: 'Executive Suite & Boardroom', floor: 'Penthouse', building: 'Executive Tower' }
    ]);

    logger.info('Creating staff users...');
    const adminUser = await User.create({
      fullName: 'Sarah Connor (Director)',
      email: 'admin@vms.local',
      password: 'Password123!',
      role: 'super_admin',
      phone: '+1-555-0100',
      isActive: true
    });

    const guardUser = await User.create({
      fullName: 'Marcus Vance (Chief Security Officer)',
      email: 'guard@vms.local',
      password: 'Password123!',
      role: 'guard',
      phone: '+1-555-0199',
      isActive: true
    });

    const hostEng = await User.create({
      fullName: 'Dr. Alan Grant (Principal Architect)',
      email: 'host.eng@vms.local',
      password: 'Password123!',
      role: 'admin',
      phone: '+1-555-0102',
      departmentId: depts[0].id,
      isActive: true
    });

    const hostHr = await User.create({
      fullName: 'Elena Rostova (Head of Talent)',
      email: 'host.hr@vms.local',
      password: 'Password123!',
      role: 'admin',
      phone: '+1-555-0103',
      departmentId: depts[1].id,
      isActive: true
    });

    const hostSales = await User.create({
      fullName: 'David Sterling (VP Partnerships)',
      email: 'host.sales@vms.local',
      password: 'Password123!',
      role: 'admin',
      phone: '+1-555-0104',
      departmentId: depts[2].id,
      isActive: true
    });

    // Link department heads
    await depts[0].update({ headId: hostEng.id });
    await depts[1].update({ headId: hostHr.id });
    await depts[2].update({ headId: hostSales.id });

    logger.info('Database seeding completed successfully (0 dummy visitors, clean database ready for live check-ins).');
  } catch (err) {
    logger.error('Error during database seeding:', err);
    throw err;
  }
};

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().then(() => {
    logger.info('Seed script finished.');
    process.exit(0);
  }).catch((err) => {
    logger.error(err);
    process.exit(1);
  });
}

