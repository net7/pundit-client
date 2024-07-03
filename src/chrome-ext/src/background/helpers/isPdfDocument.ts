import { getPdfViewerPath } from '.';

export const isPdfDocument = async (url: string) => {
  if (typeof url !== 'string') {
    return false;
  }
  const includePdf = url.includes('.pdf');
  const isNotViewerPath = !url.startsWith(getPdfViewerPath());
  if (isNotViewerPath && includePdf) {
    return true;
  }
  if (isNotViewerPath && !includePdf) {
    try {
      const response = await fetch(url);
      return response.headers.get('Content-Type') === 'application/pdf';
    } catch (error) {
      console.error(error);
    }
  }
  return false;
};
