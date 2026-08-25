@echo off
echo.
echo ==========================================
echo NAWASENA HOLDING - Cloudflare Setup Script
echo ==========================================
echo.
echo 1. Ensure you are logged into Cloudflare.
call npx wrangler login
echo.
echo 2. Creating D1 Database 'nawasena-d1'...
call npx wrangler d1 create nawasena-d1
echo.
echo IMPORTANT: Please copy the 'database_id' from the output above 
echo and paste it into backend/wrangler.toml (replace "to-be-replaced").
echo.
pause
echo.
echo 3. Creating R2 Bucket 'nawasena-bucket'...
call npx wrangler r2 bucket create nawasena-bucket
echo.
echo 4. Executing D1 Migrations to remote database...
cd backend
call npx wrangler d1 execute nawasena-d1 --remote --file=migrations/0001_initial_schema.sql
echo.
echo 5. Setting up Secrets (You will be prompted to enter each secret)...
echo.
echo Enter your Shopee Partner ID:
call npx wrangler secret put SHOPEE_PARTNER_ID
echo.
echo Enter your Shopee Partner Key:
call npx wrangler secret put SHOPEE_PARTNER_KEY
echo.
echo Enter your JWT Secret:
call npx wrangler secret put JWT_SECRET
echo.
echo ==========================================
echo Setup Complete!
echo ==========================================
pause
