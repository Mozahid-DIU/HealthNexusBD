-- In-app notifications for doctor activity: an access request, access granted, a new visit.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'consent_request';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'access_granted';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'new_record';
