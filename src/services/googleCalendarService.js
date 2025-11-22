const { google } = require('googleapis');
const ProviderSettings = require('../models/ProviderSettings');
const { logInfo, logError, logWarning } = require('../utils/logger');
const encryptionUtils = require('../utils/encryption');

class GoogleCalendarService {
  constructor() {
    this.clientId = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.BASE_URL || 'http://localhost:3000'}/api/google-calendar/callback`;
    
    if (!this.clientId || !this.clientSecret) {
      logWarning('Google Calendar credentials not configured (optional feature - premium users only)');
    }
  }

  getOAuth2Client() {
    return new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri
    );
  }

  generateAuthUrl(userId) {
    const oauth2Client = this.getOAuth2Client();
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      prompt: 'consent',
      state: userId
    });
    
    return authUrl;
  }

  async handleCallback(code, userId) {
    try {
      const oauth2Client = this.getOAuth2Client();
      
      const { tokens } = await oauth2Client.getToken(code);
      
      await this.saveTokens(userId, tokens);
      
      logInfo('Google Calendar connected successfully', { userId });
      
      return { success: true };
    } catch (error) {
      logError('Failed to handle OAuth callback', error);
      throw error;
    }
  }

  async saveTokens(userId, tokens) {
    try {
      const encryptedAccessToken = encryptionUtils.encryptData(tokens.access_token);
      const encryptedRefreshToken = encryptionUtils.encryptData(tokens.refresh_token);
      
      await ProviderSettings.findOneAndUpdate(
        { userId },
        {
          $set: {
            'googleCalendar.enabled': true,
            'googleCalendar.accessToken': encryptedAccessToken,
            'googleCalendar.refreshToken': encryptedRefreshToken,
            'googleCalendar.tokenExpiry': tokens.expiry_date,
            'googleCalendar.lastSync': new Date()
          }
        },
        { upsert: true, new: true }
      );
      
      logInfo('Google Calendar tokens saved (encrypted)', { userId });
    } catch (error) {
      logError('Failed to save Google Calendar tokens', error);
      throw error;
    }
  }

  async getAuthenticatedClient(userId) {
    try {
      const settings = await ProviderSettings.findOne({ userId });
      
      if (!settings || !settings.googleCalendar || !settings.googleCalendar.refreshToken) {
        throw new Error('Google Calendar not connected');
      }
      
      const decryptedAccessToken = encryptionUtils.decryptData(settings.googleCalendar.accessToken);
      const decryptedRefreshToken = encryptionUtils.decryptData(settings.googleCalendar.refreshToken);
      
      const oauth2Client = this.getOAuth2Client();
      
      oauth2Client.setCredentials({
        access_token: decryptedAccessToken,
        refresh_token: decryptedRefreshToken,
        expiry_date: settings.googleCalendar.tokenExpiry
      });
      
      oauth2Client.on('tokens', async (newTokens) => {
        const tokensToUpdate = {
          'googleCalendar.tokenExpiry': newTokens.expiry_date
        };
        
        if (newTokens.refresh_token) {
          tokensToUpdate['googleCalendar.refreshToken'] = encryptionUtils.encryptData(newTokens.refresh_token);
        }
        if (newTokens.access_token) {
          tokensToUpdate['googleCalendar.accessToken'] = encryptionUtils.encryptData(newTokens.access_token);
        }
        
        await ProviderSettings.findOneAndUpdate(
          { userId },
          { $set: tokensToUpdate }
        );
        
        logInfo('Google Calendar tokens refreshed', { userId });
      });
      
      return oauth2Client;
    } catch (error) {
      logError('Failed to get authenticated Google Calendar client', error);
      throw error;
    }
  }

  async createEvent(userId, eventData) {
    try {
      const authClient = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: authClient });
      
      const settings = await ProviderSettings.findOne({ userId });
      const calendarId = settings?.googleCalendar?.calendarId || 'primary';
      
      const event = {
        summary: eventData.summary,
        description: eventData.description || '',
        start: {
          dateTime: eventData.startTime,
          timeZone: eventData.timeZone || 'Asia/Jerusalem'
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: eventData.timeZone || 'Asia/Jerusalem'
        },
        attendees: eventData.attendees || [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 }
          ]
        }
      };
      
      if (eventData.location) {
        event.location = eventData.location;
      }
      
      const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
        sendUpdates: 'all'
      });
      
      logInfo('Google Calendar event created', { 
        userId, 
        eventId: response.data.id,
        summary: eventData.summary 
      });
      
      return {
        success: true,
        eventId: response.data.id,
        eventLink: response.data.htmlLink
      };
    } catch (error) {
      logError('Failed to create Google Calendar event', error);
      
      if (error.code === 401 || error.message.includes('invalid_grant')) {
        await ProviderSettings.findOneAndUpdate(
          { userId },
          {
            $set: {
              'googleCalendar.enabled': false
            }
          }
        );
      }
      
      throw error;
    }
  }

  async disconnect(userId) {
    try {
      await ProviderSettings.findOneAndUpdate(
        { userId },
        {
          $set: {
            'googleCalendar.enabled': false,
            'googleCalendar.accessToken': null,
            'googleCalendar.refreshToken': null,
            'googleCalendar.tokenExpiry': null
          }
        }
      );
      
      logInfo('Google Calendar disconnected', { userId });
      
      return { success: true };
    } catch (error) {
      logError('Failed to disconnect Google Calendar', error);
      throw error;
    }
  }

  async getConnectionStatus(userId) {
    try {
      const settings = await ProviderSettings.findOne({ userId });
      
      if (!settings || !settings.googleCalendar) {
        return { connected: false };
      }
      
      return {
        connected: settings.googleCalendar.enabled || false,
        calendarId: settings.googleCalendar.calendarId || 'primary',
        lastSync: settings.googleCalendar.lastSync
      };
    } catch (error) {
      logError('Failed to get Google Calendar connection status', error);
      return { connected: false };
    }
  }

  async getEventsForRange(userId, fromDate, toDate) {
    try {
      const settings = await ProviderSettings.findOne({ userId });
      
      if (!settings || !settings.googleCalendar || !settings.googleCalendar.enabled) {
        return [];
      }

      const authClient = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth: authClient });
      
      const calendarId = settings?.googleCalendar?.calendarId || 'primary';
      
      const response = await calendar.events.list({
        calendarId,
        timeMin: fromDate.toISOString(),
        timeMax: toDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250
      });

      const events = response.data.items || [];
      
      logInfo('Google Calendar events fetched', { 
        userId, 
        count: events.length,
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      });

      return events.map(event => ({
        id: event.id,
        summary: event.summary || 'ללא כותרת',
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        location: event.location || null,
        calendarId: calendarId,
        htmlLink: event.htmlLink
      }));
    } catch (error) {
      logError('Failed to fetch Google Calendar events', { error: error.message, userId });
      return [];
    }
  }
}

module.exports = new GoogleCalendarService();
