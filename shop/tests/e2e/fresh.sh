#!/bin/bash
# Restart the production server on a fresh demo database (test data only).
# WARNING: deletes the local dev.db. Refuses to run unless E2E_RESET_DB=1 is set.
if [ "$E2E_RESET_DB" != "1" ]; then echo "Refusing: this deletes dev.db. Run with E2E_RESET_DB=1 if that is OK."; exit 1; fi
ps aux | grep -E "next-server|next start" | grep -v grep | awk '{print $2}' | xargs -r kill
sleep 1
cd "$(dirname "$0")/../.."
rm -f dev.db && npx prisma migrate deploy >/dev/null 2>&1 && npm run db:seed 2>&1 | grep Seeded
rm -f storage/uploads/*.png storage/uploads/*.jpg storage/uploads/*.webp
(MAIL_TRANSPORT=console PORT=3100 nohup npm start > "${LOG:-/tmp/bts-e2e.log}" 2>&1 &)
for i in $(seq 1 30); do curl -s -o /dev/null http://localhost:3100/ && break; sleep 1; done
