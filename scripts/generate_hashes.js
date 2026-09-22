const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const credsPath = path.resolve(__dirname, '../output/admin-credentials.json');
const credsData = JSON.parse(fs.readFileSync(credsPath, 'utf8'));

const allAdmins = [];
if (credsData.mainMasterAdmin) allAdmins.push(credsData.mainMasterAdmin);
if (credsData.maleMasterAdmin) allAdmins.push(credsData.maleMasterAdmin);
if (credsData.femaleMasterAdmin) allAdmins.push(credsData.femaleMasterAdmin);
if (credsData.mainAdmin) allAdmins.push(credsData.mainAdmin);
if (Array.isArray(credsData.zoneAdmins)) allAdmins.push(...credsData.zoneAdmins);
if (Array.isArray(credsData.centerAdmins)) allAdmins.push(...credsData.centerAdmins);

console.log(`Hashing passwords for ${allAdmins.length} admin accounts...`);

const hashes = {};
for (const admin of allAdmins) {
  if (admin.email && admin.password) {
    hashes[admin.email.toLowerCase()] = bcrypt.hashSync(admin.password, 10);
  }
}

const outDir = path.resolve(__dirname, '../tmp');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const outFile = path.join(outDir, 'hashed_passwords.json');
fs.writeFileSync(outFile, JSON.stringify(hashes, null, 2));
console.log(`Successfully generated ${Object.keys(hashes).length} hashes in ${outFile}`);
