@echo off
echo Installing Netlify CLI...
"C:\Program Files\nodejs\npm.cmd" install -g netlify-cli

echo.
echo Logging in to Netlify...
"C:\Program Files\nodejs\npx.cmd" netlify login

echo.
echo Initializing site...
"C:\Program Files\nodejs\npx.cmd" netlify init

echo.
echo Setting environment variables...
"C:\Program Files\nodejs\npx.cmd" netlify env:set OPENAI_API_KEY YOUR_API_KEY_HERE
"C:\Program Files\nodejs\npx.cmd" netlify env:set MODEL gpt-4o-mini

echo.
echo Deploying to production...
"C:\Program Files\nodejs\npx.cmd" netlify deploy --build --prod

echo.
echo Deployment complete!
pause
