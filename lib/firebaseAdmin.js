import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'livik-tech-tool-dev',
  });
}

export default admin;
