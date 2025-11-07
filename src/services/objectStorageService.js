const { Storage } = require('@google-cloud/storage');
const { randomUUID } = require('crypto');
const { logInfo, logError } = require('../utils/logger');

const REPLIT_SIDECAR_ENDPOINT = 'http://127.0.0.1:1106';

class ObjectStorageService {
  constructor() {
    this.storage = new Storage({
      credentials: {
        audience: 'replit',
        subject_token_type: 'access_token',
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: 'external_account',
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: {
            type: 'json',
            subject_token_field_name: 'access_token'
          }
        },
        universe_domain: 'googleapis.com'
      },
      projectId: ''
    });
  }

  getPrivateObjectDir() {
    const dir = process.env.PRIVATE_OBJECT_DIR || '';
    if (!dir) {
      throw new Error(
        'PRIVATE_OBJECT_DIR לא מוגדר. צור bucket ב-Object Storage והגדר את המשתנה PRIVATE_OBJECT_DIR'
      );
    }
    return dir;
  }

  async getUploadURL(fileExtension = 'jpg') {
    try {
      const objectId = randomUUID();
      const privateObjectDir = this.getPrivateObjectDir();
      const fullPath = `${privateObjectDir}/landing-pages/${objectId}${fileExtension}`;

      const { bucketName, objectName } = this.parseObjectPath(fullPath);

      const signedUrl = await this.signObjectURL({
        bucketName,
        objectName,
        method: 'PUT',
        ttlSec: 900
      });

      logInfo('Upload URL generated', { objectId, bucketName });

      return {
        uploadURL: signedUrl,
        objectPath: `/objects/landing-pages/${objectId}${fileExtension}`,
        objectId
      };
    } catch (error) {
      logError('Failed to generate upload URL', error);
      throw error;
    }
  }

  async getObjectFile(objectPath) {
    try {
      if (!objectPath.startsWith('/objects/')) {
        throw new Error('Invalid object path');
      }

      const parts = objectPath.slice(1).split('/');
      if (parts.length < 2) {
        throw new Error('Invalid object path format');
      }

      const entityId = parts.slice(1).join('/');
      let entityDir = this.getPrivateObjectDir();
      if (!entityDir.endsWith('/')) {
        entityDir = `${entityDir}/`;
      }

      const fullPath = `${entityDir}${entityId}`;
      const { bucketName, objectName } = this.parseObjectPath(fullPath);

      const bucket = this.storage.bucket(bucketName);
      const file = bucket.file(objectName);

      const [exists] = await file.exists();
      if (!exists) {
        throw new Error('Object not found');
      }

      return file;
    } catch (error) {
      logError('Failed to get object file', error);
      throw error;
    }
  }

  async downloadObject(file, res, cacheTtlSec = 3600) {
    try {
      const [metadata] = await file.getMetadata();

      res.set({
        'Content-Type': metadata.contentType || 'application/octet-stream',
        'Content-Length': metadata.size,
        'Cache-Control': `public, max-age=${cacheTtlSec}`
      });

      const stream = file.createReadStream();

      stream.on('error', (err) => {
        logError('Stream error', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      });

      stream.pipe(res);
    } catch (error) {
      logError('Error downloading file', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error downloading file' });
      }
    }
  }

  parseObjectPath(path) {
    if (!path.startsWith('/')) {
      path = `/${path}`;
    }
    const pathParts = path.split('/');
    if (pathParts.length < 3) {
      throw new Error('Invalid path: must contain at least a bucket name');
    }

    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join('/');

    return {
      bucketName,
      objectName
    };
  }

  async signObjectURL({ bucketName, objectName, method, ttlSec }) {
    try {
      const request = {
        bucket_name: bucketName,
        object_name: objectName,
        method,
        expires_at: new Date(Date.now() + ttlSec * 1000).toISOString()
      };

      const response = await fetch(
        `${REPLIT_SIDECAR_ENDPOINT}/object-storage/signed-object-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request)
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to sign object URL, errorcode: ${response.status}, make sure you're running on Replit`
        );
      }

      const { signed_url: signedURL } = await response.json();
      return signedURL;
    } catch (error) {
      logError('Failed to sign object URL', error);
      throw error;
    }
  }

  normalizeObjectPath(rawPath) {
    if (!rawPath.startsWith('https://storage.googleapis.com/')) {
      return rawPath;
    }

    const url = new URL(rawPath);
    const rawObjectPath = url.pathname;

    let objectEntityDir = this.getPrivateObjectDir();
    if (!objectEntityDir.endsWith('/')) {
      objectEntityDir = `${objectEntityDir}/`;
    }

    if (!rawObjectPath.startsWith(objectEntityDir)) {
      return rawObjectPath;
    }

    const entityId = rawObjectPath.slice(objectEntityDir.length);
    return `/objects/${entityId}`;
  }
}

module.exports = new ObjectStorageService();
