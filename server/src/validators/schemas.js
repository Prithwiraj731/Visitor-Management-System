import { z } from 'zod';

const optionalTrimmedString = (max) =>
  z.preprocess(
    (val) => (val === null || val === undefined ? undefined : String(val).trim()),
    z.string().max(max).optional()
  );

const optionalUuidOrEmpty = z.preprocess(
  (val) => (val === null || val === undefined || val === '' ? undefined : String(val).trim()),
  z.string().uuid('Invalid UUID identifier').optional()
);

const optionalPhotoUrl = z
  .string()
  .trim()
  .max(500000, 'Photo payload exceeds maximum allowed size')
  .refine(
    (val) =>
      val === '' ||
      /^https:\/\/.+/i.test(val) ||
      /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(val),
    'Invalid photo format; must be HTTPS URL or PNG/JPEG/WEBP data URI'
  )
  .nullable()
  .optional();

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').max(120),
  password: z.string().min(1, 'Password is required').max(128)
});

export const createVisitSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(120),
  phone: z
    .string()
    .trim()
    .min(5, 'Valid phone number is required')
    .max(30, 'Phone number too long'),
  email: z
    .preprocess(
      (val) => (val === null || val === undefined ? '' : String(val).trim()),
      z.string().email('Invalid email address').max(120).or(z.literal(''))
    )
    .optional(),
  company: optionalTrimmedString(120),
  photoUrl: optionalPhotoUrl,
  idProofType: optionalTrimmedString(60),
  idProofNumber: optionalTrimmedString(80),
  hostId: z.string().trim().min(1, 'Host selection is required').max(120),
  hostName: optionalTrimmedString(120),
  host: optionalTrimmedString(120),
  departmentId: optionalUuidOrEmpty,
  purpose: z.string().trim().min(1, 'Purpose of visit is required').max(200),
  visitType: z.enum(['walk_in', 'pre_registered', 'recurring']).optional(),
  notes: optionalTrimmedString(500),
  autoCheckIn: z.boolean().optional()
});

export const visitQuerySchema = z.object({
  status: z
    .enum(['pending', 'approved', 'checked_in', 'checked_out', 'rejected', 'cancelled', ''])
    .optional(),
  departmentId: optionalUuidOrEmpty,
  hostId: optionalUuidOrEmpty,
  search: optionalTrimmedString(100),
  badgeNumber: optionalTrimmedString(60),
  fromDate: optionalTrimmedString(40),
  toDate: optionalTrimmedString(40),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const rejectVisitSchema = z.object({
  reason: optionalTrimmedString(300)
});

export const verifyQrSchema = z.object({
  qrData: z.string().trim().min(1, 'QR credential payload is required').max(2000)
});

export const createUserSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(120),
  email: z.string().trim().email('Valid email is required').max(120),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128),
  role: z.enum(['super_admin', 'admin', 'guard', 'host']),
  phone: optionalTrimmedString(30),
  departmentId: optionalUuidOrEmpty
});

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(1).max(120).optional(),
  phone: optionalTrimmedString(30).nullable(),
  departmentId: optionalUuidOrEmpty.nullable(),
  role: z.enum(['super_admin', 'admin', 'guard', 'host']).optional(),
  isActive: z.boolean().optional()
});

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(1, 'Department name is required').max(100),
  floor: optionalTrimmedString(100),
  building: optionalTrimmedString(100),
  headId: optionalUuidOrEmpty.nullable()
});

export const lockdownSchema = z.object({
  isLockdown: z.boolean(),
  reason: optionalTrimmedString(300)
});
