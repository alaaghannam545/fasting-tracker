/** Save a file. On iPhone/iPad uses the share sheet (Save to Files), elsewhere a normal download. */
export async function saveFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const file = new File([blob], filename, { type });
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  if (ios && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch {
      /* fall through to download */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
