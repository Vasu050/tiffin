import { getAccessToken } from './firebase';

export async function sendEmail(to: string, subject: string, bodyText: string) {
  const token = await getAccessToken();
  if (!token) {
    console.warn("Cannot send email: No active Gmail access token. Sign in with Google to enable.");
    return false;
  }

  const emailLines = [
    `To: ${to}`,
    'Subject: ' + subject,
    '',
    bodyText
  ];
  
  const rawEmail = btoa(emailLines.join('\n')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  try {
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: rawEmail })
    });
    
    if (!res.ok) {
      console.error('Failed to send email. Status:', res.status);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}
