
/**
 * Service for Google Drive Integration
 * Note: Requires a valid CLIENT_ID and API_KEY from Google Cloud Console
 */

// Fix: Declare global google object to resolve 'Cannot find name google' errors
declare const google: any;

const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // Placeholder - user should provide this
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';

let tokenClient: any;
let accessToken: string | null = null;

export const initGoogleAuth = () => {
  return new Promise<void>((resolve, reject) => {
    try {
      // Fix: ensure check doesn't throw if undefined
      if (typeof google === 'undefined') {
          console.warn('Google Identity Services not loaded yet.');
          return;
      }
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error !== undefined) {
            reject(response);
          }
          accessToken = response.access_token;
          resolve();
        },
      });
    } catch (e) {
      reject(e);
    }
  });
};

export const getAccessToken = async (): Promise<string> => {
  if (accessToken) return accessToken;
  
  return new Promise((resolve) => {
    tokenClient.callback = (response: any) => {
      accessToken = response.access_token;
      resolve(accessToken!);
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

export const openDrivePicker = async (onFileSelected: (file: { name: string, content: string, type: string }) => void) => {
  const token = await getAccessToken();
  
  // Fix: Resolve 'google' via global declaration
  const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
    .setMimeTypes('application/pdf,text/csv')
    .setSelectableMimeTypes('application/pdf,text/csv');

  const picker = new google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(token)
    // Fix: Use process.env.API_KEY directly
    .setDeveloperKey(process.env.API_KEY)
    .setCallback(async (data: any) => {
      if (data.action === google.picker.Action.PICKED) {
        const fileId = data.docs[0].id;
        const fileName = data.docs[0].name;
        const mimeType = data.docs[0].mimeType;
        
        // Fetch file content
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        let content: string;
        if (mimeType === 'application/pdf') {
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onload = () => {
            onFileSelected({ name: fileName, content: reader.result as string, type: mimeType });
          };
          reader.readAsDataURL(blob);
        } else {
          content = await response.text();
          onFileSelected({ name: fileName, content, type: mimeType });
        }
      }
    })
    .build();
    
  picker.setVisible(true);
};

export const saveFileToDrive = async (fileName: string, content: string, mimeType: string = 'text/plain') => {
  const token = await getAccessToken();
  
  const metadata = {
    name: fileName,
    mimeType: mimeType,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: mimeType }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  if (!response.ok) {
    throw new Error('Failed to save to Drive');
  }

  return await response.json();
};
