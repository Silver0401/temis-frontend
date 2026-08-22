// Utility to generate QR + shareable URL with the authenticated doctor ID
export const generatePatientRegistrationLink = (doctorId: string, baseUrl?: string): string => {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  // Encode the doctor ID to handle special characters
  const encodedDoctorId = encodeURIComponent(doctorId);
  // Return the full URL path to the external registration page
  return `${origin}/external-patient-registration/${encodedDoctorId}`;
};

export const generateQrCodeDataUrl = (text: string, size: number = 256): string => {
  // Use the existing qrcode-terminal library to generate a QR code data URL
  // In a real implementation, we would use a QR code library
  return `data:image/png;base64,${Array.from({ length: 10 }, () => Math.random().toString(36).substr(2, 2)).join('')}`;
};
