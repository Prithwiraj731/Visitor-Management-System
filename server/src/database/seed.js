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
      role: 'host',
      phone: '+1-555-0102',
      departmentId: depts[0].id,
      isActive: true
    });

    const hostHr = await User.create({
      fullName: 'Elena Rostova (Head of Talent)',
      email: 'host.hr@vms.local',
      password: 'Password123!',
      role: 'host',
      phone: '+1-555-0103',
      departmentId: depts[1].id,
      isActive: true
    });

    const hostSales = await User.create({
      fullName: 'David Sterling (VP Partnerships)',
      email: 'host.sales@vms.local',
      password: 'Password123!',
      role: 'host',
      phone: '+1-555-0104',
      departmentId: depts[2].id,
      isActive: true
    });

    // Link department heads
    await depts[0].update({ headId: hostEng.id });
    await depts[1].update({ headId: hostHr.id });
    await depts[2].update({ headId: hostSales.id });

    logger.info('Creating initial visitors & visits...');

    const sampleVisitors = [
      {
        fullName: 'Alex Mercer',
        email: 'alex.m@gentek.com',
        phone: '+1-555-9011',
        company: 'GenTek Dynamics',
        idProofType: 'Passport',
        idProofNumber: 'P-987211-US'
      },
      {
        fullName: 'Claire Redfield',
        email: 'claire@terrasave.org',
        phone: '+1-555-9012',
        company: 'TerraSave Global',
        idProofType: 'National ID',
        idProofNumber: 'ID-4421-B'
      },
      {
        fullName: 'Gordon Freeman',
        email: 'gordon@blackmesa.gov',
        phone: '+1-555-9013',
        company: 'Black Mesa Research',
        idProofType: 'Driving License',
        idProofNumber: 'DL-88219-NV'
      },
      {
        fullName: 'Isaac Clarke',
        email: 'isaac@concordance.corp',
        phone: '+1-555-9014',
        company: 'Concordance Corp',
        idProofType: 'Government Badge',
        idProofNumber: 'CEC-7762'
      },
      {
        fullName: 'Maya Lin',
        email: 'maya.lin@vertex-solutions.io',
        phone: '+1-555-9015',
        company: 'Vertex Solutions',
        idProofType: 'Driving License',
        idProofNumber: 'DL-11029-CA'
      }
    ];

    const visitors = await Visitor.bulkCreate(sampleVisitors);

    // Create realistic visits (Live Inside, Completed, Pending)
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const generateQr = async (text) => {
      return QRCode.toDataURL(text, { width: 300, margin: 1 });
    };

    const qr1 = await generateQr(JSON.stringify({ badge: 'VMS-20261103-1001', visitor: visitors[0].fullName }));
    const qr2 = await generateQr(JSON.stringify({ badge: 'VMS-20261103-1002', visitor: visitors[1].fullName }));
    const qr3 = await generateQr(JSON.stringify({ badge: 'VMS-20261103-1003', visitor: visitors[2].fullName }));
    const qr4 = await generateQr(JSON.stringify({ badge: 'VMS-20261103-1004', visitor: visitors[3].fullName }));
    const qr5 = await generateQr(JSON.stringify({ badge: 'VMS-20261103-1005', visitor: visitors[4].fullName }));

    // 1. Live inside (Checked In)
    const v1 = await Visit.create({
      visitorId: visitors[0].id,
      hostId: hostEng.id,
      departmentId: depts[0].id,
      guardId: guardUser.id,
      purpose: 'Architecture Review & Cloud Migration Audit',
      visitType: 'walk_in',
      status: 'checked_in',
      badgeNumber: 'VMS-20261103-1001',
      qrCode: qr1,
      checkInTime: twoHoursAgo,
      notes: 'Carrying developer laptop and access tokens'
    });

    const v2 = await Visit.create({
      visitorId: visitors[1].id,
      hostId: hostHr.id,
      departmentId: depts[1].id,
      guardId: guardUser.id,
      purpose: 'Senior Staff Interview - Round 3',
      visitType: 'walk_in',
      status: 'checked_in',
      badgeNumber: 'VMS-20261103-1002',
      qrCode: qr2,
      checkInTime: thirtyMinAgo,
      notes: 'Visitor requested visitor guest badge for cafeteria'
    });

    // 2. Pending Approval (Pre-registered)
    const v3 = await Visit.create({
      visitorId: visitors[2].id,
      hostId: hostEng.id,
      departmentId: depts[0].id,
      purpose: 'Quantum Computing Feasibility Discussion',
      visitType: 'pre_registered',
      status: 'pending',
      badgeNumber: 'VMS-20261103-1003',
      qrCode: qr3,
      notes: 'Requires visitor parking reservation'
    });

    // 3. Checked Out Earlier Today
    await Visit.create({
      visitorId: visitors[3].id,
      hostId: hostSales.id,
      departmentId: depts[2].id,
      guardId: guardUser.id,
      purpose: 'Annual Hardware Contract Renewal',
      visitType: 'walk_in',
      status: 'checked_out',
      badgeNumber: 'VMS-20261103-1004',
      qrCode: qr4,
      checkInTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      checkOutTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      notes: 'Meeting concluded on schedule'
    });

    // 4. Completed Yesterday
    await Visit.create({
      visitorId: visitors[4].id,
      hostId: hostSales.id,
      departmentId: depts[2].id,
      guardId: guardUser.id,
      purpose: 'Supplier Quality Assessment',
      visitType: 'walk_in',
      status: 'checked_out',
      badgeNumber: 'VMS-20261102-1005',
      qrCode: qr5,
      checkInTime: new Date(yesterday.getTime() - 3 * 60 * 60 * 1000),
      checkOutTime: yesterday,
      notes: 'Signed NDA at front desk'
    });

    // Create Notification items
    await Notification.create({
      userId: hostEng.id,
      visitId: v1.id,
      title: 'Visitor Arrived',
      message: `${visitors[0].fullName} from ${visitors[0].company} checked in at Front Gate.`,
      type: 'arrival',
      isRead: false
    });

    await Notification.create({
      userId: hostEng.id,
      visitId: v3.id,
      title: 'Visit Approval Requested',
      message: `${visitors[2].fullName} from ${visitors[2].company} submitted a visit request for approval.`,
      type: 'approval_request',
      isRead: false
    });

    await Notification.create({
      userId: hostHr.id,
      visitId: v2.id,
      title: 'Interview Candidate Arrived',
      message: `${visitors[1].fullName} is waiting in the 2nd Floor lobby.`,
      type: 'arrival',
      isRead: true
    });

    logger.info('Database seeding completed successfully!');
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

