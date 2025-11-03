-- AlterTable: Add password field to Doctor
ALTER TABLE "Doctor" ADD COLUMN "password" TEXT;

-- Make password required after migration
-- Note: Existing doctors will need to set passwords via /api/auth/register or seed script

