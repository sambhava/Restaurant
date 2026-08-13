import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    process.env[key] = val;
  }
});

const { sendSignupAcknowledgement, sendOwnerNotification, sendWelcomeEmail } = await import('../src/lib/email.ts');

console.log('--- TESTING TRANSACTIONAL EMAILS ---');

console.log('\n1. Sending Signup Acknowledgement Email...');
const res1 = await sendSignupAcknowledgement('sambhavajain512@gmail.com', 'Taste of India');
console.log('Result 1:', res1);

console.log('\n2. Sending Owner Notification Email...');
const res2 = await sendOwnerNotification({
  businessName: 'Taste of India',
  ownerName: 'Sambhava Jain',
  email: 'sambhavajain512@gmail.com',
  phone: '+91 8949684405',
  city: 'Jaipur',
  state: 'Rajasthan',
  outletCount: 1,
  tableCount: 12
});
console.log('Result 2:', res2);

console.log('\n3. Sending Welcome Activation Email...');
const res3 = await sendWelcomeEmail('sambhavajain512@gmail.com', 'Taste of India', 'WelcomePass999!');
console.log('Result 3:', res3);

console.log('\n--- ALL EMAIL TESTS COMPLETED ---');
