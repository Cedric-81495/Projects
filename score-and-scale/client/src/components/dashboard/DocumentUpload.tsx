// client/src/components/dashboard/DocumentUpload.tsx  (NEW FILE)

import { useState } from 'react';
import { uploadDocument, fetchDocuments, DocType, DocRow } from '../../lib/uploadClient';

const DOC_LABELS: Record<DocType, string> = {
  id: 'Government ID',
  credit_report: 'Credit Report',
  business_doc: 'Business Document',
};

export function DocumentUpload({ enrollmentId }: { enrollmentId: string }) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [uploadingType, setUploadingType] = useState<DocType | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadDocs() {
    try {
      const rows = await fetchDocuments(enrollmentId);
      setDocs(rows);
    } catch {
      setDocs([]);
    } finally {
      setLoaded(true);
    }
  }

  if (!loaded) {
    loadDocs();
  }

  async function handleSelect(type: DocType, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file name later
    if (!file) return;

    setError(null);
    setUploadingType(type);
    try {
      await uploadDocument({ file, enrollmentId, type });
      await loadDocs();
    } catch (err: any) {
      setError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingType(null);
    }
  }

  const docsByType = new Map(docs.map((d) => [d.type, d]));

  return (
    <div className="mt-5 pt-5 border-t border-gray-200 dark:border-[#232323]">
      <h4 className="text-[11px] uppercase tracking-wide font-medium text-gray-400 dark:text-[#6F6F6F] mb-3">
        Documents
      </h4>

      {error && <p className="text-xs text-red-600 dark:text-red-400 mb-3">{error}</p>}

      <div className="space-y-2">
        {(Object.keys(DOC_LABELS) as DocType[]).map((type) => {
          const existing = docsByType.get(type);
          return (
            <div key={type} className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-[#9A9A9A]">{DOC_LABELS[type]}</span>
              {existing ? (
                <a
                  href={existing.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono uppercase tracking-wide text-teal-600 dark:text-teal-400"
                >
                  {existing.status}
                </a>
              ) : (
                <label className="text-xs font-medium text-gray-500 dark:text-[#9A9A9A] border border-gray-300 dark:border-[#333] rounded-lg px-3 py-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#171717]">
                  {uploadingType === type ? 'Uploading…' : 'Upload'}
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    className="hidden"
                    disabled={uploadingType !== null}
                    onChange={(e) => handleSelect(type, e)}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
