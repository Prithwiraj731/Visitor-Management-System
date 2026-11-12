import { sequelize, User, Department } from '../models/index.js';
import { logger } from '../utils/logger.js';

export const seedDatabase = async ({ force = false } = {}) => {
  try {
    const initialPassword = process.env.SEED_DEFAULT_PASSWORD || (
      process.env.NODE_ENV === 'production' ? null : 'Password123!'
    );

    if (!initialPassword) {
      throw new Error('SEED_DEFAULT_PASSWORD must be set when seeding in production.');
    }

    logger.info('Syncing database schema...');
    await sequelize.sync({ force });

    const existingUsers = await User.count();
    if (existingUsers > 0 && !force) {
      logger.info('Users already exist; skipping seed.');
      return;
    }

    logger.info('Creating departments...');
    const depts = await Department.bulkCreate([
      { name: 'Engineering & Technology', floor: '4th Floor', building: 'Tech Tower' },
      { name: 'Human Resources & Talent', floor: '2nd Floor', building: 'Main Building' },
      { name: 'Corporate Sales & Alliances', floor: '3rd Floor', building: 'Commercial Center' },
      { name: 'Executive Suite & Boardroom', floor: 'Penthouse', building: 'Executive Tower' }
    ]);

    logger.info('Creating staff users...');
    await User.create({
      fullName: 'Sarah Connor (Director)',
      email: 'admin@vms.local',
      password: initialPassword,
      role: 'super_admin',
      phone: '+1-555-0100',
      isActive: true
    });

    await User.create({
      fullName: 'Marcus Vance (Chief Security Officer)',
      email: 'guard@vms.local',
      password: initialPassword,
      role: 'guard',
      phone: '+1-555-0199',
      isActive: true
    });

    const hostEng = await User.create({
      fullName: 'Dr. Alan Grant (Principal Architect)',
      email: 'host.eng@vms.local',
      password: initialPassword,
      role: 'admin',
      phone: '+1-555-0102',
      departmentId: depts[0].id,
      isActive: true
    });

    const hostHr = await User.create({
      fullName: 'Elena Rostova (Head of Talent)',
      email: 'host.hr@vms.local',
      password: initialPassword,
      role: 'admin',
      phone: '+1-555-0103',
      departmentId: depts[1].id,
      isActive: true
    });

    const hostSales = await User.create({
      fullName: 'David Sterling (VP Partnerships)',
      email: 'host.sales@vms.local',
      password: initialPassword,
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

// Auto-run if executed directly via CLI (pass --force explicitly to reset tables)
if (process.argv[1]?.endsWith('seed.js')) {
  const forceReset = process.argv.includes('--force');
  seedDatabase({ force: forceReset }).then(() => {
    logger.info('Seed script finished.');
    process.exit(0);
  }).catch((err) => {
    logger.error(err);
    process.exit(1);
  });
}
