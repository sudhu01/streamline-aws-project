require('dotenv/config');
const ngrok = require('ngrok');
const PORT = process.env.PORT || 4000;

(async function() {
  try {
    console.log(`Starting ngrok tunnel for port ${PORT}...`);
    
    // For ngrok v5 beta, use the connect method
    const url = await ngrok.connect(parseInt(PORT));
    
    console.log('\n✅ Ngrok tunnel started successfully!');
    console.log(`🌐 Public HTTPS URL: ${url}`);
    console.log(`🔗 Webhook URL for Clerk: ${url}/api/auth/webhook`);
    console.log('\nPress Ctrl+C to stop the tunnel.\n');
    
    // Keep the process alive and handle cleanup
    process.on('SIGINT', async () => {
      console.log('\n\nStopping ngrok tunnel...');
      try {
        await ngrok.disconnect();
        await ngrok.kill();
      } catch (e) {
        // Ignore cleanup errors
      }
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      try {
        await ngrok.disconnect();
        await ngrok.kill();
      } catch (e) {}
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start ngrok:', error.message);
    if (error.message.includes('ngrok')) {
      console.error('\n💡 Make sure ngrok is properly installed and authenticated.');
      console.error('   If you have an ngrok account, set NGROK_AUTH_TOKEN in your .env file.');
    }
    process.exit(1);
  }
})();

